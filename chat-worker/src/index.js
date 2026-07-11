import { fingerprint, isCacheableQuestion, knowledgeVersion, readCachedJson, writeCachedJson } from "./cache.js";
import { loadConfig } from "./config.js";
import { assertAllowedOrigin, corsHeaders } from "./cors.js";
import { toAppError } from "./errors.js";
import { handleIndexRequest } from "./indexer.js";
import { AnalyticsService, ConfidenceScorer, MemoryManager, MetadataService, RecommendationEngine, SearchRouter } from "./intelligence/index.js";
import { createResponse, createStreamingResponse } from "./openai.js";
import { buildPrompt, formatError, formatResponse, isAnswerable, unavailableResponse } from "./prompt/index.js";
import { enforceRateLimit } from "./rate-limit.js";
import { retrieveKnowledge } from "./retrieval.js";
import { parseChatRequest } from "./validation.js";

function json(body, status, origin, extraHeaders = {}) {
  const headers = corsHeaders(origin);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  for (const [key, value] of Object.entries(extraHeaders)) if (value) headers.set(key, String(value));
  return new Response(JSON.stringify(body), { status, headers });
}

function streamHeaders(origin) {
  const headers = corsHeaders(origin);
  headers.set("Content-Type", "text/event-stream; charset=utf-8");
  headers.set("Cache-Control", "no-cache, no-transform");
  headers.set("Connection", "keep-alive");
  return headers;
}

function eventStream(events, origin) {
  const encoder = new TextEncoder();
  return new Response(new ReadableStream({
    start(controller) {
      for (const event of events) controller.enqueue(encoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`));
      controller.close();
    }
  }), { headers: streamHeaders(origin) });
}

function streamedTextCollector(onText) {
  const decoder = new TextDecoder();
  let buffer = "";
  let answer = "";
  return {
    push(chunk) {
      buffer += decoder.decode(chunk, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() || "";
      for (const event of events) {
        const type = /^event:\s*(.+)$/m.exec(event)?.[1];
        const data = /^data:\s*(.+)$/m.exec(event)?.[1];
        if (type === "response.output_text.delta" && data) {
          try { answer += JSON.parse(data).delta || ""; } catch { /* Upstream event still relays unchanged. */ }
        }
      }
    },
    finish() { onText(answer); }
  };
}

function relayOpenAIStream(upstream, metadata, origin, onFinished) {
  const encoder = new TextEncoder();
  const reader = upstream.response.body.getReader();
  const collector = streamedTextCollector(onFinished);
  const body = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`event: metadata\ndata: ${JSON.stringify(metadata)}\n\n`));
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          collector.push(value);
          controller.enqueue(value);
        }
        collector.finish();
      } catch {
        controller.enqueue(encoder.encode('event: error\ndata: {"message":"The response stream was interrupted."}\n\n'));
      } finally {
        upstream.cleanup();
        controller.close();
      }
    },
    cancel() {
      upstream.cancel();
      upstream.cleanup();
      return reader.cancel();
    }
  });
  return new Response(body, { headers: streamHeaders(origin) });
}

function navigationResponse(destination, conversationId) {
  const { pattern: _pattern, type: destinationType, ...target } = destination;
  return {
    answer: `Opening ${destination.label}.`, sources: [], relatedArticles: [], relatedProjects: [], relatedNotes: [], recommendations: [],
    followUpQuestions: [], suggestedQuestions: [], confidence: "high", conversationId,
    action: { type: "navigate", destinationType, ...target }, success: true
  };
}

export default {
  async fetch(request, env, ctx) {
    let origin = null;
    try {
      const config = loadConfig(env);
      const pathname = new URL(request.url).pathname;
      if (pathname === "/internal/index") {
        if (request.method !== "POST") return json({ error: { code: "not_found", message: "Not found." }, success: false }, 404, null);
        return json(await handleIndexRequest(request, env, config), 200, null);
      }
      origin = assertAllowedOrigin(request, config);
      if (request.method === "OPTIONS" && (pathname === "/chat" || pathname === "/analytics/recommendation-click")) {
        return new Response(null, { status: 204, headers: corsHeaders(origin) });
      }
      const metadataService = new MetadataService(env.KNOWLEDGE_DB);
      const analytics = new AnalyticsService(env.KNOWLEDGE_DB);
      if (pathname === "/analytics/recommendation-click" && request.method === "POST") {
        const body = await request.json();
        if (typeof body?.recommendationId !== "string" || body.recommendationId.length > 512) throw new Error("Invalid recommendationId.");
        analytics.trackInBackground(ctx, "recommendation_click", body.recommendationId);
        return json({ success: true }, 202, origin);
      }
      if (request.method !== "POST" || pathname !== "/chat") {
        return json({ error: { code: "not_found", message: "Not found." }, success: false }, 404, origin);
      }

      const { question, conversationId } = await parseChatRequest(request, config);
      await enforceRateLimit(request, env, config);
      const memory = new MemoryManager(env.KNOWLEDGE_DB, config);
      const conversation = await memory.load(conversationId);
      const route = await new SearchRouter(metadataService).route(question);
      if (route.kind === "navigate") {
        const result = navigationResponse(route.destination, conversationId);
        analytics.trackInBackground(ctx, route.destination.type === "project" ? "project_view" : "navigation", route.destination.id || route.destination.type);
        ctx?.waitUntil?.(memory.recordTurn({ conversationId, question, answer: result.answer, sources: [] }));
        return json(result, 200, origin);
      }

      const wantsStream = request.headers.get("Accept")?.includes("text/event-stream");
      const cacheable = !wantsStream && conversation.messages.length === 0 && !conversation.summary && isCacheableQuestion(question);
      const version = cacheable ? await knowledgeVersion(env, config.cacheVersion) : null;
      const cacheKey = cacheable ? await fingerprint(`${version}:${question}`) : null;
      const cached = cacheKey ? await readCachedJson("response", cacheKey) : null;
      if (cached) {
        const result = { ...cached, conversationId, cache: "hit" };
        analytics.trackInBackground(ctx, "response_cache_hit", question);
        ctx?.waitUntil?.(memory.recordTurn({ conversationId, question, answer: result.answer, sources: result.sources }));
        return json(result, 200, origin);
      }

      const retrievalQuery = memory.buildRetrievalQuery(question, conversation);
      const retrieval = await retrieveKnowledge(retrievalQuery, env, config);
      const recommendationEngine = new RecommendationEngine(metadataService, config);
      const recommendations = await recommendationEngine.recommend({ sources: retrieval.sources });
      const followUpQuestions = recommendationEngine.followUpQuestions({ sources: retrieval.sources });
      const confidenceDetails = new ConfidenceScorer().score(retrieval);
      analytics.trackInBackground(ctx, retrieval.sources.length ? "knowledge_search" : "knowledge_gap", question);

      if (!isAnswerable(retrieval.confidence, retrieval.sources.length)) {
        const result = { ...unavailableResponse({ conversationId, recommendations, followUpQuestions }), confidenceDetails, cache: "miss" };
        ctx?.waitUntil?.(memory.recordTurn({ conversationId, question, answer: result.answer, sources: [] }));
        return wantsStream
          ? eventStream([{ type: "metadata", data: result }, { type: "response.output_text.delta", data: { delta: result.answer } }, { type: "done", data: {} }], origin)
          : json(result, 200, origin);
      }

      const prompt = buildPrompt({ question, retrieval, memory: conversation });
      const streamMetadata = { sources: prompt.sources, recommendations: recommendations.all, relatedArticles: recommendations.articles, relatedProjects: recommendations.projects, relatedNotes: recommendations.notes, followUpQuestions, suggestedQuestions: followUpQuestions, confidence: retrieval.confidence, confidenceDetails, conversationId, cache: "miss" };
      if (wantsStream) {
        const upstream = await createStreamingResponse({ config, instructions: prompt.instructions, input: prompt.input });
        return relayOpenAIStream(upstream, streamMetadata, origin, (answer) => {
          if (answer) ctx?.waitUntil?.(memory.recordTurn({ conversationId, question, answer, sources: prompt.sources }));
        });
      }
      const response = await createResponse({ config, instructions: prompt.instructions, input: prompt.input });
      const result = { ...formatResponse(response, { sources: prompt.sources, confidence: retrieval.confidence, maxAnswerChars: config.maxAnswerChars, recommendations, followUpQuestions, conversationId }), confidenceDetails, cache: "miss" };
      analytics.trackInBackground(ctx, "knowledge_answer", retrieval.sources.map((source) => source.category).join(","));
      ctx?.waitUntil?.(memory.recordTurn({ conversationId, question, answer: result.answer, sources: result.sources }));
      if (cacheKey) writeCachedJson("response", cacheKey, { ...result, conversationId: undefined, cache: undefined }, config.responseCacheTtlSeconds, ctx);
      return json(result, 200, origin);
    } catch (error) {
      const appError = toAppError(error);
      return json(formatError(appError), appError.status, origin, { "Retry-After": appError.retryAfter });
    }
  }
};

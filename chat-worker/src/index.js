import { fingerprint, isCacheableQuestion, knowledgeVersion, readCachedJson, writeCachedJson } from "./cache.js";
import { loadConfig } from "./config.js";
import { assertAllowedOrigin, corsHeaders } from "./cors.js";
import { toAppError } from "./errors.js";
import { handleIndexRequest } from "./indexer.js";
import { AnalyticsService, ConfidenceScorer, MemoryManager, MetadataService, RecommendationEngine, SearchRouter } from "./intelligence/index.js";
import { createResponse } from "./ai.js";
import { enforceFreeUsageLimit, enforceStrictRequestLimit } from "./quota.js";
import { buildPrompt, classifyQuestionIntent, conciseAchievementResponse, expandRetrievalQuery, formatError, formatResponse, isAnswerable, isSubjectiveProfileQuestion, unavailableResponse } from "./prompt/index.js";
import { enforceRateLimit } from "./rate-limit.js";
import { assessLexicalRelevance, retrieveKnowledge, searchLexicalKnowledge } from "./retrieval.js";
import { parseChatRequest } from "./validation.js";

const ANSWER_POLICY_VERSION = "visitor-intent-v47-resume-evidence";
const RETRYABLE_MODEL_OUTPUT_CODES = new Set(["workers_ai_invalid_response", "empty_model_response", "invalid_model_response", "uncited_model_response"]);

async function generateVerifiedResponse({ env, config, prompt, formatOptions }) {
  let firstFailureCode = null;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await createResponse({ env, config, instructions: prompt.instructions, input: prompt.input });
      return { result: formatResponse(response, formatOptions), recoveredFrom: firstFailureCode };
    } catch (error) {
      if (attempt === 2 || !RETRYABLE_MODEL_OUTPUT_CODES.has(error?.code)) throw error;
      firstFailureCode = error.code;
      console.warn(JSON.stringify({ event: "ask_mantosh_model_output_retry", code: error.code, attempt }));
    }
  }
  throw new Error("Model output retry ended unexpectedly.");
}

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

function navigationResponse(destination, conversationId) {
  const { pattern: _pattern, type: destinationType, answer, ...target } = destination;
  return {
    answer: answer || `Opening ${destination.label}.`, sources: [], relatedArticles: [], relatedProjects: [], relatedNotes: [], recommendations: [],
    followUpQuestions: [], suggestedQuestions: [], confidence: "high", conversationId,
    action: { type: "navigate", destinationType, ...target }, success: true
  };
}

function socialResponse(response, conversationId) {
  return {
    answer: response.answer, sources: [], relatedArticles: [], relatedProjects: [], relatedNotes: [], recommendations: [],
    followUpQuestions: response.followUpQuestions, suggestedQuestions: response.followUpQuestions, confidence: response.confidence || "high",
    conversationId, success: true
  };
}

function coverageBand(coverage) {
  if (coverage <= 0) return "coverage_0";
  if (coverage < 0.4) return "coverage_1_39";
  if (coverage < 0.7) return "coverage_40_69";
  return "coverage_70_100";
}

export async function focusRetrievalForIntent(retrieval, intent, env, config) {
  const preferredPath = {
    skills: "knowledge/experience/engineering-capabilities.md",
    fit: "knowledge/resume/professional-experience.md"
  }[intent];
  if (preferredPath) {
    const result = await env.KNOWLEDGE_DB.prepare(
      `SELECT c.chunk_id, c.content, d.title, d.slug, d.category, d.tags, d.summary, d.related_topics, d.path, d.url
       FROM chunks c JOIN documents d ON d.path = c.document_path
       WHERE d.path = ? AND d.visibility = 'public' ORDER BY c.position ASC`
    ).bind(preferredPath).all();
    const complete = [];
    let characters = 0;
    for (const chunk of result.results || []) {
      if (characters + chunk.content.length > config.retrievalMaxContextChars) break;
      complete.push(chunk);
      characters += chunk.content.length;
    }
    if (complete.length) {
      const document = complete[0];
      const category = document.category[0].toUpperCase() + document.category.slice(1).replaceAll("-", " ");
      return {
        ...retrieval,
        chunks: complete,
        sources: [{
          title: document.title, slug: document.slug, category: document.category,
          label: `${category}: ${document.title}`, url: document.url, summary: document.summary,
          tags: document.tags, related_topics: document.related_topics, path: document.path
        }]
      };
    }
  }
  if (intent !== "ownership") return retrieval;
  const projectChunks = retrieval.chunks.filter((chunk) => chunk.category === "project");
  if (!projectChunks.length) return retrieval;
  const paths = new Set(projectChunks.map((chunk) => chunk.path));
  const sources = retrieval.sources.filter((source) => paths.has(source.path));
  const primary = sources[0];
  if (!primary?.path) return { ...retrieval, chunks: projectChunks, sources };
  const result = await env.KNOWLEDGE_DB.prepare(
    `SELECT c.chunk_id, c.content, d.title, d.slug, d.category, d.tags, d.summary, d.related_topics, d.path, d.url
     FROM chunks c JOIN documents d ON d.path = c.document_path
     WHERE d.path = ? AND d.visibility = 'public' ORDER BY c.position ASC`
  ).bind(primary.path).all();
  const complete = [];
  let characters = 0;
  for (const chunk of result.results || []) {
    if (characters + chunk.content.length > config.retrievalMaxContextChars) break;
    complete.push(chunk);
    characters += chunk.content.length;
  }
  return { ...retrieval, chunks: complete.length ? complete : projectChunks, sources: [primary] };
}

export default {
  async fetch(request, env, ctx) {
    let origin = null;
    try {
      const config = loadConfig(env);
      const pathname = new URL(request.url).pathname;
      const isChatEndpoint = pathname === "/" || pathname === "/chat";
      if (pathname === "/health" && request.method === "GET") {
        return json({ success: true, service: "ask-mantosh" }, 200, null);
      }
      if (pathname === "/internal/index") {
        if (request.method !== "POST") return json({ error: { code: "not_found", message: "Not found." }, success: false }, 404, null);
        return json(await handleIndexRequest(request, env, config), 200, null);
      }
      origin = assertAllowedOrigin(request, config);
      if (request.method === "OPTIONS" && (isChatEndpoint || pathname === "/analytics/recommendation-click")) {
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
      if (request.method !== "POST" || !isChatEndpoint) {
        return json({ error: { code: "not_found", message: "Not found." }, success: false }, 404, origin);
      }

      const { question, conversationId, audience } = await parseChatRequest(request, config);
      await enforceRateLimit(request, env, config);
      const memory = new MemoryManager(env.KNOWLEDGE_DB, config);
      const conversation = await memory.load(conversationId);
      const route = await new SearchRouter(metadataService).route(question, { visitorTimeZone: request.cf?.timezone });
      const wantsStream = request.headers.get("Accept")?.includes("text/event-stream");
      if (route.kind === "social" || route.kind === "boundary") {
        const result = socialResponse(route.response, conversationId);
        analytics.trackInBackground(ctx, route.kind === "boundary" ? "scope_boundary" : "conversation", question.toLowerCase());
        ctx?.waitUntil?.(memory.recordTurn({ conversationId, question, answer: result.answer, sources: [] }));
        return wantsStream
          ? eventStream([{ type: "metadata", data: result }, { type: "response.output_text.delta", data: { delta: result.answer } }, { type: "done", data: {} }], origin)
          : json(result, 200, origin);
      }
      if (route.kind === "navigate") {
        const result = navigationResponse(route.destination, conversationId);
        analytics.trackInBackground(ctx, route.destination.type === "project" ? "project_view" : "navigation", route.destination.id || route.destination.type);
        ctx?.waitUntil?.(memory.recordTurn({ conversationId, question, answer: result.answer, sources: [] }));
        return json(result, 200, origin);
      }

      const cacheable = !wantsStream && conversation.messages.length === 0 && !conversation.summary && isCacheableQuestion(question);
      const version = cacheable ? await knowledgeVersion(env, config.cacheVersion) : null;
      const cacheKey = cacheable ? await fingerprint(`${ANSWER_POLICY_VERSION}:${version}:${audience}:${question}`) : null;
      const cached = cacheKey ? await readCachedJson("response", cacheKey) : null;
      if (cached) {
        const result = { ...cached, conversationId, cache: "hit" };
        analytics.trackInBackground(ctx, "response_cache_hit", question);
        ctx?.waitUntil?.(memory.recordTurn({ conversationId, question, answer: result.answer, sources: result.sources }));
        return json(result, 200, origin);
      }

      const baseRetrievalQuery = memory.buildRetrievalQuery(question, conversation);
      const lexicalMatches = await searchLexicalKnowledge(baseRetrievalQuery, env);
      const lexicalRelevance = assessLexicalRelevance(baseRetrievalQuery, lexicalMatches);
      if (lexicalRelevance.decision === "clearly_unrelated") {
        const result = socialResponse({
          answer: "I’m focused on Mantosh’s published engineering work. Ask about his experience, projects, decisions, or fit for an engineering problem.",
          followUpQuestions: [], confidence: "low"
        }, conversationId);
        result.relevanceGate = lexicalRelevance;
        analytics.trackAggregatesInBackground(ctx, [
          ["relevance_gate", "blocked"],
          ["lexical_coverage", coverageBand(lexicalRelevance.coverage)],
          ["ai_call_avoided", "embedding"],
          ["ai_call_avoided", "generation"]
        ]);
        analytics.trackInBackground(ctx, "scope_boundary", question.toLowerCase());
        ctx?.waitUntil?.(memory.recordTurn({ conversationId, question, answer: result.answer, sources: [] }));
        return wantsStream
          ? eventStream([{ type: "metadata", data: result }, { type: "response.output_text.delta", data: { delta: result.answer } }, { type: "done", data: {} }], origin)
          : json(result, 200, origin);
      }
      analytics.trackAggregatesInBackground(ctx, [
        ["relevance_gate", lexicalRelevance.confidence === "uncertain" ? "continued_uncertain" : "continued_related"],
        ["lexical_coverage", coverageBand(lexicalRelevance.coverage)]
      ]);

      // Only retrieval/AI-bound requests consume the strict shared allowance.
      // Deterministic and cached responses remain protected by the broader
      // per-client abuse limiter above without spending scarce AI capacity.
      await enforceStrictRequestLimit(env, config);
      await enforceFreeUsageLimit(env, config);
      const retrievalQuery = expandRetrievalQuery(question, baseRetrievalQuery);
      const intent = classifyQuestionIntent(question);
      const retrieved = await retrieveKnowledge(retrievalQuery, env, config,
        retrievalQuery === baseRetrievalQuery ? { lexicalMatches } : undefined);
      const retrieval = await focusRetrievalForIntent(retrieved, intent, env, config);
      const recommendationEngine = new RecommendationEngine(metadataService, config);
      const recommendations = await recommendationEngine.recommend({ sources: retrieval.sources });
      const followUpQuestions = recommendationEngine.followUpQuestions({ sources: retrieval.sources, intent, question });
      const confidenceDetails = new ConfidenceScorer().score(retrieval);
      analytics.trackInBackground(ctx, retrieval.sources.length ? "knowledge_search" : "knowledge_gap", question);

      if (!isAnswerable(retrieval.confidence, retrieval.sources.length)) {
        analytics.trackAggregatesInBackground(ctx, [["post_gate_outcome", "knowledge_gap"]]);
        const result = { ...unavailableResponse({ conversationId, recommendations, followUpQuestions }), confidenceDetails, cache: "miss" };
        ctx?.waitUntil?.(memory.recordTurn({ conversationId, question, answer: result.answer, sources: [] }));
        return wantsStream
          ? eventStream([{ type: "metadata", data: result }, { type: "response.output_text.delta", data: { delta: result.answer } }, { type: "done", data: {} }], origin)
          : json(result, 200, origin);
      }

      if (intent === "ownership") {
        const facts = await metadataService.profileFacts();
        const summary = facts?.ownership_summary;
        const highlights = facts?.ownership_highlights;
        const teamContext = facts?.ownership_team_context;
        const source = retrieval.sources[0];
        if (typeof summary === "string" && Array.isArray(highlights) && highlights.length && typeof teamContext === "string" && source?.url) {
          analytics.trackAggregatesInBackground(ctx, [["post_gate_outcome", "grounded_answer"]]);
          const answer = [
            "## Mantosh's ownership", summary,
            "", "## What he personally delivered",
            ...highlights.map((item) => `- ${item}.`),
            "", "## What the team delivered", teamContext,
            "", "## Sources", `- [${source.label}](${source.url})`,
            "", "## Follow-up Questions", ...followUpQuestions.map((item) => `- ${item}`)
          ].join("\n");
          const sources = [source];
          const result = {
            answer, sources, relatedArticles: recommendations.articles, relatedProjects: recommendations.projects,
            relatedNotes: recommendations.notes, recommendations: recommendations.all, followUpQuestions,
            suggestedQuestions: followUpQuestions, confidence: retrieval.confidence, confidenceDetails,
            conversationId, action: null, success: true, cache: "miss"
          };
          analytics.trackInBackground(ctx, "knowledge_answer", source.category);
          ctx?.waitUntil?.(memory.recordTurn({ conversationId, question, answer, sources }));
          if (cacheKey) writeCachedJson("response", cacheKey, { ...result, conversationId: undefined, cache: undefined }, config.responseCacheTtlSeconds, ctx);
          return wantsStream
            ? eventStream([{ type: "metadata", data: result }, { type: "response.output_text.delta", data: { delta: answer } }, { type: "done", data: {} }], origin)
            : json(result, 200, origin);
        }
      }

      const conciseAchievement = conciseAchievementResponse(question, retrieval.sources);
      if (conciseAchievement) {
        analytics.trackAggregatesInBackground(ctx, [["post_gate_outcome", "grounded_answer"]]);
        const sources = [conciseAchievement.source];
        const result = {
          answer: conciseAchievement.answer,
          sources,
          relatedArticles: [], relatedProjects: [], relatedNotes: [], recommendations: [],
          followUpQuestions: [], suggestedQuestions: [], confidence: retrieval.confidence,
          confidenceDetails, conversationId, action: null, success: true, cache: "miss"
        };
        analytics.trackInBackground(ctx, "knowledge_answer", conciseAchievement.source.category);
        ctx?.waitUntil?.(memory.recordTurn({ conversationId, question, answer: result.answer, sources }));
        if (cacheKey) writeCachedJson("response", cacheKey, { ...result, conversationId: undefined, cache: undefined }, config.responseCacheTtlSeconds, ctx);
        return wantsStream
          ? eventStream([{ type: "metadata", data: result }, { type: "response.output_text.delta", data: { delta: result.answer } }, { type: "done", data: {} }], origin)
          : json(result, 200, origin);
      }

      const prompt = buildPrompt({ question, retrieval, memory: conversation, audience });
      analytics.trackAggregatesInBackground(ctx, [["post_gate_outcome", "grounded_answer"]]);
      const formatOptions = { sources: prompt.sources, confidence: retrieval.confidence, maxAnswerChars: config.maxAnswerChars, recommendations, followUpQuestions, conversationId, subjectiveProfile: isSubjectiveProfileQuestion(question) };
      if (wantsStream) {
        const generated = await generateVerifiedResponse({ env, config, prompt, formatOptions });
        const result = { ...generated.result, confidenceDetails, cache: "miss" };
        if (generated.recoveredFrom) analytics.trackInBackground(ctx, "model_output_recovered", generated.recoveredFrom);
        analytics.trackInBackground(ctx, "knowledge_answer", retrieval.sources.map((source) => source.category).join(","));
        ctx?.waitUntil?.(memory.recordTurn({ conversationId, question, answer: result.answer, sources: result.sources }));
        return eventStream([{ type: "metadata", data: result }, { type: "response.output_text.delta", data: { delta: result.answer } }, { type: "done", data: {} }], origin);
      }
      const generated = await generateVerifiedResponse({ env, config, prompt, formatOptions });
      const result = { ...generated.result, confidenceDetails, cache: "miss" };
      if (generated.recoveredFrom) analytics.trackInBackground(ctx, "model_output_recovered", generated.recoveredFrom);
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

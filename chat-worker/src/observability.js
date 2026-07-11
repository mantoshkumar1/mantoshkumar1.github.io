export function requestId() { return crypto.randomUUID(); }
export function elapsedMs(startedAt) { return Math.max(0, Date.now() - startedAt); }

export function observe(env, event) {
  const safe = {
    event: "ask_mantosh", request_id: event.requestId, route: event.route, status: event.status,
    outcome: event.outcome, cache: event.cache || "bypass", code: event.code || "ok",
    confidence: event.confidence || "low", duration_ms: event.durationMs,
    retrieval_ms: event.retrievalMs || 0, ai_ms: event.aiMs || 0,
    prompt_chars: event.promptChars || 0, answer_chars: event.answerChars || 0,
    source_count: event.sourceCount || 0,
    input_tokens: event.inputTokens || 0, output_tokens: event.outputTokens || 0
  };
  console.log(JSON.stringify(safe));
  try {
    env.ANALYTICS?.writeDataPoint({
      blobs: [safe.route, String(safe.status), safe.outcome, safe.cache, safe.code, safe.confidence],
      doubles: [safe.duration_ms, safe.retrieval_ms, safe.ai_ms, safe.prompt_chars, safe.answer_chars, safe.source_count, safe.input_tokens, safe.output_tokens],
      indexes: [safe.request_id]
    });
  } catch { /* Telemetry must never affect traffic. */ }
}

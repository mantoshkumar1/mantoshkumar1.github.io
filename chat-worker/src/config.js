export const DEFAULTS = Object.freeze({
  maxQuestionLength: 1000,
  aiTimeoutMs: 20_000,
  maxOutputTokens: 300,
  retrievalTopK: 5,
  retrievalMaxContextChars: 8_000,
  semanticScoreThreshold: 0.25,
  conversationHistoryTurns: 6,
  conversationTtlSeconds: 86_400,
  recommendationLimit: 6,
  responseCacheTtlSeconds: 600,
  retrievalCacheTtlSeconds: 300,
  embeddingCacheTtlSeconds: 900,
  cacheVersion: "v1",
  maxAnswerChars: 12_000,
  minBotScore: 1,
  enableStreaming: false,
  embeddingModel: "@cf/baai/bge-m3",
  model: "@cf/meta/llama-3.1-8b-instruct-fast",
  freeDailyRequestLimit: 400,
  freePerMinuteRequestLimit: 20
});

function positiveInteger(value, fallback, name) {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${name} configuration.`);
  }
  return parsed;
}

function unitInterval(value, fallback, name) {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) throw new Error(`Invalid ${name} configuration.`);
  return parsed;
}

export function loadConfig(env) {
  const origins = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (origins.length === 0) throw new Error("ALLOWED_ORIGINS is not configured.");

  return Object.freeze({
    allowedOrigins: new Set(origins),
    model: env.AI_MODEL || DEFAULTS.model,
    maxQuestionLength: positiveInteger(env.MAX_QUESTION_LENGTH, DEFAULTS.maxQuestionLength, "MAX_QUESTION_LENGTH"),
    aiTimeoutMs: positiveInteger(env.AI_TIMEOUT_MS, DEFAULTS.aiTimeoutMs, "AI_TIMEOUT_MS"),
    maxOutputTokens: positiveInteger(env.MAX_OUTPUT_TOKENS, DEFAULTS.maxOutputTokens, "MAX_OUTPUT_TOKENS"),
    embeddingModel: env.AI_EMBEDDING_MODEL || DEFAULTS.embeddingModel,
    freeDailyRequestLimit: positiveInteger(env.FREE_DAILY_REQUEST_LIMIT, DEFAULTS.freeDailyRequestLimit, "FREE_DAILY_REQUEST_LIMIT"),
    freePerMinuteRequestLimit: positiveInteger(env.FREE_PER_MINUTE_REQUEST_LIMIT, DEFAULTS.freePerMinuteRequestLimit, "FREE_PER_MINUTE_REQUEST_LIMIT"),
    retrievalTopK: positiveInteger(env.RETRIEVAL_TOP_K, DEFAULTS.retrievalTopK, "RETRIEVAL_TOP_K"),
    retrievalMaxContextChars: positiveInteger(env.RETRIEVAL_MAX_CONTEXT_CHARS, DEFAULTS.retrievalMaxContextChars, "RETRIEVAL_MAX_CONTEXT_CHARS"),
    semanticScoreThreshold: unitInterval(env.SEMANTIC_SCORE_THRESHOLD, DEFAULTS.semanticScoreThreshold, "SEMANTIC_SCORE_THRESHOLD"),
    conversationHistoryTurns: positiveInteger(env.CONVERSATION_HISTORY_TURNS, DEFAULTS.conversationHistoryTurns, "CONVERSATION_HISTORY_TURNS"),
    conversationTtlSeconds: positiveInteger(env.CONVERSATION_TTL_SECONDS, DEFAULTS.conversationTtlSeconds, "CONVERSATION_TTL_SECONDS"),
    recommendationLimit: positiveInteger(env.RECOMMENDATION_LIMIT, DEFAULTS.recommendationLimit, "RECOMMENDATION_LIMIT"),
    responseCacheTtlSeconds: positiveInteger(env.RESPONSE_CACHE_TTL_SECONDS, DEFAULTS.responseCacheTtlSeconds, "RESPONSE_CACHE_TTL_SECONDS"),
    retrievalCacheTtlSeconds: positiveInteger(env.RETRIEVAL_CACHE_TTL_SECONDS, DEFAULTS.retrievalCacheTtlSeconds, "RETRIEVAL_CACHE_TTL_SECONDS"),
    embeddingCacheTtlSeconds: positiveInteger(env.EMBEDDING_CACHE_TTL_SECONDS, DEFAULTS.embeddingCacheTtlSeconds, "EMBEDDING_CACHE_TTL_SECONDS"),
    cacheVersion: env.CACHE_VERSION_FALLBACK || DEFAULTS.cacheVersion,
    maxAnswerChars: positiveInteger(env.MAX_ANSWER_CHARS, DEFAULTS.maxAnswerChars, "MAX_ANSWER_CHARS"),
    minBotScore: positiveInteger(env.MIN_BOT_SCORE, DEFAULTS.minBotScore, "MIN_BOT_SCORE"),
    enableStreaming: env.ENABLE_STREAMING === "true"
  });
}

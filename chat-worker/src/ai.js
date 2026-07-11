import { AppError } from "./errors.js";

function requireAiBinding(env) {
  if (!env.AI?.run) throw new AppError(503, "workers_ai_unconfigured", "The AI service is not configured.");
  return env.AI;
}

async function runAi(env, config, model, input, timeoutCode, timeoutMessage) {
  let timer;
  try {
    return await Promise.race([
      requireAiBinding(env).run(model, input),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new AppError(500, timeoutCode, timeoutMessage)), config.aiTimeoutMs); })
    ]);
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error?.status === 429 || error?.code === 429) {
      throw new AppError(429, "workers_ai_quota_exhausted", "The free AI quota or rate limit has been reached. Please try again after the daily reset.");
    }
    console.error("Workers AI request failed", error instanceof Error ? error.message : error);
    throw new AppError(503, "workers_ai_unavailable", "The AI service is temporarily unavailable.");
  } finally {
    clearTimeout(timer);
  }
}

export async function createResponse({ env, config, instructions, input }) {
  const result = await runAi(env, config, config.model, {
    prompt: `${instructions}\n\n${input}`,
    max_tokens: config.maxOutputTokens,
    temperature: 0.2
  }, "workers_ai_timeout", "The AI service timed out. Please try again.");
  const answer = typeof result === "string" ? result.trim() : String(result?.response || "").trim();
  if (!answer) throw new AppError(500, "workers_ai_invalid_response", "The AI service returned an invalid response.");
  return { output_text: answer };
}

export async function createEmbeddings({ env, config, input }) {
  const result = await runAi(env, config, config.embeddingModel, { text: input }, "embedding_timeout", "Knowledge search timed out. Please try again.");
  const vectors = result?.data;
  if (!Array.isArray(vectors) || vectors.length !== input.length || vectors.some((vector) => !Array.isArray(vector))) {
    throw new AppError(500, "embedding_invalid_response", "Knowledge search returned an invalid response.");
  }
  return vectors;
}

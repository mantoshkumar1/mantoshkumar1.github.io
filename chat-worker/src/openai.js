import { AppError } from "./errors.js";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const OPENAI_EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings";

export async function createResponse({ config, instructions, input }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.openAiTimeoutMs);
  let response;
  try {
    response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: config.model,
        instructions,
        input,
        max_output_tokens: config.maxOutputTokens,
        store: false
      })
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new AppError(500, "upstream_timeout", "The AI service timed out. Please try again.");
    }
    throw new AppError(500, "upstream_unavailable", "The AI service is temporarily unavailable.");
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const retryAfter = response.headers.get("Retry-After");
    if (response.status === 429) {
      throw new AppError(429, "upstream_rate_limited", "The AI service is busy. Please try again shortly.", { retryAfter });
    }
    if (response.status === 401) {
      throw new AppError(401, "upstream_unauthorized", "The AI service rejected the configured credentials.");
    }
    throw new AppError(500, "upstream_error", "The AI service could not process the request.");
  }

  try {
    return await response.json();
  } catch {
    throw new AppError(500, "upstream_invalid_response", "The AI service returned an invalid response.");
  }
}

// Streams OpenAI's native Responses API SSE events without exposing credentials.
export async function createStreamingResponse({ config, instructions, input }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.openAiTimeoutMs);
  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      signal: controller.signal,
      headers: { "Authorization": `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: config.model, instructions, input, max_output_tokens: config.maxOutputTokens, store: false, stream: true })
    });
    if (!response.ok || !response.body) {
      clearTimeout(timeout);
      if (response.status === 429) throw new AppError(429, "upstream_rate_limited", "The AI service is busy. Please try again shortly.", { retryAfter: response.headers.get("Retry-After") });
      if (response.status === 401) throw new AppError(401, "upstream_unauthorized", "The AI service rejected the configured credentials.");
      throw new AppError(500, "upstream_error", "The AI service could not process the request.");
    }
    return { response, cleanup: () => clearTimeout(timeout), cancel: () => controller.abort() };
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof AppError) throw error;
    if (error?.name === "AbortError") throw new AppError(500, "upstream_timeout", "The AI service timed out. Please try again.");
    throw new AppError(500, "upstream_unavailable", "The AI service is temporarily unavailable.");
  }
}

export async function createEmbeddings({ config, input }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.openAiTimeoutMs);
  let response;
  try {
    response = await fetch(OPENAI_EMBEDDINGS_URL, {
      method: "POST",
      signal: controller.signal,
      headers: { "Authorization": `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: config.embeddingModel, input, encoding_format: "float" })
    });
  } catch (error) {
    if (error?.name === "AbortError") throw new AppError(500, "embedding_timeout", "Knowledge search timed out. Please try again.");
    throw new AppError(500, "embedding_unavailable", "Knowledge search is temporarily unavailable.");
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) {
    if (response.status === 429) throw new AppError(429, "embedding_rate_limited", "Knowledge search is busy. Please try again shortly.");
    throw new AppError(500, "embedding_error", "Knowledge search could not be completed.");
  }
  let payload;
  try { payload = await response.json(); } catch { throw new AppError(500, "embedding_invalid_response", "Knowledge search returned an invalid response."); }
  const vectors = payload.data?.map((item) => item.embedding);
  if (!Array.isArray(vectors) || vectors.length !== input.length || vectors.some((vector) => !Array.isArray(vector))) {
    throw new AppError(500, "embedding_invalid_response", "Knowledge search returned an invalid response.");
  }
  return vectors;
}

const CACHE_ORIGIN = "https://ask-mantosh-cache.invalid";

export function isCacheableQuestion(question) {
  return question.length <= 240
    && !/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/.test(question)
    && !/\b(?:\d[ -]?){10,}\b/.test(question)
    && !/https?:\/\//i.test(question);
}

export async function fingerprint(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function cacheRequest(namespace, key) {
  return new Request(`${CACHE_ORIGIN}/${namespace}/${key}`);
}

export async function readCachedJson(namespace, key) {
  if (!globalThis.caches) return null;
  try {
    const response = await caches.default.match(cacheRequest(namespace, key));
    return response?.ok ? await response.json() : null;
  } catch { return null; }
}

export function writeCachedJson(namespace, key, value, ttlSeconds, ctx) {
  if (!globalThis.caches) return;
  const operation = caches.default.put(cacheRequest(namespace, key), new Response(JSON.stringify(value), {
    headers: { "Content-Type": "application/json", "Cache-Control": `public, s-maxage=${ttlSeconds}` }
  })).catch(() => undefined);
  if (ctx?.waitUntil) ctx.waitUntil(operation);
}

export async function knowledgeVersion(env, fallback) {
  try { return (await env.CACHE_VERSION?.get("knowledge-version")) || fallback; } catch { return fallback; }
}

export function bumpKnowledgeVersion(env) {
  if (!env.CACHE_VERSION?.put) return;
  return env.CACHE_VERSION.put("knowledge-version", crypto.randomUUID()).catch(() => undefined);
}

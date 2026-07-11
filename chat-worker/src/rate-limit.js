import { AppError } from "./errors.js";
import { fingerprint } from "./cache.js";

export async function enforceRateLimit(request, env, config) {
  if (!env.RATE_LIMITER?.limit) {
    throw new AppError(503, "rate_limit_unconfigured", "Rate limiting is not configured. Request rejected.");
  }

  const botScore = request.cf?.botManagement?.score;
  if (config.minBotScore > 1 && Number.isFinite(botScore) && botScore < config.minBotScore) {
    throw new AppError(429, "suspected_automation", "This request could not be processed. Please try again later.", { retryAfter: 60 });
  }
  // The public site has no authenticated identity. Hash the best available
  // network fingerprint before passing it to the rate-limiter binding so raw
  // client IP data is neither stored nor logged by this Worker.
  const networkIdentity = `${request.headers.get("CF-Connecting-IP") || "anonymous"}|${request.headers.get("User-Agent") || ""}`;
  let result;
  try {
    result = await env.RATE_LIMITER.limit({ key: await fingerprint(networkIdentity) });
  } catch (error) {
    console.error("Rate limiter failed", error instanceof Error ? error.message : error);
    throw new AppError(503, "rate_limit_unavailable", "Rate limiting is unavailable. Request rejected.");
  }
  if (!result.success) {
    throw new AppError(429, "rate_limited", "Too many requests. Try again shortly.", { retryAfter: 60 });
  }
}

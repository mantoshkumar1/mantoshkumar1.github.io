import { AppError } from "./errors.js";

export function assertAllowedOrigin(request, config) {
  const origin = request.headers.get("Origin");
  // Non-browser clients have no Origin; browser traffic must match the allowlist.
  if (origin && !config.allowedOrigins.has(origin)) {
    throw new AppError(401, "unauthorized", "This origin is not allowed.");
  }
  return origin;
}

export function corsHeaders(origin) {
  const headers = new Headers({
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Expose-Headers": "X-Request-Id, X-Cache",
    "Access-Control-Max-Age": "86400",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "X-Frame-Options": "DENY",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Cross-Origin-Resource-Policy": "same-site",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload"
  });
  if (origin) headers.set("Access-Control-Allow-Origin", origin);
  return headers;
}

# Security standard

## Required controls

- Store `OPENAI_API_KEY` and `INDEXER_TOKEN` as Worker secrets; never put them
  in Wrangler vars, GitHub Actions logs, source code, or frontend JavaScript.
- Use exact-origin CORS, JSON-only requests, a 16 KiB request-body limit,
  normalized text, maximum question length, and a strict request schema.
- Enable the Cloudflare Rate Limiting binding before public launch. Use a
  stable actor key where available; IP-only limits are abuse controls, not
  identity or billing controls.
- Add Worker response headers: CSP `default-src 'none'`, `nosniff`, HSTS,
  `frame-ancestors 'none'`, restrictive Permissions Policy, and no-referrer.
- Render model Markdown through an allowlist sanitizer in the frontend. Never
  set model output with `innerHTML` unless it is sanitized first.
- Keep `store: false` for OpenAI calls. Do not log raw prompts, answers,
  questions, IP addresses, authorization headers, or cookies.

## Prompt injection

Encode visitor input as data and delimit retrieved documents. System
instructions must state that both are untrusted reference data, prohibit role
changes and hidden-prompt disclosure, and require the fixed no-evidence answer.
Validate model output size and reject output that resembles internal prompt
markup. Retrieval confidence is evidence quality, not model certainty.

## Abuse and incident response

Enable Cloudflare WAF/Bot Management where available. Alert on 401/429/5xx
spikes, index-route authorization failures, embedding failures, and abnormal
output token volume. Rotate `OPENAI_API_KEY` or `INDEXER_TOKEN` immediately on
suspected disclosure, redeploy, and invalidate all CI credentials that held the
old index token.

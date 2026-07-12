# Security standard

## Required controls

- Authenticate automatic indexing with short-lived GitHub OIDC identity tokens.
  Validate their signature, audience, repository, workflow, branch, event, and
  expiry. Keep `INDEXER_TOKEN` only as a Worker-side manual recovery secret.
- Use exact-origin CORS, JSON-only requests, a 16 KiB request-body limit,
  normalized text, maximum question length, and a strict request schema.
- Keep the configured Cloudflare Rate Limiting binding mandatory. The Worker
  fails closed if it is absent; D1 minute/day counters add a strict global
  safety boundary. IP-derived limits are abuse controls, not identity controls.
- Add Worker response headers: CSP `default-src 'none'`, `nosniff`, HSTS,
  `frame-ancestors 'none'`, restrictive Permissions Policy, and no-referrer.
- Render model Markdown through an allowlist sanitizer in the frontend. Never
  set model output with `innerHTML` unless it is sanitized first.
- Do not log raw prompts, answers,
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
output volume. Rotate `INDEXER_TOKEN` immediately on suspected disclosure and
redeploy. The automatic GitHub workflow holds no long-lived index credential.

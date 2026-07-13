# Troubleshooting

| Symptom | Safe diagnosis | Action |
| --- | --- | --- |
| `401` | Origin or index identity rejected | For automatic sync, verify `id-token: write`, audience, workflow path, repository, and branch. For manual recovery, rotate `INDEXER_TOKEN`; never log either token. |
| `429 workers_ai_quota_exhausted` | Workers AI free quota or provider rate limit reached | Wait for the daily reset; do not upgrade the account automatically. |
| `429 free_usage_limit_reached` | Configured daily application limit reached | Wait for 00:00 UTC or lower the limit after reviewing usage. |
| `503 rate_limit_*` | Mandatory rate limiter unavailable or missing | Correct the binding before serving chat traffic. |
| `500 workers_ai_timeout` | Workers AI request exceeded timeout | Check provider status and latency metrics; return the retryable user message. |
| `500 embedding_*` | Semantic retrieval unavailable | Check embedding key, model, and provider status; never answer from model memory. |
| No-answer response | No sufficiently grounded result | Verify document visibility, index workflow, vector dimensions, and D1 FTS row. |
| Source URL missing | Invalid metadata/indexing | Fix the Markdown front matter and reindex. |
| Knowledge answer remains stale after sync | `CACHE_VERSION` KV is not configured, so the Cache API can retain an eligible first-turn answer for up to 10 minutes | Confirm the index workflow completed, verify D1 and Vectorize contain the new document, and allow the TTL to expire; purge only as an emergency. |
| Prompt or formatter change is not visible | Response cache still uses the previous answer-policy namespace | Increment `ANSWER_POLICY_VERSION`, run tests, redeploy, and record the deployed version in the canonical system state. |

The current public handler does not emit a request-ID response header. Correlate
an incident with the recorded Worker deployment version, UTC timestamp, route,
status code, and aggregate metric. `src/observability.js` is not wired into the
active handler; do not document its request-ID helper as a production feature.

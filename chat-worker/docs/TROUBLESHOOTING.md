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
| Stale answer | Versioned cache not invalidated | Verify the index workflow bumped knowledge version; purge only as an emergency. |

Use the request ID returned in the response header to correlate Worker logs and
metrics. It is safe to share with operators because it contains no visitor data.

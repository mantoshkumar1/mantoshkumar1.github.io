# Troubleshooting

| Symptom | Safe diagnosis | Action |
| --- | --- | --- |
| `401` | Origin or index credential rejected | Check exact origin and rotate/re-enter `INDEXER_TOKEN`; do not log credentials. |
| `429` | Worker or OpenAI rate limit | Respect `Retry-After`; inspect aggregate rate metrics and bot/WAF controls. |
| `500 upstream_timeout` | OpenAI request exceeded timeout | Check provider status and latency metrics; return the retryable user message. |
| `500 embedding_*` | Semantic retrieval unavailable | Check embedding key, model, and provider status; never answer from model memory. |
| No-answer response | No sufficiently grounded result | Verify document visibility, index workflow, vector dimensions, and D1 FTS row. |
| Source URL missing | Invalid metadata/indexing | Fix the Markdown front matter and reindex. |
| Stale answer | Versioned cache not invalidated | Verify the index workflow bumped knowledge version; purge only as an emergency. |

Use the request ID returned in the response header to correlate Worker logs and
metrics. It is safe to share with operators because it contains no visitor data.

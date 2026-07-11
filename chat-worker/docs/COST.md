# Cost and token controls

## Controls

- Retrieve before generating; never send the full knowledge base.
- Deduplicate chunks and cap retrieved context by character budget.
- Keep the system prompt stable and concise; it benefits from provider prompt
  caching where available.
- Cache public, non-sensitive embeddings for 15 minutes, retrieval for five,
  and complete answers for ten; version retrieval and response keys on reindex.
- Cap output tokens and reject oversized output. Stream for perceived latency,
  not to increase output allowance.

## Estimation

Record `input_tokens` and `output_tokens` from Responses API usage plus
embedding input tokens. Estimate each request as:

```text
(input_tokens × input_price + output_tokens × output_price) / 1,000,000
+ (embedding_tokens × embedding_price) / 1,000,000
```

Keep pricing as deployment configuration or a dashboard calculation, not a
hard-coded application claim. Compare a weekly baseline of cache-hit rate,
retrieval context size, token usage, no-answer rate, and cost per grounded
answer. A response-cache hit avoids both retrieval and generation; an
embedding-cache hit avoids only the embedding request.

# Free-tier and usage controls

## Controls

- Retrieve before generating; never send the full knowledge base.
- Deduplicate chunks and cap retrieved context by character budget.
- Keep the system prompt stable and concise; it benefits from provider prompt
  caching where available.
- Cache public, non-sensitive embeddings for 15 minutes, retrieval for five,
  and complete answers for ten; version retrieval and response keys on reindex.
- Cap output tokens and reject oversized output. Stream for perceived latency,
  not to increase output allowance.

## Usage monitoring

Workers AI's free allocation is finite and resets daily. Monitor its dashboard
usage plus response- and embedding-cache hit rates, retrieval context size,
no-answer rate, and model failures. A response-cache hit avoids both retrieval and generation; an
embedding-cache hit avoids only the embedding request.

## Current limits

Production is configured for five requests per minute and 50 AI-bearing
requests per UTC day, with a 450-token output cap. The Cloudflare rate-limiter
binding and D1 counters are both enforced. The service may become unavailable
after a free allocation is exhausted; it must not silently enable paid usage.

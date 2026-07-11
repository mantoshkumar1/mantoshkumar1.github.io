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
usage plus cache-hit rate, retrieval context size, no-answer rate, and model
cache-hit rate, retrieval context size, no-answer rate, and model
failures. A response-cache hit avoids both retrieval and generation; an
embedding-cache hit avoids only the embedding request.

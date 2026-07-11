# Ask Mantosh production architecture

```text
GitHub Pages → Cloudflare Worker → validation/rate limit → hybrid retrieval
                                                     ↘ D1 FTS5/BM25
                                                      ↘ Vectorize
                                                      ↘ OpenAI embeddings
                                         grounded prompt → OpenAI Responses API
```

The Worker is the only component with the OpenAI credential. The browser sends
only a JSON question and receives a structured response with sources. Markdown
under `knowledge/` is the source of truth; the authenticated index route chunks
and embeds only `visibility: public` documents.

## Trust boundaries

- Treat browser input and retrieved Markdown as untrusted data.
- Allow only configured exact origins; the API uses no cookies, so CSRF tokens
  are not required. Do not add cookie auth without adding origin/CSRF controls.
- Keep the index endpoint separate from the public API and authorize it with a
  Worker secret used only by CI.
- Return generic application errors. Never return provider payloads, stack
  traces, prompt text, or storage internals.

## Retrieval and cache policy

Use hybrid retrieval: semantic Vectorize search for phrasing, D1 FTS5/BM25 for
proper nouns and technologies, then reciprocal-rank fusion. Send only the
highest-ranked, deduplicated chunks within the context budget.

Recommended edge TTLs are 15 minutes for embeddings, 5 minutes for retrieval,
and 10 minutes for complete public answers. Include a knowledge version in
retrieval and response cache keys; bump it after every successful index or
delete. Do not cache questions containing obvious contact details or URLs.
Cloudflare Cache API is data-center local, so treat it as a latency and cost
optimization, never as persistent storage or correctness infrastructure.

## Provider portability

Keep three adapters isolated: `embeddings`, `generation`, and `streaming`.
The public response schema, retrieval interface, prompt builder, and document
schema must not depend on a provider. Anthropic, Azure OpenAI, OpenRouter, and
local models require only adapter and configuration additions; keep the
grounding and output-validation rules unchanged.

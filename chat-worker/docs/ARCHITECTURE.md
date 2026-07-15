# Ask Mantosh production architecture

```text
GitHub Pages → Cloudflare Worker → validation/rate limit → deterministic routing
                                         → D1 lexical relevance gate
                                         → hybrid retrieval when related or uncertain
                                                     ↘ D1 FTS5/BM25
                                                      ↘ Vectorize
                                                      ↘ Workers AI embeddings
                                         grounded prompt → Workers AI generation
```

The Worker reads Cloudflare's managed AI binding from its environment. The browser sends only a JSON question and receives a structured response with sources. Markdown
under `knowledge/` is the source of truth; the authenticated index route chunks
and embeds only `visibility: public` documents.

The canonical `knowledge/faq/about-mantosh.md` document also carries an allowlisted
set of structured public profile facts. The indexer stores them in D1's
`profile_facts` table. Exact questions about current role, employer history,
location, work authorization, experience length, capabilities, or skills read
that table without generation; broader profile questions still use hybrid
retrieval against the reviewed Markdown. The Worker contains routing language
and response templates, not duplicated employer or skill values.

## Trust boundaries

- Treat browser input and retrieved Markdown as untrusted data.
- Allow only configured exact origins; the API uses no cookies, so CSRF tokens
  are not required. Do not add cookie auth without adding origin/CSRF controls.
- Keep the index endpoint separate from the public API. Authorize CI with a
  verified, short-lived GitHub OIDC token and retain a Worker secret only for
  manual recovery.
- Return generic application errors. Never return provider payloads, stack
  traces, prompt text, or storage internals.
- Treat a missing model-authored Sources section as a recoverable formatting
  defect: insert canonical retrieved metadata. Continue rejecting links that
  are not present in the retrieved source allowlist.

## Retrieval and cache policy

Before embedding, the Worker queries D1 FTS5 and evaluates lexical relevance.
Any lexical evidence continues to hybrid retrieval. A sufficiently specific
question with no lexical evidence receives a concise scope response without an
embedding or generation call. Short and ambiguous misses continue to semantic
retrieval, so the gate fails open when relevance is uncertain. The decision is
based on query specificity and retrieval evidence, not a catalogue of unrelated
topics.

Use hybrid retrieval: semantic Vectorize search for phrasing, D1 FTS5/BM25 for
proper nouns and technologies, then reciprocal-rank fusion. Send only the
highest-ranked, deduplicated chunks within the context budget.

Implemented edge TTLs are 15 minutes for embeddings, 5 minutes for retrieval,
and 10 minutes for eligible first-turn public answers. Include a knowledge version in
retrieval and response cache keys; bump it after every successful index or
delete. Do not cache questions containing obvious contact details or URLs.
Cloudflare Cache API is data-center local, so treat it as a latency and cost
optimization, never as persistent storage or correctness infrastructure.

The optional KV-backed knowledge version is not enabled in the committed
production configuration. Until it is provisioned, invalidation uses the
fallback version and TTL expiry. See [`../../docs/SYSTEM_STATE.md`](../../docs/SYSTEM_STATE.md).

## Provider portability seam

Workers AI is the only implemented provider. Generation and embedding calls are
isolated behind `src/ai.js`, while the public response schema, retrieval
interface, prompt builder, and document schema remain provider-neutral. Another
provider would still require a new tested adapter and configuration; portability
is a design seam, not a currently verified deployment capability.

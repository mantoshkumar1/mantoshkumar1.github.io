# Personal website chat Worker

Production backend for the static personal website chat UI. The public API is:

```http
POST /chat
Content-Type: application/json

{"question":"Why did you build PhotoSahi without a backend?"}
```

Successful responses always have this shape:

```json
{"answer":"...","sources":[],"suggestedQuestions":[],"success":true}
```

## Design

- `src/validation.js`: bounded JSON parsing, type checks, control-character removal, and question normalization.
- `src/openai.js`: the only module that speaks to the Responses API. It uses the `gpt-5.5` model, a Worker-side timeout, `store: false`, and never returns upstream details.
- `src/prompt/`: reusable prompt engine for durable policy, injection guardrails, evidence confidence, citations, prompt construction, and response formatting.
- `src/retrieval.js`: hybrid retrieval (semantic Vectorize + D1 FTS5/BM25), reciprocal-rank fusion, context budget enforcement, and public-visibility filtering.
- `src/intelligence/`: session memory, deterministic navigation routing, metadata recommendations, retrieval confidence, and privacy-preserving analytics.
- `src/indexer.js`: authenticated, idempotent document indexing; it is callable only by GitHub Actions and never by the browser.
- `src/prompt.js`: evidence-only answer policy and citation-ready document construction.
- `src/formatter.js`: the stable public response contract.
- `src/rate-limit.js`: calls a Cloudflare Rate Limiting binding when one is configured.

The worker never sees a browser-supplied OpenAI key. `OPENAI_API_KEY` exists only as a Cloudflare Worker secret.

Grounded responses contain `answer`, `sources`, `relatedArticles`,
`relatedProjects`, `relatedNotes`, `recommendations`, `followUpQuestions`,
`suggestedQuestions`, `confidence`, `confidenceDetails`, `conversationId`, and
`success`. `suggestedQuestions` remains for existing frontend compatibility.

## Intelligence layer

Every request takes this path before an OpenAI Responses API call:

1. Validate or create a client-held `conversationId`.
2. Load the bounded session memory and expand retrieval only with the most recent visitor topic.
3. Route deterministic commands such as `Resume`, `Contact`, `Show PhotoSahi`, and `Latest article` directly to a page. These return `action: { type: "navigate", ... }` and do not call OpenAI.
4. Use hybrid retrieval for questions that need an answer, then calculate retrieval evidence confidence.
5. Build metadata-only recommendations and three follow-up questions from public tags and related topics. This requires no generative call.
6. Cache eligible first-turn responses by normalized question and knowledge version. Multi-turn responses are never shared through this cache.

Session records use the same D1 database as the knowledge index, expire after 24 hours by default, and are keyed only by a random conversation ID. Analytics aggregate daily hashed dimensions; they never store IP addresses or raw question text. Apply the new migration whenever provisioning or updating the Worker:

```bash
npx wrangler d1 migrations apply personal-website-knowledge --remote
```

The optional browser event endpoint is `POST /analytics/recommendation-click` with `{"recommendationId":"knowledge/projects/example.md"}`. It records an aggregate click count only.

## Deploy

Prerequisites: a Cloudflare account and Node.js 20+.

```bash
cd chat-worker
npm install
npx wrangler login
npx wrangler secret put OPENAI_API_KEY
npm run deploy
```

Create the Worker by running `npm run deploy`; Wrangler creates or updates the Worker named in `wrangler.toml`. Before production, change `ALLOWED_ORIGINS` to the exact deployed website origin(s). Add a custom Worker route or set the frontend to the returned `*.workers.dev/chat` URL.

For local development, create an untracked `.dev.vars` file:

```dotenv
OPENAI_API_KEY=your-development-key
INDEXER_TOKEN=a-long-random-local-value
```

After adding the D1 and Vectorize bindings, run against the remote knowledge
resources during local development:

```bash
npx wrangler dev --remote
curl -i http://localhost:8787/chat \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://mantoshkumar1.github.io' \
  --data '{"question":"Why did you build PhotoSahi without a backend?"}'
```

Run checks with `npm test`. Test the deployed Worker by replacing the URL below with the deployment URL:

```bash
curl -i https://YOUR-WORKER.workers.dev/chat \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://mantoshkumar1.github.io' \
  --data '{"question":"What do you build?"}'
```

## Before opening the endpoint publicly

Configure the optional Cloudflare Rate Limiting binding shown in `wrangler.toml`. The code already invokes it using `CF-Connecting-IP`; the binding is deliberately absent from source because its namespace is account-specific. Do not rely on CORS as an access-control or abuse-control mechanism.

No application-level user authentication is included: a static public chat client cannot keep a bearer secret. If private access is later needed, put Cloudflare Access in front of the Worker or add a server-side session issuer.

## Knowledge architecture

`knowledge/` is the Git-tracked source of truth. Every knowledge document sits
in `projects/`, `articles/`, `notes/`, `experience/`, `resume/`, or `faq/` and
uses the front matter in [`../knowledge/_template.md`](../knowledge/_template.md), including an explicit public `url`. The structured `sources` response returns this URL so the frontend can render clickable citations.
Only `visibility: public` documents are indexed. A document is chunked into
small, overlapping passages; the Worker sends only the top five passages (and
at most 8,000 characters) to OpenAI.

The retrieval path is hybrid:

1. Generate one `text-embedding-3-small` query embedding.
2. Query Cloudflare Vectorize for semantically similar chunks.
3. Query D1 FTS5/BM25 for exact engineering names, acronyms, and project terms.
4. Fuse both ranked lists with reciprocal-rank fusion, retrieve full chunks from
   D1, and use only public chunks as model context.

This is preferable to keyword-only search (misses semantic phrasing) or
embeddings-only search (can miss exact technologies and names). It remains
small and inexpensive for hundreds of articles, while D1 retains the canonical
chunk text and Vectorize contains only embeddings plus minimal metadata.

## Provision and deploy the knowledge layer

Run these once from `chat-worker`. Do not commit the generated D1 ID.

```bash
npx wrangler d1 create personal-website-knowledge
npx wrangler vectorize create personal-website-knowledge --dimensions=1536 --metric=cosine
npx wrangler d1 migrations apply personal-website-knowledge --remote
```

Copy the D1 and Vectorize binding snippets returned by Cloudflare into the
commented sections of `wrangler.toml`. Then create a long, random value for the
private indexing endpoint and store both required secrets:

```bash
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put INDEXER_TOKEN
npm run deploy
```

The Vectorize dimension must remain `1536` while `EMBEDDING_MODEL` remains
`text-embedding-3-small`. Changing either requires creating a new index and a
full reindex.

## Automatic indexing

The committed GitHub Actions workflow
[`sync-knowledge.yml`](../.github/workflows/sync-knowledge.yml) runs after a
knowledge Markdown change reaches `main`. It indexes only added/modified files,
deletes removed files, and handles renames. Add these repository Actions
secrets:

- `ASK_MANTOSH_INDEXER_URL`: the exact deployed Worker origin, for example `https://personal-website-chat.<subdomain>.workers.dev`
- `ASK_MANTOSH_INDEXER_TOKEN`: the same value stored as the Worker `INDEXER_TOKEN` secret

For the first population, run the workflow manually with **Run workflow**. For
a controlled one-off reindex:

```bash
INDEXER_URL=https://YOUR-WORKER.workers.dev \
INDEXER_TOKEN=YOUR_INDEXER_TOKEN \
node scripts/sync-knowledge.mjs --all
```

The endpoint is intentionally not CORS-enabled. It accepts only a Bearer token,
does not return document content, and excludes `draft` and `private` documents
from public retrieval.

## RAG verification

After adding a public Markdown document and indexing it, test a question tied to
its evidence. Confirm the response lists a structured source, such as
`{"label":"Project: PhotoSahi", ...}`, and test an unrelated query returns
exactly `I haven't written about this topic yet.`. Run `npm test` for request,
retrieval, and failure-path contract tests.

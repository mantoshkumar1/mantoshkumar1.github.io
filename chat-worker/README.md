# Ask Mantosh Worker

Production backend for the static personal website chat UI. The deployed service is `https://ask-mantosh.mantoshk234.workers.dev`. The public API is:

```http
POST /chat (or `POST /` for the deployed Worker root URL)
Content-Type: application/json

{"question":"Why did you build PhotoSahi without a backend?"}
```

Successful responses always have this shape:

```json
{"answer":"...","sources":[],"suggestedQuestions":[],"success":true}
```

## Design

- `src/validation.js`: bounded JSON parsing, type checks, control-character removal, and question normalization.
- `src/ai.js`: isolated Cloudflare Workers AI adapter with Worker-side timeouts; the browser never receives a provider credential.
- `src/prompt/`: reusable prompt engine for durable policy, injection guardrails, evidence confidence, citations, prompt construction, and response formatting.
- `src/retrieval.js`: hybrid retrieval (semantic Vectorize + D1 FTS5/BM25), reciprocal-rank fusion, context budget enforcement, and public-visibility filtering.
- `src/intelligence/`: session memory, deterministic navigation routing, metadata recommendations, retrieval confidence, and privacy-preserving analytics.
- `src/indexer.js`: authenticated, idempotent document indexing; it is callable only by GitHub Actions and never by the browser.
- `src/prompt.js`: evidence-only answer policy and citation-ready document construction.
- `src/formatter.js`: the stable public response contract.
- `src/rate-limit.js`: enforces the mandatory Cloudflare Rate Limiting binding and fails closed when it is missing or unavailable.

The Worker reads the managed Cloudflare `AI` binding from its environment. No OpenAI API key or external model-provider credential is used.

Grounded responses contain `answer`, `sources`, `relatedArticles`,
`relatedProjects`, `relatedNotes`, `recommendations`, `followUpQuestions`,
`suggestedQuestions`, `confidence`, `confidenceDetails`, `conversationId`, and
`success`. `suggestedQuestions` remains for existing frontend compatibility.

## Intelligence layer

Every request takes this path before a Workers AI generation call:

1. Validate or create a client-held `conversationId`.
2. Load the bounded session memory and expand retrieval only with the most recent visitor topic.
3. Route deterministic commands for Home, Projects, Insights, Experience, Resume, Contact, Newsletter, Accessibility, named projects, and the latest article directly to a page. These return `action: { type: "navigate", ... }` and do not call the AI model.
   Greetings, courtesies, capability questions, and a small set of harmless banter also receive deterministic replies so the assistant stays human without becoming an ungrounded general chatbot.
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
npx wrangler secret put INDEXER_TOKEN
npm run deploy
```

`wrangler.toml` already contains the production Worker name, exact GitHub Pages origin, D1 binding, Vectorize binding, Workers AI binding, and mandatory rate-limiter binding. Running `npm run deploy` updates that production Worker. Review the diff, run tests, and validate the bundle with `npx wrangler deploy --dry-run` before deploying; do not treat the production command as a preview deployment. After deployment, record the immutable Worker version in [`../docs/SYSTEM_STATE.md`](../docs/SYSTEM_STATE.md) and run the documented production smoke tests.

For local development, create an untracked `.dev.vars` file:

```dotenv
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

Run `npm test`; it executes the unit/contract tests and the 531 labelled-case offline evaluation: 71 focused regressions plus 460 recruiter, student, curious-visitor, colleague, and founder questions. The current result contains 9,177 objective assertions. Run only that evaluation with `npm run evaluate`. The committed evidence and methodology are documented in [`docs/EVALUATION.md`](docs/EVALUATION.md). Test the deployed Worker with:

```bash
curl -i https://ask-mantosh.mantoshk234.workers.dev/chat \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://mantoshkumar1.github.io' \
  --data '{"question":"What do you build?"}'
```

## Public-endpoint controls

The Cloudflare Rate Limiting binding in `wrangler.toml` is mandatory and the Worker fails closed if it is missing or unavailable. D1 also enforces strict global counters: `FREE_PER_MINUTE_REQUEST_LIMIT` defaults to 30 requests per UTC minute and `FREE_DAILY_REQUEST_LIMIT` defaults to 450 AI-bearing requests per UTC day. Do not rely on CORS as an access-control or abuse-control mechanism.

No application-level user authentication is included: a static public chat client cannot keep a bearer secret. If private access is later needed, put Cloudflare Access in front of the Worker or add a server-side session issuer.

## Knowledge architecture

`knowledge/` is the Git-tracked source of truth. Every knowledge document sits
in `projects/`, `articles/`, `notes/`, `experience/`, `resume/`, or `faq/` and
uses the front matter in [`../knowledge/_template.md`](../knowledge/_template.md), including an explicit public `url`. The structured `sources` response returns this URL so the frontend can render clickable citations.
Only `visibility: public` documents are indexed. A document is chunked into
small, overlapping passages; the Worker sends only the top five passages (and
at most 8,000 characters) to Workers AI.

The retrieval path is hybrid:

1. Generate one Workers AI `@cf/baai/bge-m3` query embedding.
2. Query Cloudflare Vectorize for semantically similar chunks.
3. Query D1 FTS5/BM25 for exact engineering names, acronyms, and project terms.
4. Fuse both ranked lists with reciprocal-rank fusion, retrieve full chunks from
   D1, and use only public chunks as model context.

This is preferable to keyword-only search (misses semantic phrasing) or
embeddings-only search (can miss exact technologies and names). It remains
small and inexpensive for hundreds of articles, while D1 retains the canonical
chunk text and Vectorize contains only embeddings plus minimal metadata.

## Provision and deploy the knowledge layer

These resources are already provisioned in production. Run equivalent commands only when creating an isolated environment or versioned replacement; never overwrite the committed production binding IDs with an unrelated resource.

```bash
npx wrangler d1 create personal-website-knowledge
npx wrangler vectorize create ask-mantosh-knowledge-v3 --dimensions=1024 --metric=cosine
npx wrangler d1 migrations apply personal-website-knowledge --remote
```

For a new environment, copy its returned D1 and Vectorize binding snippets into
an environment-specific Wrangler configuration. Then create a long, random
value for the manual recovery path and store it only as a Worker secret:

```bash
npx wrangler secret put INDEXER_TOKEN
npm run deploy
```

The Vectorize dimension must remain `1024` while `AI_EMBEDDING_MODEL` remains
`@cf/baai/bge-m3`. Changing either requires creating a new index and a
full reindex.

## Automatic indexing

The committed GitHub Actions workflow
[`sync-knowledge.yml`](../.github/workflows/sync-knowledge.yml) runs after a
knowledge Markdown change reaches `main`. It indexes only added/modified files,
deletes removed files, and handles renames. No GitHub Actions secret is needed:
the workflow requests a short-lived GitHub OIDC token, and the Worker verifies
its signature, audience, repository, workflow path, branch, event, and expiry.

For the first population, run the workflow manually with **Run workflow**. For
a controlled one-off reindex:

```bash
INDEXER_URL=https://ask-mantosh.mantoshk234.workers.dev \
INDEXER_TOKEN=YOUR_INDEXER_TOKEN \
node scripts/sync-knowledge.mjs --all
```

The endpoint is intentionally not CORS-enabled. It accepts either the verified
GitHub workflow identity or the manual recovery Bearer token,
does not return document content, and excludes `draft` and `private` documents
from public retrieval.

## Current production state

The authoritative cross-system inventory, active limits, deployment boundaries,
and known limitations are maintained in [`../docs/SYSTEM_STATE.md`](../docs/SYSTEM_STATE.md). This README explains how to operate the Worker; it does not override executable configuration.

## Free-plan safety and monitoring

This Worker makes no paid external API calls. Workers AI is available on the
Cloudflare Workers Free plan with a daily free allocation. Do not enable
Workers Paid or add a payment method for this Worker. In the Cloudflare
dashboard, open **Workers & Pages → Overview** and confirm the account plan is
**Workers Free**; then open **Workers AI → Usage** to monitor daily Neuron
usage. The allocation resets at 00:00 UTC.

The Worker rejects requests after `FREE_PER_MINUTE_REQUEST_LIMIT` or
`FREE_DAILY_REQUEST_LIMIT`, rejects traffic when the Cloudflare limiter is
unavailable, and returns a clear 429 if Workers AI reports quota exhaustion.
These application caps are conservative safety guards; Cloudflare remains the
final free-tier enforcement boundary. Each authenticated indexing upsert also
consumes the daily safety budget, and documents are capped at 20 chunks, so an
automated content sync cannot bypass the free-use guard.

## RAG verification

After adding a public Markdown document and indexing it, test a question tied to
its evidence. Confirm the response lists a structured source, such as
`{"label":"Project: PhotoSahi", ...}`, and test an unrelated query returns
the published evidence boundary without invoking generation. Run `npm test` for
request, retrieval, failure-path, citation, routing, and offline evaluation checks.

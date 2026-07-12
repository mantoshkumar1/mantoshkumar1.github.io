# Mantosh Kumar engineering website

Production source for [mantoshkumar1.github.io](https://mantoshkumar1.github.io/): an evidence-first engineering portfolio, publication, and searchable knowledge interface.

## Current system

The repository contains two deployed surfaces:

1. A static GitHub Pages site with ten SEO-configured HTML documents, project case studies, an engineering-note archive, résumé preview/download, and contact flows.
2. Ask Mantosh, a Cloudflare Worker that answers only from public Markdown under `knowledge/` using hybrid D1 FTS5 and Vectorize retrieval plus Workers AI.

The current production inventory, data flow, deployment paths, controls, and known limits are maintained in [`docs/SYSTEM_STATE.md`](docs/SYSTEM_STATE.md). Start with the [`documentation map`](docs/README.md) for source authority and subsystem references.

## Public content

- `index.html` — positioning, selected systems, experience summary, and Ask Mantosh UI
- `systems/index.html` — engineering-system catalog
- `projects/photosahi.html` — PhotoSahi architecture case study
- `projects/workflow-automation-toolkit.html` — automation toolkit case study
- `thinking/index.html` — engineering Insights archive
- `thinking/engineering-philosophy.html` — evidence-bounded engineering philosophy
- `thinking/why-does-this-still-require-me.html` — engineering-leverage note
- `experience/index.html` — résumé-verified experience and highlights
- `resume/index.html` — résumé summary, browser preview, and PDF download
- `contact/index.html` — prepared email, copy-email, LinkedIn, and GitHub actions
- `404.html` — custom not-found page

## Important source directories

- `assets/` — production CSS, JavaScript, icons, and social image
- `knowledge/` — sole source of truth for Ask Mantosh retrieval documents
- `chat-worker/` — Cloudflare Worker, migrations, tests, and operational documentation
- `scripts/` — deterministic SEO generation, static build, and release audits
- `.github/workflows/` — Pages deployment, technical SEO, and knowledge synchronization

New philosophy, notes, and articles follow [`docs/PUBLISHING_INSIGHTS.md`](docs/PUBLISHING_INSIGHTS.md), which keeps the readable page and Ask Mantosh retrieval source synchronized.

`dist/` is generated and intentionally not committed. `scripts/build-pages.mjs` copies only public assets into it and regenerates SEO metadata there.

## Run locally

From the repository root:

```bash
python3 -m http.server 8000
```

Open `http://127.0.0.1:8000/`. Ask Mantosh accepts the production GitHub Pages origin only, so a local page will show the explicit connection-recovery state rather than bypass production CORS.

## Release verification

Run the same deterministic gates used by CI:

```bash
node scripts/generate-seo.mjs
node scripts/build-pages.mjs
node scripts/audit-site.mjs
node scripts/validate-discoverability.mjs
node scripts/seo-audit.mjs
node scripts/audit-links.mjs
node scripts/audit-docs.mjs
npm test --prefix chat-worker
git diff --check
```

What these gates protect:

- generated canonicals, Open Graph, Twitter Card, JSON-LD, sitemap, and feed metadata;
- exactly one H1 and required semantic/SEO elements on every indexable page;
- internal links, fragments, and public assets;
- discoverability files and crawler policy;
- documentation references that must match the deployed endpoints and configuration;
- Worker request validation, retrieval contracts, rate limits, OIDC indexing, prompt-injection boundaries, failure handling, and SSE output.

## Deployment

Pushing `main` triggers:

- `Build and deploy GitHub Pages` for the static site;
- `Technical SEO` for generated metadata, discoverability, link, and documentation audits;
- `Sync Ask Mantosh knowledge` only when relevant knowledge or indexer files change.

Worker code is deployed separately from `chat-worker/` with Wrangler. Knowledge documents are synchronized independently through GitHub OIDC after reaching `main`; no long-lived GitHub indexing secret is required.

## Publication standard

Public claims must be supported by a visible artifact, the résumé, or a reviewed first-person document. Keep unsupported outcomes, private employer details, inferred metrics, and draft material out of public knowledge. Prefer a smaller authoritative corpus over generic coverage.

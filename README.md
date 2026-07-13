# Mantosh Kumar engineering website

Production source for [mantoshkumar1.github.io](https://mantoshkumar1.github.io/): an evidence-first engineering portfolio, publication, and searchable knowledge interface.

## Current system

The repository contains two deployed surfaces:

1. A static GitHub Pages site with SEO-configured public pages, project case studies, an engineering-note archive, newsletter information, accessible résumé alternatives, and contact flows.
2. Ask Mantosh, a Cloudflare Worker that answers only from public Markdown under `knowledge/` using hybrid D1 FTS5 and Vectorize retrieval plus Workers AI.

The current production inventory, data flow, deployment paths, controls, and known limits are maintained in [`docs/SYSTEM_STATE.md`](docs/SYSTEM_STATE.md). Start with the [`documentation map`](docs/README.md) for source authority and subsystem references.

## Public content

- `index.html` — positioning, selected systems, experience summary, and Ask Mantosh UI
- `projects/index.html` — selected engineering projects
- `projects/engineering-knowledge-system.html` — evidence-first publishing and grounded-AI platform case study
- `projects/photosahi.html` — PhotoSahi architecture case study
- `projects/workflow-automation-toolkit.html` — automation toolkit case study
- `projects/gtt-price-calculator.html` — Indian stock-market GTT calculator case study
- `projects/validation-platform-optical-networking.html` — public, evidence-bounded case study on validation platform and release intelligence
- `insights/index.html` — engineering Insights archive (canonical URL `/insights/`; legacy `/thinking/` URLs redirect here)
- `insights/engineering-philosophy.html` — evidence-bounded engineering philosophy
- `insights/why-does-this-still-require-me.html` — engineering-leverage note
- `insights/release-reports-as-operational-history.html` — operational-history and AI-assisted analysis note
- `insights/complexity-changes-address.html` — distributed-systems trade-off note
- `insights/blockchain-without-a-master-branch.html` — distributed shared-history analogy
- `insights/ownership-before-escalation.html` — proactive engineering-ownership note
- `experience/index.html` — résumé-verified experience and highlights
- `resume/index.html` — résumé summary, browser preview, and PDF download
- `contact/index.html` — prepared email, copy-email, LinkedIn, and GitHub actions
- `newsletter/index.html` — live Buttondown email subscription, newsletter promise, editorial standard, and RSS option
- `accessibility/index.html` — accessibility features, known limits, alternatives, and feedback path
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

On Windows, `python3` may be unavailable; use `python -m http.server 8000` instead.

Open `http://127.0.0.1:8000/`. Ask Mantosh accepts the production GitHub Pages origin only, so a local page will show the explicit connection-recovery state rather than bypass production CORS.

## Release verification

Run the same deterministic gates used by CI:

```bash
npm run verify
git diff --check
```

Or run each step individually:

```bash
node scripts/generate-seo.mjs
node scripts/build-pages.mjs
node scripts/audit-site.mjs
node scripts/validate-discoverability.mjs
node scripts/validate-xml-feeds.mjs
node scripts/seo-audit.mjs
node scripts/audit-links.mjs
node scripts/audit-accessibility.mjs
node scripts/audit-docs.mjs
node scripts/audit-content-sections.mjs
npm test --prefix chat-worker
git diff --check
```

What these gates protect:

- generated canonicals, Open Graph, Twitter Card, JSON-LD, sitemap, and feed metadata;
- exactly one H1 and required semantic/SEO elements on every indexable page;
- internal links, fragments, and public assets;
- discoverability files and crawler policy;
- documentation references that must match the deployed endpoints and configuration;
- public-content counts and explicit empty states for autonomous publication lanes;
- Worker request validation, retrieval contracts, rate limits, OIDC indexing, prompt-injection boundaries, failure handling, and SSE output.

## Deployment

Pushing `main` triggers:

- `Build and deploy GitHub Pages` for the static site;
- `Technical SEO` for generated metadata, discoverability, link, and documentation audits;
- `Sync Ask Mantosh knowledge` only when relevant knowledge or indexer files change.

Worker code is deployed separately from `chat-worker/` with Wrangler. Knowledge documents are synchronized independently through GitHub OIDC after reaching `main`; no long-lived GitHub indexing secret is required.

## Publication standard

Public claims must be supported by a visible artifact, the résumé, or a reviewed first-person document. Keep unsupported outcomes, private employer details, inferred metrics, and draft material out of public knowledge. Prefer a smaller authoritative corpus over generic coverage.

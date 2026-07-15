# Production system state

Verified: 2026-07-15

This document is the canonical description of what is deployed. Architecture proposals and future operating standards in other documents must not be read as already implemented unless they also appear here or in executable configuration.

## Production endpoints

| Surface | Endpoint | Current role |
| --- | --- | --- |
| Website | `https://mantoshkumar1.github.io/` | Static engineering portfolio and publication |
| Ask Mantosh | `https://ask-mantosh.mantoshk234.workers.dev/` | Public evidence-backed question endpoint; accepts `POST /` and `POST /chat` |
| Health | `https://ask-mantosh.mantoshk234.workers.dev/health` | Unauthenticated service health without configuration details |
| Knowledge indexing | `POST /internal/index` | GitHub OIDC or manual recovery token only; intentionally unavailable to browsers through CORS |

Last verified Worker deployment: `9206e7f4-a0be-4049-a369-546e29bc1175`. The active deployed answer-policy cache namespace is `visitor-intent-v25`.

## Published inventory

- SEO-configured public pages: home, projects index, five project case studies, Insights index, six engineering articles and notes, experience, résumé, contact, a live Buttondown email subscription with RSS, accessibility statement, and custom 404.
- 14 public Ask Mantosh documents: five project sources, six Insights sources, two résumé-backed experience and academic-achievement sources, and one evidence-backed profile and fit guide.
- Whole-site Ask Mantosh coverage: 12 evidence-bearing routes, seven deterministic utility destinations, and nine explicit no-index legacy or error routes cover all 28 public HTML routes.
- One résumé PDF served for in-browser preview and explicit download.
- Sitemap, RSS feed, `robots.txt`, `llms.txt`, JSON-LD, Open Graph, Twitter Card, manifest, icons, and a 1200×630 social image.
- A visitor-controlled Auto, Light, Dark, Soft, and High contrast appearance setting. Soft is the first-visit default; an early initializer prevents a dark-theme flash, explicit choices persist on the device, and Auto follows the operating system.
- English remains the authoritative content language. Pages expose standard language metadata and selectable text for browser translation; the site does not infer language from location or load a third-party translation widget.
- Single-destination Insight cards expose the whole card as one link, while project cards preserve separate case-study, product, and source destinations. Long-form Insight pages use a compact reading rhythm distinct from broader landing-page spacing.
- Page density is intentional: homepage sections render at their real height without synthetic off-screen placeholders; landing, case-study, article, and mobile shells use separate compact spacing scales so the next useful decision arrives sooner without reducing touch-target size.

## Visitor flows

```mermaid
flowchart LR
  V["Visitor"] --> H["GitHub Pages"]
  H --> E["Engineering evidence"]
  H --> R["Résumé preview or download"]
  H --> C["Prepared email, copy address, LinkedIn, GitHub"]
  H --> A["Ask Mantosh panel"]
  A --> W["Cloudflare Worker"]
  W --> S["Deterministic greetings, courtesies, and light banter"]
  W --> N["Deterministic navigation"]
  W --> Q["Validated knowledge question"]
  Q --> D["D1 FTS5"]
  Q --> X["Vectorize"]
  Q --> M["Workers AI embedding and generation"]
  D --> G["Grounded answer"]
  X --> G
  M --> G
  G --> A
```

The chat UI streams the response, sanitizes rendered Markdown, presents canonical source chips, preserves server-provided follow-up questions, supports retry/copy actions, traps focus, minimizes without losing the session, exports the visible conversation as a local text file without internal identifiers, and provides an explicit close-and-clear action. Simple greetings, thanks, farewells, capability questions, and bounded light banter receive deterministic conversational replies without retrieval or AI use. Exact public-profile questions read allowlisted facts synchronized from the canonical `about-mantosh` knowledge document into D1; employer, role, location, work-authorization, experience, capability, and skill values are not duplicated in Worker routes. Natural profile wording—including questions about what kind of person or engineer Mantosh is—routes to the published professional profile and technical evidence without inferring private personality. Subjective praise or skepticism is answered as opinion followed by concise published evidence. Home, Projects, Insights, Experience, Resume, Contact, Newsletter, Accessibility, named-project, and latest-article requests navigate directly without retrieval or generation. Unsupported topics receive a helpful scope boundary instead of implying that Mantosh personally has not written about them. If the model omits its Sources section, the Worker inserts the canonical retrieved source rather than exposing an internal citation-formatting failure.

## Knowledge publication flow

1. A reviewed document with complete YAML front matter is committed under `knowledge/`.
2. A push to `main` triggers `.github/workflows/sync-knowledge.yml` for relevant paths.
3. GitHub issues a short-lived OIDC token with audience `ask-mantosh-indexer`.
4. The Worker verifies token signature, repository, workflow, branch, event, audience, and expiry.
5. The indexer validates, chunks, embeds, and upserts public documents into D1 and Vectorize. Allowlisted facts from the canonical profile document also update D1 `profile_facts`; deletes and renames remove prior records.
6. Draft and private documents remain excluded from public retrieval.

## Runtime configuration

The committed production configuration uses:

- exact allowed origin `https://mantoshkumar1.github.io`;
- Workers AI model `@cf/meta/llama-3.1-8b-instruct-fast`;
- embedding model `@cf/baai/bge-m3` with the 1024-dimension `ask-mantosh-knowledge-v3` Vectorize index;
- D1 database `personal-website-knowledge`;
- five retrieved chunks and an 8,000-character context budget;
- 20-second AI timeout, 450 output-token cap, and 6,000-character answer cap;
- five requests per minute through both the Cloudflare rate-limiter binding and D1 safety counter;
- 50 AI-bearing requests per UTC day through D1;
- six retained conversation turns and a 24-hour session TTL.

Cloudflare Cache API stores eligible embeddings, retrieval candidates, and first-turn answers for 15, 5, and 10 minutes respectively. The optional `CACHE_VERSION` KV binding is not configured in the committed production file, so knowledge-index invalidation currently relies on TTL expiry and the fallback version. Answer-policy changes explicitly advance `ANSWER_POLICY_VERSION`—currently `visitor-intent-v25` in source—to avoid serving a response cached under an older formatter or routing contract. This is an explicit known limitation, not an undocumented guarantee.

## Security and privacy controls

- Exact-origin CORS; no browser bearer secret and no cookie authentication.
- Mandatory Cloudflare rate-limiter binding plus strict D1 minute/day counters; the Worker fails closed when the mandatory limiter is unavailable.
- JSON validation, 16 KiB body cap, normalized bounded questions, timeouts, output-size checks, and generic provider errors.
- Evidence-only prompting, public-visibility filtering, prompt-injection boundaries, approved citation URLs, and sanitized frontend Markdown.
- Low-information questions are clarified before retrieval, and semantic-only matches below 0.40 cannot trigger generation without lexical support.
- CSP, HSTS, `nosniff`, frame denial, restrictive permissions policy, and no-referrer on Worker responses.
- No raw question text, IP address, authorization header, or cookie storage in analytics; only aggregate hashed dimensions.

## Deployment and verification

GitHub Pages and technical audits run automatically on pushes to `main`. Worker deployment is a separate Wrangler operation; D1 migrations are additive and must be applied before code that depends on them. The production Worker exposes `/health`, and knowledge synchronization is independent of Worker deployment. The offline evaluator imports the same Worker entry point with controlled bindings, so it does not call the deployed service or consume production quota.

The repository currently enforces:

- static build and SEO generation;
- indexable-page structure and metadata checks;
- crawler/discoverability checks;
- internal link, fragment, and asset validation;
- documentation drift checks;
- autonomous content-lane counts and explicit zero-content states;
- 56 Worker contract, deterministic social, light-banter, navigation, knowledge-backed public-profile fact, privacy-boundary, transcript-derived scope routing, and achievement routing, natural profile-language routing, security, quota, OIDC, retrieval, concise intent-formatting, prompt, citation-repair, repetition and control-tag sanitization, and failure-path tests;
- 531 labelled Ask Mantosh evaluation cases with 9,177 objective assertions: 71 focused regressions plus 460 recruiter, student, curious-visitor, colleague, and founder questions covering social, navigation, unsupported, achievement, grounded-answer, and adversarial behavior;
- a whole-site coverage audit that fails when any public HTML route lacks reviewed evidence, deterministic navigation, or a documented no-index exclusion;
- static UI guards for immediate safe Markdown rendering.
- 14 Playwright browser checks across desktop and mobile Chromium covering critical-page rendering, the recruiter path, project and Insight navigation, newsletter validation, résumé and contact fallbacks, all appearance choices with Axe WCAG scans, and Ask Mantosh minimize, export, and deliberate-clear behavior;
- generated artifact budgets of 36 KB per HTML page, 100 KB per CSS file, 60 KB total JavaScript, 180 KB per image, and 1 MB for the public artifact excluding the résumé PDF;
- a revision-aware post-deployment smoke check for the homepage, published evaluation evidence, RSS feed, Ask Mantosh health, and deterministic newsletter navigation.

## Known limits

- Only 14 public knowledge documents are indexed; outside deterministic greetings, courtesies, light banter, and navigation, Ask Mantosh keeps answers within published evidence and clearly redirects unsupported topics.
- Public evidence has no fabricated employer metrics or inferred organizational outcomes.
- The Worker uses the Cloudflare free allocation and may return a clear 429 when safety or provider limits are reached.
- There is no authenticated user account, durable personal profile, staging environment declared in this repository, formal accessibility conformance audit, human-rated response benchmark, live-production retrieval benchmark, or automated production Core Web Vitals trace.
- Controlled fixtures make evaluation deterministic but do not measure live Vectorize recall, human preference, or user satisfaction.
- Automated browser coverage currently uses Chromium; Safari, Firefox, and real-device visual review remain manual checks.
- The website origin is GitHub Pages rather than a custom domain.

These limits are deliberate or visible. They should change only with evidence, operational need, and updated documentation.

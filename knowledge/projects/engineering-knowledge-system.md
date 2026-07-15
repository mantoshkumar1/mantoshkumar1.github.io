---
title: "Evidence-First Engineering Knowledge System"
slug: "engineering-knowledge-system"
category: "project"
tags: [platform-engineering, retrieval-augmented-generation, cloudflare-workers, d1, vectorize, workers-ai, github-actions, accessibility, security, developer-experience]
summary: "A production engineering publication and grounded assistant built with GitHub Pages, Cloudflare Workers, hybrid D1 and Vectorize retrieval, evidence-only generation, and automated release gates."
last_updated: "2026-07-15"
related_topics: [ask-mantosh, knowledge-systems, hybrid-retrieval, ci-cd, trust-boundaries]
visibility: "public"
url: "/projects/engineering-knowledge-system.html"
---

# Evidence-First Engineering Knowledge System

## What the system does

Mantosh built this website as a static engineering publication and evidence-backed knowledge interface. Visitors can inspect projects, engineering notes, experience, and résumé material directly or ask Ask Mantosh a question. Ask Mantosh answers only from reviewed public Markdown in the repository.

## Architecture

- GitHub Pages serves the SEO-configured public site and static interaction layer.
- Git-tracked Markdown is the public knowledge source of truth.
- A GitHub Actions workflow uses a short-lived OIDC identity to synchronize approved knowledge changes.
- A Cloudflare Worker validates questions, applies mandatory rate limiting and D1 quotas, handles deterministic greetings and navigation, and coordinates retrieval.
- D1 FTS5/BM25 supports exact terminology; Vectorize supports semantic retrieval; reciprocal-rank fusion combines both result sets.
- Workers AI receives only the selected public context and returns a structured response with approved source URLs.

## Engineering decisions

### Evidence before generation

The Worker does not answer from general model memory when retrieval has no sufficiently grounded public source. It returns a clear no-evidence response instead.

### Deterministic conversation and navigation before inference

Simple greetings, thanks, and farewells receive concise conversational replies without retrieval or AI. Commands for Home, Projects, Insights, Experience, Resume, Contact, Newsletter, Accessibility, named projects, and the latest article are routed directly without a generative model call. This reduces latency, cost, and ambiguity.

Every public HTML route has an explicit Ask Mantosh role. Evidence-bearing project, Insight, experience, achievement, capability, skill, and profile content maps to reviewed knowledge documents. Utility pages map to deterministic navigation. Error pages and legacy redirects are documented no-index exclusions. A CI audit fails if a future page has no classification.

### One profile source, multiple answer paths

The reviewed `about-mantosh` knowledge document is the canonical source for public profile facts such as current role, employer history, location, work authorization, experience length, capabilities, and skills. Its allowlisted structured facts are synchronized into D1 with the rest of the document. Concise fact questions read those values at request time; broader questions continue through evidence retrieval. Updating the knowledge document therefore changes both paths without editing employer or skill values in Worker routing code.

### Separate trust boundaries

The browser holds no provider or indexing secret. Visitor chat, knowledge indexing, AI provider access, and public content are separated. Index synchronization uses GitHub OIDC, with a manually managed token retained only for recovery.

Visitors can export the visible conversation as a local text file. The export contains only the displayed questions and answers—not conversation identifiers, hidden response metadata, or provider details.

### Automated release confidence

Release gates check static generation, SEO, discoverability, internal links, accessibility semantics and preferences, documentation drift, content-lane inventory, Worker contract and security behaviors, and evaluation-result drift. Sixteen Playwright checks exercise eight visitor journeys in desktop and mobile Chromium, including the recruiter path, themes with Axe WCAG scans, forms, contact fallback, and Ask Mantosh session controls. Generated asset budgets guard page weight before publication.

After GitHub Pages deploys, a revision-aware smoke check verifies the exact commit, homepage, published evaluation evidence, RSS feed, Ask Mantosh health, and deterministic newsletter navigation. Browser artifacts are retained for diagnosis. These checks do not claim a formal accessibility audit, cross-browser coverage, human visual approval, or production Core Web Vitals measurements.

## Evaluation evidence

- 531 labelled cases combine 71 focused regressions with 460 persona questions: 100 recruiter, 100 student, 100 curious visitor, 100 colleague, and 60 founder prompts.
- 9,177 objective assertions check response contracts, source selection, citation safety, required and forbidden language, readable Markdown, output bounds, navigation, and expected retrieval or generation calls.
- The first persona run passed 434 of 519 cases. The failures exposed narrow natural-language routing for navigation, public profile facts, work-authorization nuance, conversational recovery, and privacy boundaries; those categories were strengthened before the final all-passing run.
- The evaluator imports the production Worker entry point with controlled D1, Vectorize, Workers AI, and rate-limiter bindings. It runs without calling the deployed Worker or consuming production quota.
- The cases and fixtures live under `chat-worker/eval/`, outside `knowledge/`, so expected answers cannot become retrieval evidence.

## Verifiable implementation

- SEO-configured public pages and structured discoverability files.
- A reviewed public Ask Mantosh knowledge corpus, including this source.
- Sixty-five Worker tests covering contracts, deterministic social and achievement routing, confidence-based lexical relevance gating, privacy-safe aggregate telemetry, quotas, OIDC, retrieval, prompting, citation repair, subjective questions, explicit achievement gating, and failure paths, plus sixteen desktop/mobile browser checks.
- A committed offline evaluation result that currently records 531 of 531 cases and 9,177 of 9,177 objective assertions passing.

## Current limits

The site uses GitHub Pages rather than a custom domain and Cloudflare's free allocation. The repository declares no staging environment, formal accessibility conformance audit, human-rated response benchmark, or live-production retrieval benchmark. Controlled fixtures do not measure live Vectorize recall or human preference. No claim is made about external adoption, traffic, revenue, or organizational impact.

## Evidence boundary

Every claim in this document is supported by the public repository, executable configuration, automated tests, or the canonical production-state documentation. Proposed features and unwired helpers are excluded.

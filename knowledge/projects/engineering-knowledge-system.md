---
title: "Evidence-First Engineering Knowledge System"
slug: "engineering-knowledge-system"
category: "project"
tags: [platform-engineering, retrieval-augmented-generation, cloudflare-workers, d1, vectorize, workers-ai, github-actions, accessibility, security, developer-experience]
summary: "A production engineering publication and grounded assistant built with GitHub Pages, Cloudflare Workers, hybrid D1 and Vectorize retrieval, evidence-only generation, and automated release gates."
last_updated: "2026-07-13"
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

Simple greetings, thanks, and farewells receive concise conversational replies without retrieval or AI. Commands for Resume, Contact, named projects, and the latest article are also routed directly without a generative model call. This reduces latency, cost, and ambiguity.

### Separate trust boundaries

The browser holds no provider or indexing secret. Visitor chat, knowledge indexing, AI provider access, and public content are separated. Index synchronization uses GitHub OIDC, with a manually managed token retained only for recovery.

### Automated release confidence

Release gates check static generation, SEO, discoverability, internal links, accessibility semantics and preferences, documentation drift, content-lane inventory, and Worker contract and security behaviors.

## Verifiable implementation

- SEO-configured public pages and structured discoverability files.
- A reviewed public Ask Mantosh knowledge corpus, including this source.
- Automated tests covering contracts, deterministic social and achievement routing, quotas, OIDC, retrieval, prompting, citation repair, subjective questions, explicit achievement gating, and failure paths.

## Current limits

The site uses GitHub Pages rather than a custom domain and Cloudflare's free allocation. The repository declares no staging environment, formal accessibility conformance audit, or labeled offline retrieval-evaluation set. No claim is made about external adoption, traffic, revenue, or organizational impact.

## Evidence boundary

Every claim in this document is supported by the public repository, executable configuration, automated tests, or the canonical production-state documentation. Proposed features and unwired helpers are excluded.

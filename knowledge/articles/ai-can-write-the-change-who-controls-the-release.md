---
title: "AI Can Write the Change. Who Controls the Release?"
slug: "ai-can-write-the-change-who-controls-the-release"
category: "article"
tags: [ai-assisted-engineering, ci-cd, release-engineering, operational-intelligence]
summary: "A controlled handoff for AI-assisted engineering: AI prepares and reviews, a human authorizes the work, and deterministic automation deploys and records evidence."
last_updated: "2026-10-21"
related_topics: [automation, deployment-verification, evidence-boundaries]
visibility: "draft"
url: "/insights/ai-can-write-the-change-who-controls-the-release.html"
---

# AI Can Write the Change. Who Controls the Release?

## Review status

This is a draft retrieval companion to the article in `docs/drafts/`. Its planned canonical HTML page does not exist yet. It must stay out of public retrieval until editorial and independent technical review, publication integration and founder approval are complete.

## Evidence and decisions

Ask Mantosh is the assistant on Mantosh Kumar's engineering website. Its purpose is to explain and navigate his published professional work. The chat opens at https://mantoshkumar1.github.io/#ask-mantosh.

For the 18 October canary, Codex prepared and self-reviewed the change, Claude provided independent AI review, and Mantosh made the merge decision. Neither AI agent had merge or deployment authority. The article advocates bounding nondeterministic AI tools before production writes or deployment dispatch: AI prepares and reviews, a human authorizes the completed change, and deterministic automation executes verification/deployment and records evidence for later audits. This is design guidance, not a new audit of effective private settings. For ordinary qualifying Worker source, configuration or package changes, a founder merge to main can trigger the automatic GitHub Actions release. Static pages, knowledge documents, documentation and tests alone do not trigger that Worker release. The workflow checks provenance; it does not independently establish review quality.

The automatic workflow binds verification and release to an exact commit. Verification checks the expected Worker configuration, migration/binding constraints, dependencies, tests/evaluation, browser suite and dry run. It selects the latest matching unedited bot receipt and requires success and correlation; a failed latest receipt blocks release until reconciled, rather than falling back to an older success. It then checks the observed sole-100% production version against that baseline before writing.

After an attempt, the workflow requires a zero deploy exit and a new observed version correlated with that attempt. Health, deterministic public-profile answer and streaming smoke checks follow. A final observation requires the new version to remain at sole 100% traffic. A receipt records the result. This is release-time evidence, not continuous monitoring or a comprehensive AI-answer-quality evaluation.

## Verified example

On 18 October 2026, PR106 added only one comment to Worker source. Claude's independent AI review of the Codex-produced change preceded the founder merge. Exact source e506385c9fa08d11f19d73cfb697ab9782331545 triggered automatic run39169924619, completed/success at 21:58:56 UTC. Bot receipt6255657485 reports zero deploy exit, moved-to-this-run correlation, production smoke success and final observation success.

- PR: https://github.com/mantoshkumar1/mantoshkumar1.github.io/pull/106
- Run: https://github.com/mantoshkumar1/mantoshkumar1.github.io/actions/runs/39169924619
- Receipt: https://github.com/mantoshkumar1/mantoshkumar1.github.io/issues/77#issuecomment-6255657485

## Trade-offs and limits

The check before write is not provider compare-and-swap. Shared GitHub Actions concurrency does not exclude dashboard/CLI writers or provide a lossless queue. Private environment and effective provider-access policy require separate evidence; YAML and an old receipt cannot establish them.

The manual workflow is a founder-gated recovery path for current main, used only after disabling/draining automatic release and separately authorizing recovery. Older-version restore is a separate action. There is no automatic rollback or release retry. Pages deployment, Worker release and knowledge synchronization are distinct paths.

The successful comment-only canary demonstrates one exact automatic release, not future correctness, a recovery drill, race exclusion, full-site audit success or measured business impact.

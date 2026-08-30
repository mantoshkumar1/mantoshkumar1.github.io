---
title: "One Bot Can Coordinate Many AI Workers. It Cannot Prove Who They Were."
slug: "one-bot-many-ai-workers"
category: "article"
tags: ["ai-assisted-engineering", "github-apps", "automation", "governance", "multi-agent-systems"]
summary: "A permission and traceability model for using one GitHub App to route work across replaceable AI workers without treating one bot identity as proof of the worker behind it."
last_updated: "2026-08-30"
related_topics: ["dogbuild", "agent-orchestration", "least-privilege", "review-traceability", "message-bus-between-ai-agents"]
visibility: "public"
url: "/insights/one-bot-many-ai-workers.html"
---

# One Bot Can Coordinate Many AI Workers. It Cannot Prove Who They Were.

One private GitHub App can receive repository webhooks and act as a low-permission gateway for AI work without requiring a human GitHub account for every provider and role. A broker behind the App can verify each delivery, select a governed role, and wake an available Claude or Codex worker.

The identity boundary matters: GitHub records the App's bot identity. With one shared App, GitHub does not prove which provider, model, session, or role requested the action. Role and worker labels are semantic traceability, not strong identity proof.

## Recommended starting architecture

1. GitHub sends an issue, pull request, review, workflow, check, or governed push event to one private App.
2. The broker verifies the webhook signature, delivery id, installation, and repository.
3. The broker chooses Strategy, Implementor, or Reviewer from role-specific blank-state entry points.
4. The worker records a start marker containing its role, provider, exact pull-request head SHA, and broker run id.
5. The worker performs only the actions allowed for that role.
6. The worker records a completion marker and evidence on the same task, SHA, and broker lineage.

## Recommended permissions

- **Gateway App:** read repository content, issues, pull requests, workflow results, checks, and statuses; write issue and pull-request trace comments. No code write, merge, administration, secrets, or deployment.
- **Strategy:** read project evidence and write plans, issues, and routing records. No code, merge, secrets, or production action.
- **Implementor:** write only to its task branch and pull request. It may add new tests, but it may not edit or delete existing tests without direct founder approval recorded on the task.
- **Reviewer:** read the exact diff and evidence and write a review anchored to the exact head SHA. No code write or merge.
- **Founder:** retains permission expansion, credentials, test-policy exceptions, destructive actions, and production authority.

Critical role rules cannot be enforced by GitHub permissions when every worker acts through one App. The broker must issue role-scoped internal capabilities, while branch protection and deterministic checks enforce repository boundaries.

## Token-aware routing

Provider availability changes staffing, not authority. Claude and Codex may substitute for one another within the same role contract when availability or token budget changes. The broker must preserve the task and run lineage and record why the handoff occurred.

The producer must not silently satisfy its own independent-review gate. If governance permits an isolated same-provider review, it must start in a fresh session. If a second provider or named reviewer is required and unavailable, the broker queues the review and stops at that gate.

## Trace markers

A reviewer start marker should include at least:

- `REVIEW_STARTED`
- role and provider/model
- authoritative task
- full pull-request head SHA
- broker run id

The completion should be a native review anchored to the same SHA, with `REVIEW_COMPLETE CLEAN` or `REVIEW_COMPLETE CHANGES_REQUESTED` plus the evidence checked. Any head movement invalidates the review.

The markers prove task lineage and declared intent. With one App, they do not cryptographically prove which AI worker produced them.

## When to split identities

Separate private Apps for Strategy, Implementor, and Reviewer provide distinct GitHub-visible bot actors. They are worthwhile when the risk of role impersonation exceeds the operational cost of separate credentials.

Distinct App names alone are not strong separation if one broker holds and can interchange all private keys. Stronger proof requires separate key custody, role-scoped services, and enforcement that prevents one worker from using another role's identity.

The recommended first version is one low-permission gateway App, strict internal role capabilities, exact-SHA trace markers, and deterministic repository gates. DogBuild issue [#144](https://github.com/mantoshkumar1/dogbuild/issues/144) tracks this proposed broker; it is not yet implemented or production-ready.

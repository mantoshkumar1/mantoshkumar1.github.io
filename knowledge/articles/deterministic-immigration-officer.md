---
title: "Deterministic systems should be the immigration officers for AI"
slug: "deterministic-immigration-officer"
category: "article"
tags: [ai-assisted-engineering, governance, testing, deterministic-systems]
summary: "A first-person engineering lesson: let AI reason freely inside bounded space, but require deterministic proof before any sensitive transition is allowed."
last_updated: "2026-08-29"
related_topics: [ai-assisted-engineering, software-testing, release-governance]
visibility: "draft"
url: "/insights/deterministic-immigration-officer.html"
---

# Deterministic systems should be the immigration officers for AI

In my AI-assisted development workflow, a staging transition was blocked even though GitHub accepted the squash merge. The deterministic gate checked a stricter invariant: the resulting staging tree had to equal the exact independently reviewed head tree, and the resulting parent had to equal the reviewed base.

The second change had been reviewed against an older staging base. Another reviewed change landed first. The second merge was conflict-free, but its resulting staging tree now combined both changes and was no longer the exact tree that had been reviewed. The deterministic gate refused deployment.

That failure reinforced a design principle: do not rely on AI agents to remember every safety rule. Put deterministic checks at sensitive borders and make unsafe transitions mechanically impossible.

The mental model is an immigration officer. Before an action crosses a boundary, verify exact identity, authority, state, sequence, destination, and required evidence. If proof is incomplete or stale, stop with no side effect.

For AI-driven software development, one canonical happy path is safer than many loosely equivalent routes. Tests and deterministic constraints should be established before accepting generated implementation. Tests must not be weakened merely to make AI-generated code pass; change them only when product intent changed or the test itself is proven wrong.

Useful deterministic borders include task-to-staging integration, staging-to-production promotion, deployment dispatch, secrets, billing/provider mutations, repository administration, destructive data operations, and authority escalation.

The principle is: let AI be creative before the border. Make the border boring.

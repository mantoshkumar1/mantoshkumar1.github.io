---
title: "Why Does This Still Require Me?"
slug: "why-does-this-still-require-me"
category: "article"
tags: [platform-engineering, automation, delegation, ai-assisted-engineering, developer-productivity]
summary: "A personal engineering heuristic for recognizing repeated work that should become a system, delegated responsibility, or automated workflow."
last_updated: "2026-07-13"
related_topics: [engineering-leverage, workflow-design, operational-ownership]
visibility: "public"
url: "/insights/why-does-this-still-require-me.html"
---

# Why Does This Still Require Me?

## The trigger

Repeatedly making the same decision, answering the same question, collecting the same data, producing the same output, or solving the same class of problem is a signal. The useful question is no longer only how to perform the work faster, but why the work still requires the same person.

## Possible mechanisms

Automation is one response, but not the only one. Repeated work may need a reusable tool, delegated ownership and decision rights, AI assistance, or continued human judgment when the risk and context cannot be reduced safely.

## Design standard

A high-leverage system should continue producing a useful outcome when its original author steps away. That requires explicit inputs, visible state, understandable failure modes, an owner, and a path for exceptions that still require judgment.

## Escalation ladder

- Document rare work when context is easy to lose.
- Automate repeated work when inputs and decisions are stable enough to encode safely.
- Make it self-service when others repeatedly wait for the same execution.
- Move it into a platform when multiple teams need the same dependable capability, ownership, and feedback loop.

Not every documented task deserves automation, and not every automation deserves a platform. Additional ownership should be justified by repetition, risk, and shared demand.

## Review questions

- Does the same work recur often enough to justify a system?
- Which parts are stable, and which still require contextual judgment?
- What is the cost when the workflow is wrong, late, or unavailable?
- Who can understand, operate, and improve it after the author steps away?
- How will the system expose exceptions and show whether it remains useful?

## Evidence boundary

This document records Mantosh Kumar's personal engineering heuristic, adapted from Mantosh Kumar's public LinkedIn post. It does not establish claims about a specific employer, system, adoption level, or measured outcome.

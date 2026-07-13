---
title: "In Distributed Systems, Complexity Changes Address"
slug: "complexity-changes-address"
category: "article"
tags: ["distributed-systems", "system-design", "failure-paths", "architecture-trade-offs"]
summary: "A system-design heuristic for identifying the failure modes and operational responsibilities that an architectural simplification moves elsewhere."
last_updated: "2026-07-13"
related_topics: ["eventual-consistency", "partial-failure", "idempotency", "recovery"]
visibility: "public"
url: "/thinking/complexity-changes-address.html"
---

# In Distributed Systems, Complexity Changes Address

## Core heuristic

Architectural complexity is traded rather than deleted. Removing coordination can introduce eventual consistency. Removing a single point of failure can introduce partial failures. Horizontal scale can introduce retries, duplicates, ordering problems, and network latency.

## Decision questions

- What becomes simpler, and where does the removed responsibility reappear?
- How will the new failure mode be detected and recovered?
- Who owns unresolved exceptions?
- Why is this trade acceptable for this system?

## Failure paths

A happy path demonstrates capability. A failure path reveals operational character. Record the benefit, displaced complexity, detection signal, recovery mechanism, and ownership.

## Evidence boundary

This personal system-design heuristic is adapted from Mantosh Kumar's public LinkedIn post. It excludes claims about a specific production incident, employer architecture, or measured outcome.

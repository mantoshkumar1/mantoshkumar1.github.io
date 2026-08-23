---
title: "Your Agent's Tests Are the Cheapest Check You Have"
slug: "tests-are-the-cheapest-check"
category: "note"
tags: [ai-assisted-engineering, testing-infrastructure, contract-testing, observability, type-safety]
summary: "A test suite is one check among several; contract tests, permissions and secrets, staging evidence, production monitoring and input schemas each catch a class of failure tests cannot, and only some of them survive without being remembered."
last_updated: "2026-08-22"
related_topics: [schemas, permission-boundaries, staging, production-monitoring]
visibility: "public"
url: "/insights/tests-are-the-cheapest-check.html"
---

# Your Agent's Tests Are the Cheapest Check You Have

## Core rule

A check that depends on someone remembering to add it will eventually be absent. Where a check can be made structural, its absence should fail rather than pass silently.

## Five failures a passing suite does not catch

- **An upstream API changes shape.** Tests built on hand-written mock responses verify the mock, not the API. A test that issues a real request detects the change.
- **An over-broad permission or an exposed secret.** A destructive query or a readable production credential is not a testing problem. Restricted database grants and secrets held only in CI remove the capability.
- **A broken deployment.** Unit tests never request a URL, so every test can pass while the deployed site returns errors. One request against the deployed environment after release detects it.
- **A job that stopped running.** Nothing fails when nothing executes. Only production monitoring can observe an expected signal that did not arrive.
- **An invalid input reaching a handler.** A test verifies the input its author chose. An input schema at the boundary rejects every invalid value, including ones never considered.

## Why the schema is the fragile one

Contract tests, permissions, staging checks and monitoring are configured once and then hold without attention. A schema must be added for each new endpoint, which makes it a habit rather than a structure. Under agent-authored change there is no person at that step, so the habit fails.

The remedy is to make registration impossible without validation, so a missing schema prevents startup rather than passing unnoticed.

## Evidence boundary

Personal working preferences from Mantosh Kumar's own projects, where coding agents make unattended changes. The failures illustrate failure modes rather than reported incidents, and no customer impact, outage or measured cost is claimed. Code referenced is illustrative. PingStep is his own product.

---
title: "My Agent's Tests Passed. Nothing Was Watching the Risk."
slug: "nothing-was-watching-the-risk"
category: "note"
tags: [ai-assisted-engineering, testing-infrastructure, contract-testing, observability, code-review]
summary: "A passing check proves nothing when the test mocked away the uncertainty it was meant to examine, or when the file it depends on was never protected."
last_updated: "2026-08-22"
related_topics: [test-automation, mocking, build-health, human-judgment]
visibility: "public"
url: "/insights/nothing-was-watching-the-risk.html"
---

# My Agent's Tests Passed. Nothing Was Watching the Risk.

## Core rule

A check is only a check where uncertainty actually exists. A test whose inputs and responses were written by the same author who wrote the code under test verifies that author's assumptions, not the system's behaviour.

## What happened

An agent-authored change to PingStep passed every gate: tests covering polling and summarisation, a coverage threshold, and a test-count floor. The tests supplied hand-written responses rather than issuing a request, so none of them exercised the path that could not fetch telemetry. Nothing was deleted or weakened, and the change was not detectable by reading the diff.

## Never mock away the thing you are trying to prove

Mocking a clock, an identifier generator, or an unrelated service is reasonable. Mocking the specific behaviour under examination removes the only reason the test exists. Where the question is whether a request retrieves data, a hand-written response answers a different question; a test that issues the real request answers the intended one.

## Path protection does not protect meaning

Restricting edits to a test file protects that file, not the truth of its assertions. A helper the test imports can be changed so an assertion returns early, leaving test names, test count, and result status unchanged. Protection has to be drawn around everything an assertion's truth depends on: helpers, fixtures, gate scripts, baselines, and the configuration that selects the environment.

## The question to ask of any check

What would it take to make this pass while shipping the bug? Where the answer is easy, the check is a convention rather than a control.

## Evidence boundary

The PingStep failure is from Mantosh Kumar's own project and records test coverage rather than impact; no customer impact, outage, measured cost, or vendor is claimed. Code referenced is a reconstruction of the failure's shape rather than a copy of the source. The test-helper example is illustrative of a route being guarded against, not an observed change.

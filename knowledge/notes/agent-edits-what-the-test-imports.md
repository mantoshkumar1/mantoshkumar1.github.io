---
title: "Your Agent Never Edits the Test. It Edits What the Test Imports."
slug: "agent-edits-what-the-test-imports"
category: "note"
tags: [ai-assisted-engineering, ci-cd, codeowners, testing-infrastructure, repository-governance]
summary: "Path-based protection covers a file, not the truth of its assertions; what belongs on a protected list, and why CODEOWNERS only becomes a gate when the agent commits under a separate identity."
last_updated: "2026-08-22"
related_topics: [branch-protection, agent-identity, build-health]
visibility: "public"
url: "/insights/agent-edits-what-the-test-imports.html"
---

# Your Agent Never Edits the Test. It Edits What the Test Imports.

## Core rule

Path-based protection covers a file, not the truth of what the file asserts. An agent editing an unprotected helper can neuter every test that calls it while the protected test file remains untouched, unchanged in name, body and count.

## What belongs on a protected list

The question is not which files are tests, but what the truth of an assertion depends on: test files; helpers, fixtures, factories and custom matchers; CI workflow files; gate scripts and any baseline they compare against; and the configuration that decides which environment tests run in.

## Why CODEOWNERS is not sufficient for a solo maintainer

CODEOWNERS with branch protection is the standard control, but GitHub does not accept a self-approval. With a single identity there is no second party, so the rule never fires. It becomes an enforceable gate only when the agent commits under a separate identity such as a bot account or GitHub App.

## Interim control

A pull-request workflow that fails when a protected path changes without an explicit review label. This is a workaround for the missing second identity rather than a preferred design.

## Evidence boundary

The described workflow runs on Mantosh Kumar's own website repository. The separate agent identity is recommended and not yet implemented.

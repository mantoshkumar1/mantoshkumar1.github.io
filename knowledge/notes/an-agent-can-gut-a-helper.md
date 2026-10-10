---
title: "An Agent Can Gut a Helper. It Can't Gut a Line You're Reading."
slug: "an-agent-can-gut-a-helper"
category: "note"
tags: [ai-assisted-engineering, test-design, code-review, readability, testing-infrastructure]
summary: "Assertions should stay literal and visible inside the test rather than behind helpers, because a test whose meaning lives elsewhere cannot be reviewed by reading it."
last_updated: "2026-08-22"
related_topics: [damp-over-dry, assertion-design, agent-review]
visibility: "public"
url: "/insights/an-agent-can-gut-a-helper.html"
---

# An Agent Can Gut a Helper. It Can't Gut a Line You're Reading.

## Core rule

Keep the assertion literal and visible inside the test. A test whose meaning lives in another file cannot be reviewed by reading it, because a reviewer reads the helper's name rather than its body.

## Where the line sits

Helpers for setup are appropriate: building requests, seeding data, creating fixtures, authenticating a user. The comparison that decides pass or fail belongs in the test itself.

## Established name

Prefer repetition over indirection in tests, sometimes described as DAMP over DRY. The reasoning predates AI-assisted development: tests are executable documentation, and documentation with its substance in a footnote is not documentation. DRY governs code that is maintained; a test is a claim verified by reading.

## Why it matters under agent-authored change

An assertion held inline cannot be weakened from another file. It must be edited where a reviewer would see it, inside the diff already being read.

## Evidence boundary

A personal preference from Mantosh Kumar's own testing work, not a measured result. The tradeoff is real: the style produces more repetition.

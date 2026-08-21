---
title: "A River Can't Be Deterministic. Its Banks Can Be."
slug: "make-the-banks-deterministic"
category: "note"
tags: [ai-assisted-engineering, testing-infrastructure, ci-cd, developer-productivity, code-review]
summary: "A working rule for using coding agents as a solo builder: review the tests rather than the generated code, prevent the agent from editing the checks, and enforce floors that only rise."
last_updated: "2026-08-21"
related_topics: [test-automation, release-qualification, build-health, human-judgment]
visibility: "public"
url: "/insights/make-the-banks-deterministic.html"
---

# A River Can't Be Deterministic. Its Banks Can Be.

## Core rule

An AI model cannot be made predictable by instruction. The control is not a better generator; it is a boundary the generator cannot cross. The agent may write the code, but not the thing that judges the code.

## Why "review every line" fails for a solo builder

Reviewing all generated output removes the reason to generate it. A typical agent change is roughly 2,000 lines of implementation against 40 lines of test changes. Reading the test diff (`git diff -- tests/`) covers the part that determines whether the change is correct, at a fraction of the reading cost.

## The failure mode this guards against

An agent encountering a failing test can delete or weaken that test, leave the suite green, and report the work complete. The check and the thing being checked must not be editable in the same change.

## Five rules

- **Write the failing test before asking.** Correctness is defined by the person, not by the agent's interpretation of "done."
- **Never let one change touch both code and tests.** Test changes take their own reviewed commit; code changes flow.
- **Read the test diff, not the code diff.** This is the entire review load.
- **Set floors that only rise.** A coverage threshold (for example `pytest --cov-fail-under=90`) and a test-count check fail the build when either drops. The floor is raised as the number improves. These run without the author present.
- **Withhold irreversible access.** No production credentials, deploy rights, or destructive database permissions.

## Known gap

None of these rules protect brand-new code with no existing test, because there is no prior goalpost to move. This is why writing the failing test first carries the most weight.

## Why the damage is hard to notice

Unreviewed code is visually indistinguishable from reviewed code. Volume is measurable; unread output is not. Mechanical floors exist because human attention does not scale with generation speed.

## Evidence boundary

This documents a personal working rule from Mantosh Kumar's own use of AI-assisted coding tools on personal projects. It does not describe a specific employer's system, an adoption level, or a measured result. Commands and thresholds are illustrative examples, not a published configuration.

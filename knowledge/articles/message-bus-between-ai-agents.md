---
title: "Why Am I Still the Message Bus Between My AI Agents?"
slug: "message-bus-between-ai-agents"
category: "article"
tags: ["ai-assisted-engineering", "automation", "developer-productivity", "platform-engineering", "multi-agent-systems"]
summary: "A survey of the manual-relay problem in multi-vendor AI coding workflows, using an in-progress local tool (DogBuild) as evidence, and what the rest of the market has and hasn't built yet."
last_updated: "2026-08-08"
related_topics: ["why-does-this-still-require-me", "agents-md", "agent-orchestration", "dogbuild", "pingstep"]
visibility: "public"
url: "/insights/message-bus-between-ai-agents.html"
---

# Why Am I Still the Message Bus Between My AI Agents?

I still copy context between my AI coding agents by hand — a review finding becomes a prompt, a decision made in one chat gets re-explained in the next. Most of that pain already has a fix.

The part that doesn't — the actual handoff — is what I'm building next, and a market review from the day I wrote this (August 2026) says no one else has finished it either.

## The pattern

I run a strong-reasoning agent for planning and review, a cheaper agent for the actual coding, and sometimes a third for a second opinion — different vendors, no shared session. So I carry context between them by hand: a review finding becomes a prompt, a decision made in one chat gets re-explained in the next.

That's the same signal from ["Why Does This Still Require Me?"](../../insights/why-does-this-still-require-me.html): repeated, identical work is a request for a system, not a habit to get faster at.

## What already removes most of the pain

Agents don't need to talk to each other directly. They need to read and write the same durable state.

I run this on [PingStep](https://pingstep.dev), the monitoring product I'm building:

- One project-state file every agent reads before acting, ranked below the task and above chat.
- One operating handbook binding every tool identically: same durable-work rules, same metadata discipline, same baseline checks, same mandatory closeout.
- End-to-end traceability — task → branch → pull request → evidence → merge — so a new agent picks up the full history without me repeating it.
- Only I perform the final merge, so process autonomy never becomes production autonomy.


The baseline check before touching anything, six ordinary git commands, not a custom tool:

```sh
git fetch --prune
git status --short
git branch -vv
git stash list
git rev-parse HEAD
git rev-parse origin/main
```

**This is how it actually runs**, not a proposal: it has already carried work between independent agent sessions from different vendors with no shared chat history, only the repository. [PingStep](https://pingstep.dev) is commercial, so its repository isn't linked beyond the product site above — the pattern itself is what's portable.

## The control loop I'm actually building

None of the above automates the handoff itself. That's what [DogBuild](https://github.com/mantoshkumar1/dogbuild) is for — my own local, file-based coordination layer, in active dogfood.

Its [vision document](https://github.com/mantoshkumar1/dogbuild/blob/main/vision.md) names [PingStep](https://pingstep.dev) as the motivating example: a human manually relaying an implementation result to a reviewer, then relaying the review findings back, every round of fixes. [DogBuild](https://github.com/mantoshkumar1/dogbuild) exists to make that loop automatic, without the human losing authority over it.

The intended loop, once closed:

1. I authorize an objective.
2. [DogBuild](https://github.com/mantoshkumar1/dogbuild) reads current project state from repository evidence, not agent narration.
3. The implementation agent (Claude Code today, replaceable) does the work.
4. [DogBuild](https://github.com/mantoshkumar1/dogbuild) captures the actual commits, tests, and results.
5. The review agent (ChatGPT) checks the implementation against the authoritative task.
6. Fixes route back to the implementer automatically; a genuine product decision stops and asks me.

**What's real today:**

- A persistent `dogBuild>` interface backed by a verified state ledger in the repository's own `.ai/` directory — a session is disposable, the project isn't.
- Built-in commands (`status`, `next`, `plan`, `review`, `refresh`) answered from local state, no model call.
- A hard authority gate: the human decides anything irreversible — push, deploy, merge, publish, delete, spend.


**What's not real yet**, by explicit design in this alpha: the review handoff. [DogBuild](https://github.com/mantoshkumar1/dogbuild)'s own docs say it plainly — "DogBuild does not talk to ChatGPT automatically — transport is manual in this alpha."

So today it removes re-explaining project state every session. It hasn't yet removed me from the loop between implementer and reviewer — the specific claim in this article's title.

That gap — is anyone *else* shipping a finished way to route work between different vendors' coding agents without a human as the dispatcher — was worth checking before assuming I was alone in building toward it.

## What the market actually has

As of August 2026, in the fastest-moving corner of the fastest-moving field in software — treat this as a snapshot, not a standing claim:

- **Shared context is already standardized.** `AGENTS.md` is an open, cross-vendor format now adopted by Codex, Copilot, Gemini, and Cursor. The repository-as-shared-brain pattern isn't a niche workaround; it shows up independently elsewhere.
- **Live handoff is real but early.** Claude Code's own Agent Teams lets sessions coordinate and hand off directly; a couple of small open-source efforts attempt the same across vendors. None of it is install-and-go.
- **Nothing targets this exact shape** — one person mixing a premium-reasoning agent with a cheap implementer across vendors, wanting the dispatch step gone without losing founder-only production control.

## Where this could go

[DogBuild](https://github.com/mantoshkumar1/dogbuild)'s own roadmap names two pieces worth flagging here, clearly as roadmap, not shipped behavior:

- **Reliable handoffs without re-explaining** — a package carrying the objective, decisions, files changed, and unfinished work, so a new agent doesn't need the task re-described from scratch.
- **Decision memory** — recording not just what was decided but why, so an agent can't silently reverse a settled choice it never saw the reasoning for.

Automate only once the inputs and decisions are stable enough to encode safely — the market above says that bar isn't cleared industry-wide yet, even where my own prototype is closing in on it. [DogBuild](https://github.com/mantoshkumar1/dogbuild)'s own documentation records this same tension rather than resolving it early, and that's exactly where it should sit until it's actually settled.

## Evidence boundary

**What this documents:** an in-progress tool ([DogBuild](https://github.com/mantoshkumar1/dogbuild)) I built and actively dogfood in a public repository. It's also a first-person account of the governance technique behind [PingStep](https://pingstep.dev) — commercial, so its repository stays unlinked — plus a review of public multi-agent tooling from that same day, August 2026.

**What it doesn't claim:** that [DogBuild](https://github.com/mantoshkumar1/dogbuild) is complete, adopted, or commercially validated — its own documentation says so. It doesn't claim results beyond DogBuild's own repository, and it doesn't represent an employer's system or decision.

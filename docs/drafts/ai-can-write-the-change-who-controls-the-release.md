# AI Can Write the Change. Who Controls the Release?

> Unpublished draft. Case-study evidence: 18 October 2026.

An AI agent can write a change, run its tests and explain why it looks ready. But who decides it can reach production? And how do you know what actually arrived?

I had to answer those questions for [Ask Mantosh](https://mantoshkumar1.github.io/#ask-mantosh), the assistant that helps visitors explore my published engineering work. Its release path gave me a small, real example of how to divide responsibility between AI, a person and executable checks.

## A small change through the real path

On 18 October, I tested automatic release with one comment in the Worker source. It changed no application behaviour, but exercised the actual path from a reviewed pull request to production.

Codex prepared and self-reviewed the change. Claude, a separate AI reviewer, reviewed it independently. I made the merge decision. Neither AI agent had authority to merge or deploy. For a qualifying Worker change, my merge was the production decision; GitHub Actions then ran verification and release.

[That pull request](https://github.com/mantoshkumar1/mantoshkumar1.github.io/pull/106) triggered [a successful automatic run](https://github.com/mantoshkumar1/mantoshkumar1.github.io/actions/runs/39169924619). The workflow checked the candidate, deployed it, verified the service and posted [a release receipt](https://github.com/mantoshkumar1/mantoshkumar1.github.io/issues/77#issuecomment-6255657485): a GitHub comment recording the source, version and outcome.

Three design choices made that result useful.

## 1. Give each decision an owner

The producer prepares and self-reviews. A different AI reviews independently. I decide whether to merge. The workflow verifies the facts it can check.

Two agreeing AI agents are still two AI agents. Their agreement gives me another assessment; I retain the production decision.

The workflow checks that the exact commit came through the required pull request and my merge. It cannot establish whether the review was thoughtful. That remains part of the working process.

Before giving an agent more access, I would answer: what can it prepare, what can it approve, and what action authorizes production?

## 2. Make every green check belong to one change

A passing test describes the revision it tested. If the branch changes afterward, the earlier result needs to be read in that context.

This release carries one commit SHA through verification and deployment. It checks out that source, runs the release checks, and rechecks current `main` before the production write. If `main` has advanced, the older candidate fails that check.

Verification includes Worker tests, evaluation, browser checks, a dependency audit and a deployment dry run. Documentation or static-page changes alone do not trigger this Worker release: the website, Worker and knowledge index have separate deployment paths.

The lesson is simple: preserve the connection between the change you approved, the source you tested and the source you release.

## 3. Verify what happened after the command

Before writing, the workflow compares the live production version with the latest matching successful release receipt. Unexpected state stops the release. This detects drift, although a read followed by a write cannot exclude another authorized writer racing with it.

Afterward, the observed version must match the version reported by this attempt. The workflow checks health, a public-profile answer and a completed streaming response, then confirms the new version serves all traffic.

The receipt records those observations at release time. It does not prove every answer is correct or that production will remain healthy tomorrow.

I kept recovery deliberate: no automatic rollback or release retry. The smoke probe may poll while a version propagates; repeating a deployment requires a separate decision. The [deployment runbook](https://github.com/mantoshkumar1/mantoshkumar1.github.io/blob/e506385c9fa08d11f19d73cfb697ab9782331545/chat-worker/docs/DEPLOYMENT.md) holds the operational details.

## What I would carry to another AI-assisted project

Name the decision-maker. Bind verification to the approved source. Check the production result and keep a record the next release can use.

My one-comment test did not prove recovery or audit private access settings. It gave me evidence of one complete release, with a clear owner for each decision. That is a useful foundation for giving AI more work while keeping production accountable.

[Try Ask Mantosh](https://mantoshkumar1.github.io/#ask-mantosh) to explore the published work behind this case study.

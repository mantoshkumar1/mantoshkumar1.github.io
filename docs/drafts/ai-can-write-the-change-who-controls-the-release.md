# AI Can Write the Change. Who Controls the Release?

> Draft for editorial and independent technical review. Operational evidence is dated **18 October 2026**. Publication date is intentionally unset.

An AI coding agent can prepare a change, run tests and explain why it looks ready. I still need to answer three questions before treating that change as a successful release: who authorized it, what actually reached production, and what evidence shows it works there?

I worked through those questions while building the release path for [Ask Mantosh](https://mantoshkumar1.github.io/#ask-mantosh), the assistant on my engineering website. It helps visitors explore my published work and decisions. Clicking its name opens the chat, so you can try the system this article describes.

On 18 October, I tested the automatic path with an intentionally small change: one comment in the Worker source. The comment changed no application behaviour. Its purpose was to exercise the real sequence from an approved merge to a deployment and a production check.

That small test made the release contract concrete. The AI could help prepare the work. The decision to merge remained mine. GitHub Actions performed the release through explicit checks, and the result came back as a record I could inspect.

## Make the merge mean something

My operating process separates preparation from approval. Codex, an AI coding agent, prepares and self-reviews a change. Claude, a separate AI reviewer, reviews that change independently. I make the final merge decision.

Those are responsibilities in the development process. The release workflow does not infer that an article is accurate or that a review was thoughtful. It checks a narrower set of machine-readable facts: the expected repository, branch, actor, first run attempt, merged pull request and exact source commit.

For an ordinary qualifying Worker change, my merge is also the production decision. I do not then copy commands into a terminal to repeat that decision manually. The workflow continues only if its checks succeed.

The trigger is deliberately specific. Changes to Worker source, its configuration or package files can start the automatic release after a push to `main`. Documentation, tests, knowledge Markdown and static-page changes alone do not. A direct push without the required founder-merged pull request does not satisfy the provenance checks.

This is ordinary CI/CD machinery applied to AI-assisted work. The useful design choice is deciding which responsibility belongs to a person, which belongs to a reviewer, and which can be checked deterministically.

## Follow one exact change

The workflow carries a full commit SHA through verification and release. It checks the current `main` ref and checks out that exact source. The release job checks it again, including immediately before the production write.

That matters because a green result belongs to a particular revision. A successful test on an earlier branch head does not automatically describe the commit about to be deployed. If `main` advances while a candidate is running, an older run can be stopped by the later source check.

Before deployment, the verification job checks the expected Worker configuration and storage bindings, rejects migrations in this ordinary release path, installs locked dependencies, runs the high-severity dependency audit, Worker tests and evaluation, browser tests, and a Wrangler dry run.

The Cloudflare deployment credential is referenced in the release job. I do not put its value into an agent conversation, an article or the repository. This statement describes the workflow's credential references; the YAML cannot independently prove the effective provider permissions or the private GitHub environment settings.

I can review the checks as a series of questions:

| Question | Evidence the workflow requires |
| --- | --- |
| Was this the intended release decision? | A founder-merged PR associated with the exact commit |
| Is this still the intended source? | Exact checkout and repeated current-`main` checks |
| Did the candidate pass the release checks? | Tests, evaluation, browser checks, dependency audit and dry run |
| Is production where the previous release left it? | A matching receipt and a live pre-deployment version observation |
| Did this attempt produce the observed version? | Deploy exit status and correlation with the reported new version |
| Did the released service pass its checks? | Health, profile-answer, streaming and final version observations |

Each answer has a defined scope. None says that every possible application behaviour has been proved correct.

## Check what the deployment will replace

The automatic path starts from the latest matching release receipt recorded on the canonical release issue. That receipt must come from GitHub Actions, be unedited, and report a successful, correlated release. An automatic receipt must also report a successful final production observation.

The workflow does not look past a failed latest receipt to find a more convenient older success. A failure is information that must be reconciled.

Immediately before deployment, the workflow queries production and requires one version serving 100% of traffic. That version must match the receipt's baseline. A different version or a traffic split stops the write.

This gives me a useful way to detect drift. It is still a read followed by a write. It is not an atomic compare-and-swap at Cloudflare, and another authorized writer could act between them. The operating rule is therefore one routine production writer, with coordinated emergency access. Private access configuration needs its own evidence; a workflow file is not proof that every alternative writer has been excluded.

## Treat deployment success as a claim to verify

After a deployment attempt, the workflow queries production again. It compares the observed version with both the previous version and the version reported by this attempt. A zero deploy exit alone is insufficient: the observed result must correlate with this run.

Then it checks three concrete behaviours:

- the health endpoint identifies the expected service;
- a public-profile question returns a successful answer with the expected evidence source;
- the streaming response has the expected event-stream format and reaches its completion event.

The profile question follows a deterministic public-profile path. These checks do not establish general retrieval quality or generated-answer quality for every question.

After the smoke checks, the workflow queries the production version once more and requires the newly deployed version to remain the sole version serving 100% of traffic. It records the source commit, run, prior and new versions, deploy exit, correlation, smoke result and final observation in a release receipt.

That receipt is an observation at release time. It is not continuous monitoring or a promise about what production will serve tomorrow.

## Keep the three deployment surfaces distinct

Ask Mantosh sits on a static website, but a successful Pages deployment does not deploy the Worker. The site, the Worker code and the knowledge index have separate paths.

Pages builds and deploys the interface. Qualifying Worker changes use the automatic release described here. Reviewed public knowledge documents synchronize through their own workflow after reaching `main`.

This distinction changes how I read a green badge. I need the result for the surface I changed. I cannot use a successful website build as evidence that the Worker code was released, or assume a Worker release indexed new knowledge.

## Leave recovery explicit

I kept a founder-gated manual workflow for recovery. It deploys current `main`; restoring an older version is a separate emergency decision, with a compatibility check.

Before using that manual path or another emergency writer, the operating procedure calls for disabling and draining the automatic path, inspecting the actual production state, and establishing fresh authority for the recovery. Cancelling an action does not undo a production write.

The workflows share a concurrency group without cancelling the running release. That coordinates these two Actions workflows. It does not lock a dashboard or another CLI session, and it is not a lossless queue: a newer pending run can replace an older pending run. A skipped qualifying merge needs explicit reconciliation.

There is no automatic rollback or automatic release retry. After a failed or uncertain write, I want a clear record and a deliberate recovery decision. For a small personal service, that is an understandable boundary I can maintain.

## What the one-comment test established

[PR #106](https://github.com/mantoshkumar1/mantoshkumar1.github.io/pull/106) added one comment to the Worker entry point. Claude's independent AI review of the Codex-produced change preceded my merge. The resulting source was `e506385c9fa08d11f19d73cfb697ab9782331545`.

That merge triggered [automatic release run 39169924619](https://github.com/mantoshkumar1/mantoshkumar1.github.io/actions/runs/39169924619). The verification and release jobs succeeded. The [bot-authored receipt](https://github.com/mantoshkumar1/mantoshkumar1.github.io/issues/77#issuecomment-6255657485) recorded a zero deploy exit, a correlated new production version, successful smoke checks and a successful final version observation. The run completed at **21:58:56 UTC on 18 October 2026**.

This established that the automatic path worked end to end for that exact candidate. It did not test recovery, inject a deployment race, audit private access settings, prove every website audit passed, or establish the correctness of a future change. Keeping the example small made those limits easier to state.

## A pattern worth borrowing

For another AI-assisted project, I would start by writing down who can approve a change, what source identity every check refers to, what production state a release expects, and how an uncertain outcome blocks the next release.

Then I would run a small real candidate through the complete path and inspect the evidence myself.

The outcome I want is straightforward: AI helps prepare changes; a person owns the production decision; an executable workflow checks the evidence it can actually observe. When something fails, the system leaves enough information for the next decision.

## Source and maintenance notes

This is a first-person case study of a personal project, developed with AI assistance using existing GitHub Actions and Cloudflare tooling. It makes no employer, customer-adoption, scale, availability or measured time-saving claim.

The implementation described here is pinned to [the automatic workflow at the tested source commit](https://github.com/mantoshkumar1/mantoshkumar1.github.io/blob/e506385c9fa08d11f19d73cfb697ab9782331545/.github/workflows/release-ask-mantosh-on-merge.yml). For exact operational instructions, including baseline and recovery requirements, use the repository's [deployment runbook](https://github.com/mantoshkumar1/mantoshkumar1.github.io/blob/e506385c9fa08d11f19d73cfb697ab9782331545/chat-worker/docs/DEPLOYMENT.md). Its setup and activation sections include historical preparation; the dated run and receipt above establish the successful automatic test described here. Recheck live state before acting on any operational instruction.

Related reading: [Your Agent's Tests Are the Cheapest Check You Have](https://mantoshkumar1.github.io/insights/tests-are-the-cheapest-check.html) and [Release Reports as Operational History](https://mantoshkumar1.github.io/insights/release-reports-as-operational-history.html).

[Try Ask Mantosh](https://mantoshkumar1.github.io/#ask-mantosh).

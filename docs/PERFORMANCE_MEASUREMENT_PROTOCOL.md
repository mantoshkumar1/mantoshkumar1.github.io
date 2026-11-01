# Production route performance measurement protocol

**Status:** proposed lab protocol only. It contains no production measurements, adopted baseline, numeric regression threshold, automated monitor, or release gate.

## Purpose and limits

The repository's current performance audit enforces generated-file size budgets. Those are useful transfer-size controls, but they do not measure browser rendering or Core Web Vitals. The current release checks and their boundaries are described in [Release confidence](RELEASE_CONFIDENCE.md) and [System state](SYSTEM_STATE.md).

This proposal describes a repeatable, controlled **lab** observation of two public routes. A lab result is not field data and must not be described as the experience of real visitors. In particular:

- Record Lighthouse lab LCP and CLS as lab observations, not field Core Web Vitals.
- Record Total Blocking Time (TBT) as a lab responsiveness diagnostic. It is not INP and does not establish field INP.
- FCP and Speed Index may help explain a run, but are diagnostic rather than release criteria.
- Do not derive visitor analytics, add real-user monitoring, or send visitor data to a third party for this check.

The proposal does not implement or claim a production check. Lighthouse is not currently declared in the repository's package dependencies; the declared browser-test stack is Playwright. Tool availability and a controlled runner have not been verified.

## Routes and interaction boundary

Measure only these routes, with ordinary page navigation:

1. Homepage: `https://mantoshkumar1.github.io/`
2. Published long-form article: `https://mantoshkumar1.github.io/insights/tests-are-the-cheapest-check.html`

The article is an existing indexable public route in the repository. Do not open or submit contact, newsletter, or chat forms; do not send chat messages; do not call provider-backed actions. A route measurement consists of the page navigation and the requests it naturally makes to render that page.

## Preconditions for a future authorized run

Before collecting a result:

1. Use a separately provisioned, version-pinned Lighthouse CLI and Chromium in one controlled runner. This repository does not add or install either tool as part of this proposal.
2. Record the exact repository commit and the exact deployed revision. Use the existing post-deployment revision evidence; do not assume that the latest `main` commit is already live. If the deployed revision cannot be established, or differs from the intended revision, stop and report the mismatch instead of attributing the run to that revision.
3. Record the UTC start time, runner operating system and architecture, Node.js version, Lighthouse version, Chromium version, exact target URL, and all effective emulation and throttling settings.
4. Use the same Lighthouse version, Chromium version, runner class, mobile emulation, and simulated network profile for runs being compared. If any of these change, identify a new comparison series rather than silently mixing results.
5. Use a fresh browser profile and cold HTTP cache for each run. Run one route at a time; do not parallelize the two routes. Record failed or interrupted runs and their reasons instead of silently dropping them.
6. Preserve the raw Lighthouse JSON and the exact invocation with the result record. Do not retain cookies, form data, visitor identifiers, or unrelated browser state.

The first operational implementation must record the exact command-line arguments and confirm that the pinned tool supports the selected settings. Do not treat an unverified command, a missing CLI, or a different browser as an equivalent run.

## Capture procedure

1. Confirm the intended deployed revision from the existing deployment evidence and note its full commit SHA.
2. Run the homepage five times, sequentially, using the same fresh-profile and cold-cache procedure.
3. Repeat the same five-run sequence for the article.
4. Use Lighthouse's mobile emulation and simulated throttling profile. Record the actual profile/settings emitted by the pinned tool; do not write “mobile” alone as if it fully specifies the environment.
5. Keep each run's raw report. Record per-run LCP, CLS, TBT, FCP, Speed Index, Lighthouse performance score, and any audit/runtime error. The score is context only; do not use it as a substitute for the underlying metrics.
6. If results are interrupted by a deployment, unavailable route, runner fault, or obvious network anomaly, retain the record and mark it invalid for baseline comparison with the specific reason. Do not change the route, tool, throttling, or cache state mid-series to obtain a preferred result.

Five runs per route is a proposed starting capture size, not a guarantee of statistical sufficiency. The comparison should use the per-run values and their spread, not only the score or a single best run.

## Baseline and regression interpretation

Do not invent a current baseline or set a performance threshold before collecting evidence. As an initial calibration proposal, collect at least ten valid runs per route across multiple separate sessions on the same pinned runner/tool/profile, then review the distribution for stability. This sample count is a proposal for calibration, not an adopted gate.

Keep baselines separate by route and by materially different tool, browser, runner, or throttling profile. Summarize the median and spread (for example, interquartile range) for each metric. Preserve the underlying per-run values so that a median cannot hide unstable results.

A future owner may propose a metric-specific materiality margin after reviewing the observed noise. A candidate change is worth investigation when its repeated-run median moves beyond both the baseline's ordinary spread and that separately agreed margin. Repeat a suspicious series under the same conditions before attributing it to a release. Keep network/runner instability distinct from repeatable changes. Do not convert this method into an automatic failure threshold until a separate authorized task establishes the evidence, values, and release behavior.

These lab results cannot establish field INP, real-user Core Web Vitals, or performance on every device and network. Do not compare unlike environments or claim that a passing lab run proves production performance for all visitors.

## Result record template

Create one record per route and capture session. Store the raw report and exact command alongside it when a future authorized implementation defines an approved location.

| Field | Recorded value |
|---|---|
| Capture ID and UTC start time | |
| Repository commit SHA | |
| Deployed revision SHA and evidence link | |
| Route URL | |
| Runner OS, architecture, and runner class | |
| Node.js, Lighthouse, and Chromium versions | |
| Emulation and effective network/CPU settings | |
| Cache/profile state | |
| Exact invocation | |
| Run number (1–5) and validity | |
| LCP, CLS, TBT, FCP, Speed Index, performance score | |
| Raw report location | |
| Failure, anomaly, or interpretation notes | |

## Release-process boundary

This document does not change the existing release process, add a CI workflow or dependency, establish a production monitor, or create a release gate. Any automation, result-retention location, baseline values, or gate must be separately reviewed and authorized. Until then, the documented asset-size budgets remain the existing automated performance guardrails; they must not be represented as Core Web Vitals measurements.

# Ask Mantosh human-review question set — proposal

**Status:** Versioned synthetic question set only. No answers were captured, no reviewer study was run, and no score or baseline is claimed.

- **Set ID:** `AM-HRQ`
- **Version:** `1.0.0`
- **Public evidence snapshot:** repository `main` at `d8cdb221e47cea9d64eec146ad40a2fbd021c3e1` (2026-10-27)
- **Companion method:** [proposed rubric #120 at its exact draft head](https://github.com/mantoshkumar1/mantoshkumar1.github.io/blob/8d5ddd146625a970795be29b694cd30a4e657447/docs/ASK_MANTOSH_HUMAN_REVIEW.md), blob `953d2a7db6d7623661d4fa8a69d60b518e059723`. That file is still a draft proposal, not an adopted policy or main-branch file.

The five one-turn prompts below are synthetic review cases, not ideal answers, fixtures, production questions, or evidence about a live index. The repository pin identifies the expected public source snapshot only; it does not prove that a deployed Worker or indexed corpus uses it. Use the five rubric dimensions separately. Do not write a universal answer, assign scores in advance, or add a threshold. Version metadata below describes this proposal; every capture and score field remains blank until a separately authorized review.

## Fixed cases

### HQ-01 — platform ownership and role fit

- **Visitor goal:** Assess platform-engineering ownership from public career evidence.
- **Synthetic question:** “How does the public migration case show platform-engineering ownership, and which parts were Mantosh’s own versus shared with the team?”
- **Expected public evidence:** `PUB-MIGRATION`, [Legacy Validation Framework Migration](https://github.com/mantoshkumar1/mantoshkumar1.github.io/blob/d8cdb221e47cea9d64eec146ad40a2fbd021c3e1/knowledge/projects/legacy-validation-framework-migration.md) (blob `8cb1d6205aefcabca328b4b745ad2eba4ca43c64`), headings “Scope,” “Mantosh’s contribution,” and “Cutover evidence”; and `PUB-CAPABILITIES`, [Engineering Capabilities](https://github.com/mantoshkumar1/mantoshkumar1.github.io/blob/d8cdb221e47cea9d64eec146ad40a2fbd021c3e1/knowledge/experience/engineering-capabilities.md) (blob `0a1a05cf652f459a2d94877d84ccf0be7b6da767`), headings “Engineering platforms and automation” and “Evidence boundary.”
- **Canonical visitor links:** [Migration case study](https://mantoshkumar1.github.io/projects/legacy-validation-framework-migration.html), [Experience](https://mantoshkumar1.github.io/experience/).
- **Required qualifications / traps:** Distinguish the two-person team outcome from Mantosh’s documented ownership of shared libraries, platform/CI integration, and migration dashboard. Separate the documented two-person result from Mantosh’s individual ownership; do not infer current title, status, confidential impact, proficiency levels, or performance percentages.
- **Five-dimension focus:** Correctness—separate personal and team contributions; grounding—trace ownership to the named headings; usefulness—connect evidence to platform-role fit; concision—use this one example; tone—credible without title inflation.

### HQ-02 — engineering decision and trade-off

- **Visitor goal:** Understand why a product boundary was chosen and what it costs.
- **Synthetic question:** “Why does PhotoSahi process photos in the browser, and what trade-off does that create?”
- **Expected public evidence:** `PUB-PHOTOSAHI`, [PhotoSahi](https://github.com/mantoshkumar1/mantoshkumar1.github.io/blob/d8cdb221e47cea9d64eec146ad40a2fbd021c3e1/knowledge/projects/photosahi.md) (blob `6e3c708e064bbba1e7ee8241b94c15502b2c6c8a`), headings “Keep image processing in the browser,” “Optimize for immediate local interaction,” and “Reflection.”
- **Canonical visitor link:** [PhotoSahi case study](https://mantoshkumar1.github.io/projects/photosahi.html).
- **Required qualifications / traps:** The source says Canvas operations are local and photos are not uploaded to a backend; it also names browser/device performance and compatibility as trade-offs. Do not claim perfect security, no network activity of any kind, or universal device performance.
- **Five-dimension focus:** Correctness—state both rationale and trade-off; grounding—use the decision and reflection passages; usefulness—explain the boundary rather than praise it; concision—answer only why and what it costs; tone—avoid absolute privacy guarantees.

### HQ-03 — evidence boundary and evaluation maturity

- **Visitor goal:** Tell what automated evidence establishes from what remains unmeasured in human use.
- **Synthetic question:** “What does the published offline evaluation establish, and what does it leave unmeasured about visitor usefulness?”
- **Expected public evidence:** `PUB-EKS`, [Evidence-First Engineering Knowledge System](https://github.com/mantoshkumar1/mantoshkumar1.github.io/blob/d8cdb221e47cea9d64eec146ad40a2fbd021c3e1/knowledge/projects/engineering-knowledge-system.md) (blob `037fd45528a0fe75d39f0aca377b63eabc669a3e`), headings “Evaluation evidence” and “Current limits.”
- **Canonical visitor link:** [Engineering Knowledge System case study](https://mantoshkumar1.github.io/projects/engineering-knowledge-system.html).
- **Required qualifications / traps:** The source reports a committed offline evaluation of 554 cases and 9,734 objective assertions using controlled bindings; this is evidence about those specified tests, not a live Worker/index measurement or human preference, satisfaction, or answer-quality baseline. Do not turn the reported counts into proof of current deployment or user benefit.
- **Five-dimension focus:** Correctness—preserve the exact scope of the reported evaluation; grounding—distinguish repository evidence from live behavior; usefulness—explain what an engineering visitor may infer; concision—name the key limit directly; tone—be precise rather than dismissive of tests.

### HQ-04 — project maturity and user trade-off

- **Visitor goal:** Assess whether a small automation project fits a local document workflow and what maturity limits matter.
- **Synthetic question:** “What does the Workflow Automation Toolkit automate, and what should a first-time user expect to configure or install?”
- **Expected public evidence:** `PUB-TOOLKIT`, [Workflow Automation Toolkit](https://github.com/mantoshkumar1/mantoshkumar1.github.io/blob/d8cdb221e47cea9d64eec146ad40a2fbd021c3e1/knowledge/projects/workflow-automation-toolkit.md) (blob `53e651fad3ded6e4f0769cb428decc5010a93c4a`), headings “Documented utilities,” “Trade-offs and limits,” and “Public evidence.”
- **Canonical visitor link:** [Workflow Automation Toolkit case study](https://mantoshkumar1.github.io/projects/workflow-automation-toolkit.html).
- **Required qualifications / traps:** The source describes task-specific local Python command-line utilities and separate setup/dependency requirements, including Poppler for several tools. It reports no performance measurements, production-scale claims, test-coverage evidence, or measured time savings. Do not imply a unified installer or enterprise deployment.
- **Five-dimension focus:** Correctness—describe both tasks and setup limits; grounding—trace dependencies to the stated source; usefulness—help judge workflow fit; concision—avoid enumerating every utility unless asked; tone—calibrate maturity without dismissing the project.

### HQ-05 — deterministic useful navigation

- **Visitor goal:** Reach a named engineering project directly.
- **Synthetic question:** “Open the Evidence-First Engineering Knowledge System project page.”
- **Expected public evidence:** `PUB-EKS-PAGE`, [page source at the pinned snapshot](https://github.com/mantoshkumar1/mantoshkumar1.github.io/blob/d8cdb221e47cea9d64eec146ad40a2fbd021c3e1/projects/engineering-knowledge-system.html) (blob `dd39ea1739c3d7a3d7b8308b8527e697f9500365`), canonical URL and breadcrumb; the source document identifies the same route.
- **Expected destination:** [Engineering Knowledge System case study](https://mantoshkumar1.github.io/projects/engineering-knowledge-system.html) (`/projects/engineering-knowledge-system.html`).
- **Required qualifications / traps:** This is a navigation case. Judge whether the direct destination is correct and useful; do not require generated prose, retrieval, or citations when the implemented contract routes named projects deterministically. Do not describe a link response as an evidence-grounded answer.
- **Five-dimension focus:** Correctness—target the exact canonical page; grounding—check the pinned route mapping, not answer citations; usefulness—take the visitor directly there; concision—return the link without an unnecessary explanation; tone—neutral and clear.

The question-set format is not issue #52’s participant task protocol: it prescribes no task order, counterbalancing, timing, assistance/abandonment measure, or comparison with ordinary navigation.

## Blank capture and scoring record

Copy one blank record per authorized answer and reviewer. Leave these capture fields empty now; at an authorized capture, record unavailable identities as “unknown” rather than infer them. No answer, capture, version, or rating is pre-filled.

| Field | Entry |
| --- | --- |
| Question-set ID / version | |
| Case ID / visitor goal | |
| Capture date and time / environment | |
| Exact deployed source, answer-policy, model/provider, retrieval/source-set, and application versions | |
| Exact answer as delivered / sources or destination shown | |
| Non-identifying response/run ID / reviewer code | |
| Correctness (1–5) / evidence note | |
| Evidence grounding (1–5) / evidence note | |
| Portfolio usefulness (1–5) / evidence note | |
| Concision (1–5) / evidence note | |
| Tone (1–5) / evidence note | |
| Material unsupported, private, or source-mismatched claim? (Yes / No / Not assessable) / claim and evidence | |
| Public passage(s) checked / missing evidence | |
| Initial independent rating or post-discussion rating / disagreement note | |

Apply the anchors and disagreement procedure in the [rubric proposal at immutable PR #120 head](https://github.com/mantoshkumar1/mantoshkumar1.github.io/blob/8d5ddd146625a970795be29b694cd30a4e657447/docs/ASK_MANTOSH_HUMAN_REVIEW.md). Score each dimension separately; do not sum or average them. Missing answer, source, or version evidence is “Not assessable” for the affected observation, not a successful result. This blank form is not a scorecard result.

## Version and comparison rule

Keep a case ID stable only while its visitor goal, wording intent, expected source passages, qualifications, and destination remain materially the same. A material edit to those elements or a source/blob change creates a new question-set version; preserve the prior version and record the exact changed elements. Identify any material rubric revision separately and do not present its ratings as same-rubric comparisons. Compare only matching case IDs under the same question-set and rubric versions with the relevant answer and source versions identified. For changed or missing sources/metadata, mark direct comparison unavailable or partial and explain why; do not silently map old ratings to a new case. A repository source pin is not evidence of a deployed source set. The rubric’s proposed re-evaluation points remain proposals, not adopted release requirements.

## Limits and remaining work

This document supplies synthetic cases only. It contains no answer captures, participant recruitment, human baseline, reviewer-consistency result, adoption decision, or release threshold; these remain outstanding under issue #30. The set deliberately does not duplicate issue #52’s participant task protocol or PR #130’s retrieval/latency smoke cases. The five cases assess public-portfolio usefulness and evidence boundaries; they do not measure live recall, latency, production behavior, or visitor outcomes.

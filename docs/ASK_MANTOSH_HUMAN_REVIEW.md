# Ask Mantosh human review rubric — proposal

**Status:** internal methodology proposal only. This document defines how a future, separately authorized human review could be run. It is not an answer benchmark, a baseline, a release gate, or evidence that current answers have been human-rated.

Related context: [issue #30](https://github.com/mantoshkumar1/mantoshkumar1.github.io/issues/30), [Ask Mantosh vision](../VISION.md), [release-confidence documentation](RELEASE_CONFIDENCE.md), and [production system state](SYSTEM_STATE.md).

## Purpose and boundary

Evaluate whether Ask Mantosh helps a visitor understand Mantosh’s published engineering work, assess engineering fit and credibility, find supporting evidence, or navigate the portfolio. Recruiter assessment, engineering credibility, evidence quality, and useful navigation are the target outcomes. Generic-chatbot engagement, answer length, friendliness alone, or keeping a visitor talking are not success measures.

This proposal follows the product boundary in `VISION.md`: Ask Mantosh is a navigation and explanation layer for published work, not a general-purpose assistant. Questions and scoring examples for a future benchmark must be grounded only in public portfolio material. Do not use private information, real visitor conversations, or production query logs.

## What this review measures

Automated tests and deterministic fixtures check specified behavior on known inputs. Hosted browser tests check selected visitor flows and interface behavior. Neither establishes human preference, whether an answer feels useful to a recruiter, or whether a person can consistently judge the evidence and tone. A human review adds those observations; it does not replace the automated checks or prove legal, accessibility, or general product quality.

Score each answer on the five dimensions below. Record each dimension separately on a 1–5 scale. Ratings 2 and 4 mean the answer falls between the neighboring anchors. Do not sum or average ratings into a pass/fail result. In particular, a high usefulness or tone rating cannot offset a materially incorrect, unsupported, or private claim.

| Dimension | 1 — poor | 3 — mixed | 5 — strong |
| --- | --- | --- | --- |
| **Correctness** | Materially wrong, misleading, or presents private/unpublished information as fact. | Broadly correct, but has a meaningful omission, ambiguity, or qualification gap. | Accurate and appropriately qualified against the public evidence available for the answer. |
| **Evidence grounding** | No usable public support, a cited source does not support the claim, or an unsupported/private claim is stated as fact. | Some claims are supported, but a material claim is hard to trace or the evidence is incomplete. | Material factual claims are traceable to specific public sources that directly support them; uncertainty is explicit. |
| **Portfolio usefulness** | Generic, off-scope, or optimized for engagement rather than helping a visitor assess fit or navigate work. | Relevant, but offers little evidence, context, or useful next step. | Helps a recruiter or engineering visitor understand relevant work, judgment, evidence, or where to go next. |
| **Concision** | Repetitive, meandering, or too terse to answer the question. | Understandable, with noticeable excess or a missing useful detail. | Direct, well-scoped, and sufficient for the visitor’s purpose. |
| **Tone** | Inflated, falsely certain, dismissive, or chatbot-like in a way that weakens credibility. | Acceptable, but uneven, generic, or insufficiently calibrated. | Natural, respectful, professional, and credible without overstating the evidence. |

### Unsupported or private-claim flag

In addition to the five ratings, mark **Yes / No / Not assessable** for a material unsupported, private, or source-mismatched claim. If Yes, quote or identify the claim and record the missing or conflicting public evidence. Score correctness and evidence grounding accordingly; do not hide the issue in a narrative average. This flag is a review observation, not an adopted automatic release rule.

## Evidence and provenance to record

A score is interpretable only beside the answer and the evidence state the reviewer saw. For any future, authorized review, preserve:

- question-set name and version, case identifier, and visitor goal/persona;
- capture date and time, environment, and the exact answer as delivered;
- answer-policy/prompt version, model/provider identifier when available, retrieval or public-source-set revision, and relevant application version;
- source labels or links shown with the answer, plus the specific public passages used to judge material claims;
- a non-identifying response/run identifier and reviewer code.

Record only what the authorized test setup exposes. Do not store secrets, account identifiers, personal data, private source material, or actual visitor questions. If a version or source cannot be established, mark it **unknown**; do not infer it from a model’s answer. If evidence is missing or a source is unavailable, mark the affected rating **Not assessable**, explain why, and do not treat missing evidence as a successful score.

## Independent scoring and calibration

1. Before scoring, reviewers read the same rubric and confirm the question-set version, answer capture, and public evidence packet. Resolve procedural misunderstandings, not the answer’s substantive merits.
2. Each reviewer scores independently and records brief evidence for each rating before seeing another reviewer’s scores.
3. Preserve the original independent ratings. Then discuss disagreements using the cited answer text and public sources; record the reason for any revised rating rather than overwriting the initial score.
4. Report per-dimension ratings, reviewer count, the range of ratings, and unresolved disagreements. If there is only one reviewer, call the result single-reviewer feedback; do not imply consensus or consistency has been demonstrated.
5. A later calibration exercise may compare reviewers’ ratings on the same authorized public cases. Record where anchors were interpreted differently and refine the rubric through a separately reviewed version. No calibration result or reliability claim is established by this proposal.

## Comparing a future review with a baseline

A future baseline requires a separately authorized, versioned set of representative public-work questions and captured answers from the identified behavior under review. This document contains neither. For a future comparison, keep case IDs and scoring anchors stable where possible; show each case’s prior and current dimension ratings side by side, explain changed evidence or versions, and summarize the distribution and disagreement. If the question set or rubric changes, label the comparison as a new version and explain what is no longer directly comparable.

A numeric cutoff, weighting scheme, score aggregation rule, or automatic release decision is intentionally unspecified. Reviewers should surface material correctness, evidence, usefulness, concision, or tone changes for human judgment rather than treating a composite score as a substitute for that judgment.

## Proposed re-evaluation points

Human re-evaluation is proposed after a material change to the model/provider, retrieval method or public-source set, answer policy/prompt, or answer rendering/navigation behavior. The review owner should identify the changed version, select the affected cases from a separately authorized benchmark set, retain unaffected cases as comparison points when appropriate, and record what was and was not re-run. This is a proposed review method, not an adopted release requirement or deployment gate.

## Blank scorecard

Copy one row per answer and reviewer. Leave the score and evidence fields blank until an authorized review is actually performed.

| Field | Entry |
| --- | --- |
| Question-set version / case ID | |
| Visitor goal / persona | |
| Capture date, environment, response/run ID | |
| Answer-policy / model / retrieval-source versions | |
| Exact answer and sources shown | |
| Correctness (1–5) + evidence note | |
| Evidence grounding (1–5) + evidence note | |
| Portfolio usefulness (1–5) + evidence note | |
| Concision (1–5) + evidence note | |
| Tone (1–5) + evidence note | |
| Unsupported/private/source-mismatched material claim? (Yes / No / Not assessable) | |
| Public passage(s) checked / missing evidence | |
| Reviewer code; independent or post-discussion rating | |
| Disagreement or revision rationale | |

## Scope and issue #30 status

This proposal supplies scoring anchors, provenance fields, a blank scorecard, an independent-scoring method, comparison guidance, and proposed re-evaluation points. It does **not** add benchmark questions or cases, record current production answers or baseline scores, recruit human reviewers, validate reviewer consistency, or adopt a release gate. Therefore it does not complete issue #30’s acceptance criteria; those deliverables require separate authority and evidence.

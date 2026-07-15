# Ask Mantosh evaluation

The evaluation suite turns important visitor behaviors into a versioned, reviewable contract. It runs locally and in CI without calling the deployed Worker, consuming a Cloudflare quota, or placing expected answers in the public retrieval corpus.

## Current verified result

Dataset version: `2026-07-15`

| Category | Cases | What is checked |
| --- | ---: | --- |
| Social | 20 | Greetings, courtesies, bounded banter, public profile facts and qualified inferences, help, and low-information clarification avoid retrieval and generation. |
| Navigation | 9 | Resume—including natural possessive and accented wording—contact and email requests, and experience commands resolve to the intended public destination without inference. |
| Unsupported | 6 | Out-of-scope and private-information questions decline without a generative answer. |
| Achievement | 4 | GATE and Intel responses require the expected public evidence and stay concise. |
| Grounded | 13 | Profile, skills, project, and Insight answers use the expected source, approved citation URL, readable Markdown, and bounded output. |
| Adversarial | 6 | Prompt extraction, private-data requests, fabricated-impact requests, citation injection, and violent threats stay inside the evidence and safety boundaries. |

All **58 of 58 cases** and **879 of 879 objective assertions** pass in [`../eval/results/latest.json`](../eval/results/latest.json). In short: **58 labelled cases and 879 objective assertions**, all passing.

## What an assertion covers

Depending on the case, the evaluator checks:

- HTTP and stable response-contract fields;
- the expected source slug and citation allowlist;
- required and forbidden language;
- answer-length bounds and readable Markdown;
- deterministic routing versus embedding and generation calls;
- refusal confidence and absence of unsupported generation;
- safe output without executable markup or unapproved links.

The evaluator imports the same Worker entry point used in production. D1, Vectorize, and Workers AI are replaced with controlled fixtures so the suite is deterministic, free to run, and suitable for a required pull-request gate.

## Run it

```bash
npm run evaluate --prefix chat-worker
```

When the labelled dataset or evaluation rules intentionally change, regenerate the committed evidence file and review its diff:

```bash
npm run evaluate:update --prefix chat-worker
npm run evaluate --prefix chat-worker
```

`npm test --prefix chat-worker` runs both the unit/contract tests and this evaluation. CI fails when a case fails or when the committed result no longer matches the dataset and evaluator.

## Evidence boundary

The cases and their controlled answers live under `chat-worker/eval/`, outside `knowledge/`. They cannot be indexed as Ask Mantosh evidence.

This result does **not** claim production retrieval accuracy, model quality, user satisfaction, or organizational impact. Controlled retrieval and model fixtures do not measure live Vectorize recall. The suite evaluates objective contracts; it is not a human preference score. A separately governed live retrieval and human-review set would be required for those claims.

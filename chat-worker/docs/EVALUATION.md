# Ask Mantosh evaluation

The evaluation suite turns important visitor behaviors into a versioned, reviewable contract. It runs locally and in CI without calling the deployed Worker, consuming a Cloudflare quota, or placing expected answers in the public retrieval corpus.

## Current verified result

Dataset version: `2026-07-15`

| Category | Cases | What is checked |
| --- | ---: | --- |
| Social | 21 | Greetings, courtesies, bounded banter, public profile facts and qualified inferences, help, and low-information clarification avoid retrieval and generation. |
| Navigation | 9 | Resume—including natural possessive and accented wording—contact and email requests, and experience commands resolve to the intended public destination without inference. |
| Unsupported | 6 | Out-of-scope and private-information questions decline without a generative answer. |
| Achievement | 4 | GATE and Intel responses require the expected public evidence and stay concise. |
| Grounded | 13 | Profile, skills, project, and Insight answers use the expected source, approved citation URL, readable Markdown, and bounded output. |
| Adversarial | 6 | Prompt extraction, private-data requests, fabricated-impact requests, citation injection, and violent threats stay inside the evidence and safety boundaries. |
| Recruiter persona | 100 | Profile, fit, résumé, contact, location, work authorization, current role, and achievement questions. |
| Student persona | 100 | Education, career, skills, engineering ideas, project learning, and experience navigation. |
| Curious-visitor persona | 100 | Greetings, capabilities, banter, challenges, public facts, navigation, unsupported topics, and adversarial play. |
| Colleague persona | 100 | Architecture, validation, automation, release intelligence, project trade-offs, capabilities, and confidentiality. |
| Founder persona | 60 | Commercial fit, platform and automation problems, release risk, evidence systems, and contact flow. |

All **519 of 519 cases** and **8,959 of 8,959 objective assertions** pass in [`../eval/results/latest.json`](../eval/results/latest.json). The 519 labelled cases combine 59 focused regressions with the 460-question persona contract requested for recruiter, student, curious visitor, colleague, and founder behavior.

The first persona run passed 434 of 519 cases. Its 85 failures clustered around natural navigation wording, public location and employer paraphrases, work-authorization nuance, casual capability questions, conversational recovery, and privacy or prompt-injection variants. The routes and evidence boundaries were then tightened; the final result above is the post-fix run.

## What an assertion covers

Depending on the case, the evaluator checks:

- HTTP and stable response-contract fields;
- the expected source slug and citation allowlist;
- required and forbidden language;
- answer-length bounds and readable Markdown;
- deterministic routing versus embedding and generation calls;
- refusal confidence and absence of unsupported generation;
- safe output without executable markup or unapproved links.

Persona cases are generated from committed, reviewable question cohorts in [`../eval/persona-cases.mjs`](../eval/persona-cases.mjs). Each cohort has exactly ten questions; import-time guards enforce 100 recruiter, 100 student, 100 curious-visitor, 100 colleague, and 60 founder cases.

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

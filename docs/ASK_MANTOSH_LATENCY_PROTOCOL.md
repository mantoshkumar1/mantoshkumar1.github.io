# Ask Mantosh latency and recovery measurement protocol

**Status:** Proposed measurement protocol only. No measurements have been collected, no latency or error budget is adopted, and this document does not authorize production probes, instrumentation, provider access, or a release gate.

This protocol is scoped to the Ask Mantosh visitor experience. It separates what the pinned implementation can show from backend route details that are not reliably visible in the browser. The intent is to make a future, separately authorized measurement repeatable without changing evidence, privacy, or safety controls.

## Source snapshot and current observability

This document is grounded in source at commit [`d8cdb221e47cea9d64eec146ad40a2fbd021c3e1`](https://github.com/mantoshkumar1/mantoshkumar1.github.io/commit/d8cdb221e47cea9d64eec146ad40a2fbd021c3e1).

- The shared launcher in [`assets/js/ask-mantosh-widget.js`](https://github.com/mantoshkumar1/mantoshkumar1.github.io/blob/d8cdb221e47cea9d64eec146ad40a2fbd021c3e1/assets/js/ask-mantosh-widget.js) lazy-loads the chat client on the first launcher activation. The panel is a dialog with an input and a live conversation region.
- [`assets/js/main.js`](https://github.com/mantoshkumar1/mantoshkumar1.github.io/blob/d8cdb221e47cea9d64eec146ad40a2fbd021c3e1/assets/js/main.js) sends a POST request with `Accept: text/event-stream`, displays a searching status, and appends answer text as response events arrive. Network failures get a connection-specific message; server errors use the returned safe message. The UI exposes a **Try again** action and retains prior attempt errors in the conversation export.
- The Worker in [`chat-worker/src/index.js`](https://github.com/mantoshkumar1/mantoshkumar1.github.io/blob/d8cdb221e47cea9d64eec146ad40a2fbd021c3e1/chat-worker/src/index.js) returns an SSE response only after its route has produced a result. Its current stream helper enqueues metadata, one complete answer-text delta, and a done event, then closes. This is not token-by-token model streaming. For the current widget path, first visible substantive answer text therefore follows completion of the server's response generation; the searching status is not an answer.
- Response-cache eligibility is limited to non-streaming, first-turn, safe-to-cache requests in [`chat-worker/src/cache.js`](https://github.com/mantoshkumar1/mantoshkumar1.github.io/blob/d8cdb221e47cea9d64eec146ad40a2fbd021c3e1/chat-worker/src/cache.js) and the Worker handler. Because the widget requests SSE, this response-cache path is bypassed by the current widget. A warm browser session must not be reported as a Worker response-cache hit. A non-streaming API/cache case is a separate synthetic scenario, not a current visitor-widget path.
- [`chat-worker/src/observability.js`](https://github.com/mantoshkumar1/mantoshkumar1.github.io/blob/d8cdb221e47cea9d64eec146ad40a2fbd021c3e1/chat-worker/src/observability.js) contains a duration helper and a proposed structured event shape, but [`chat-worker/docs/TROUBLESHOOTING.md`](https://github.com/mantoshkumar1/mantoshkumar1.github.io/blob/d8cdb221e47cea9d64eec146ad40a2fbd021c3e1/chat-worker/docs/TROUBLESHOOTING.md) says that helper is not wired into the active handler. It is not evidence of production phase timings. Existing analytics event names and unit-test fixtures do not establish elapsed-time baselines.
- The browser-visible response does not identify whether a request was handled by a deterministic route, cache, retrieval, or generation. Do not infer a private Worker route from answer wording or elapsed time. Label a route **known** only when a controlled fixture or separately approved, non-sensitive correlation evidence establishes it; otherwise record **unknown**. Never derive backend routing, cold-start state, or cache state from the question alone.

The existing contracts also provide safe scenario guidance. The browser tests intercept the Worker endpoint with fixtures. Worker unit tests use fake bindings for quota exhaustion, timeout, and a single retry of certain invalid model outputs. These tests establish code behavior under those fixtures, not provider availability, production latency, or a live failure rate.

## Timing definitions

Use a monotonic browser clock such as `performance.now()` for intervals within a run. Record the page load and chat-client readiness separately from the question timings.

| Measure | Start | Stop | Include / exclude |
| --- | --- | --- | --- |
| Launcher-to-ready | First activation of the Ask Mantosh launcher | Dialog is visible, its input is focused and usable, and the initial client-load work has settled | Report first activation separately from later opens. Do not start at document navigation or count an already-open dialog. |
| Request-to-first-visible-response | A valid question is accepted for sending | First non-whitespace, substantive assistant answer text is present in the rendered answer after a paint opportunity | Exclude the user message, searching/status text, metadata, sources, and follow-up suggestions. For a failure before answer text, record **no first response** and the failure time. |
| Request-to-complete-answer | The same accepted-send point | The assistant answer is finalized, the busy state is cleared, and the searching status is gone | Record successful completion and terminal failure separately. Do not treat the first SSE metadata event or an intermediate status as completion. |
| Failure display | Accepted-send point | The error or retryable recovery message is visible | Record the HTTP/error category when the controlled fixture or authorized response exposes it. Keep connection aborts distinct from returned HTTP errors. |
| Retry recovery | Activation of **Try again** after a visible error | A complete answer is finalized, or a second terminal failure is displayed | Keep the original attempt and retry as separate rows. Current UI retry is user initiated; it is not proof of automatic retry. |

For each successful attempt, compute request-to-first-visible and request-to-complete independently. If there is no substantive answer before failure, use a missing value for first-visible rather than zero. Record raw elapsed values with units and the scenario; do not subtract status time or combine separate attempts.

## Scenario matrix

Use a fixed, reviewed set of portfolio-relevant prompts and report the expected path only when the controlled setup proves it.

| Scenario | Example / setup | Path classification |
| --- | --- | --- |
| Deterministic greeting | A short greeting such as `Hi` under the existing social-response fixture | Known deterministic only in the fixture or test that asserts that route; unknown in an uninstrumented production browser session. |
| Direct navigation | A short request such as `Resume` under the navigation fixture | Known navigation in that fixture. The current Worker returns navigation as a JSON response; measure the visible completed action separately from answer text. |
| Grounded portfolio question | A published-work question such as `What is PhotoSahi?` with a controlled grounded fixture | Label retrieval/generation only when the fixture or approved evidence proves those stages. A browser response alone does not reveal internal routing. |
| Eligible response-cache case | A separate non-streaming first-turn request using an approved synthetic question and explicitly controlled cache state | Not a current widget SSE path. Record hit, miss, or unknown only from the controlled response/evidence; do not call a warmed browser cache a Worker cache. |
| Cold / warm context | Fresh browser context versus a repeat run under the same declared browser, network, and build conditions | This describes browser-context state only. Worker isolate, provider, edge-cache, and backend cold/warm state remain unknown unless independently evidenced. |
| Network / runtime failure | Route abort, delayed fixture, returned quota/rate-limit response, provider-unavailable response, or timeout fixture | Record the injected condition and resulting user-visible behavior. A local fixture is not a live provider incident. |

For a browser-only measurement, prefer fixtures served by the existing test harness: success, delayed success, a returned error, a network abort, and an error followed by a user-triggered successful retry. Keep all external requests blocked or intercepted so no provider traffic occurs. Existing tests cover some of these behaviors; this protocol does not claim every scenario is currently implemented or passing.

## Controlled failure and recovery procedure

1. Record the source commit, test/browser build, browser and version, viewport, declared network profile, browser-context state, fixture identifier, and scenario before each run.
2. Use only synthetic, portfolio-relevant prompts reviewed for the test. Intercept the exact Ask Mantosh Worker URL with a local fixture. Exercise success, delayed response, network abort, quota/rate-limit error, provider-unavailable/timeout error, and failure followed by the existing manual retry. Never send a test prompt to the live Worker.
3. Assert the user-visible state: one user turn, a clear searching status while pending, readable answer or error, a visible retry control when applicable, and no duplicate user turn after retry. Confirm completion clears the busy/status state. Keep existing source and answer assertions intact.
4. Treat quota or provider errors as terminal for that attempt. Do not add automatic retries, bypass quotas, weaken retrieval or evidence checks, or change provider controls as part of measurement. The Worker currently retries once only for a limited set of model-output validation errors; that is distinct from the UI's manual retry.
5. Store only run metadata and fixture/scenario identifiers. Do not capture real visitor prompts, conversation exports, credentials, authorization headers, or unredacted personal data. Production measurements, production fault injection, and any new telemetry require separate explicit authority and privacy review.

## Run record

Use one row per attempt; retain a linked fixture/test artifact where available. Do not fill fields from assumptions.

| Field | Record |
| --- | --- |
| Source commit / build | |
| Browser, version, viewport | |
| Network profile / browser context | |
| Scenario and fixture ID | |
| Route classification and evidence, or **unknown** | |
| Attempt number (initial / retry) | |
| Request start (monotonic timestamp) | |
| First visible substantive answer (timestamp or **none**) | |
| Complete answer / terminal failure (timestamp and outcome) | |
| User-visible error / retry result | |
| Notes / artifact link (redacted) | |

## Baseline and future budget decision

No baseline, percentile, service-level objective, threshold, or latency diagnosis is asserted here. After separate authorization, collect repeated observations for each predeclared scenario under a documented, stable browser and network setup. Keep first-visible, complete-answer, launcher readiness, and failure/recovery distributions separate. Publish sample counts and raw anonymized measurements with the run context; for a small sample, show individual observations and median/range rather than implying a stable tail percentile. Compare like-for-like source versions and conditions. Investigate the slowest stage only when the evidence can identify it; otherwise label the contributor unknown.

Only after those observations and their variability are reviewed should an owner propose realistic budgets. A proposed budget should state the visitor journey, scenario, measurement boundary, sample and environment, expected variation, and recovery behavior it protects. It is a future decision, not a release gate or operating expectation until separately adopted. Any instrumentation or production collection needs its own purpose, minimum data, retention/access controls, privacy review, and explicit approval.

## Limits

This is a source-based protocol proposal, not a production run, incident report, benchmark, provider assessment, or adopted policy. No browser probe, live request, production query, new telemetry, implementation, test, fixture, configuration, workflow, install, or release action was performed. The source snapshot cannot establish current provider state or production behavior.
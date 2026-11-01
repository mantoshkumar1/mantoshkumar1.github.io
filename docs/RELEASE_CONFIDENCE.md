# Release confidence

The site uses layered checks because no single test can protect content, navigation, accessibility, performance, Ask Mantosh, and deployment behavior at once.

## Before deployment

Every pull request runs the deterministic static audits, the Worker test suite, the Ask Mantosh evaluation, and Playwright browser checks. The current Worker-test floor is 93, recorded in [`.test-count`](https://github.com/mantoshkumar1/mantoshkumar1.github.io/blob/33017cbae70ab527402c4127d26f14a6d112c619/.test-count) and enforced by [`scripts/audit-test-floor.mjs`](https://github.com/mantoshkumar1/mantoshkumar1.github.io/blob/33017cbae70ab527402c4127d26f14a6d112c619/scripts/audit-test-floor.mjs). In the hosted PR #126 merge-check run on 2026-10-27, the raw logs recorded 93/93 Worker tests passed, 554/554 Ask Mantosh evaluation cases and 9,734/9,734 assertions passed, and 62/62 browser checks passed across the configured desktop Chromium and mobile Chromium projects. The 62 is the aggregate from that dated run; no fixed per-project or visitor-journey count is implied. See the [raw floor job log](https://github.com/mantoshkumar1/mantoshkumar1.github.io/actions/runs/40558194878/job/122379812354), [raw audit job log](https://github.com/mantoshkumar1/mantoshkumar1.github.io/actions/runs/40558194877/job/122379813314), and [`playwright.config.mjs`](https://github.com/mantoshkumar1/mantoshkumar1.github.io/blob/33017cbae70ab527402c4127d26f14a6d112c619/playwright.config.mjs).

The browser checks cover:

- the main recruiter path from home through experience, projects, résumé, and contact;
- whole-card project and Insight navigation, plus the guiding question, evidence, capability, reflection, and connected-reading structure on all six project case studies;
- all five appearance choices, horizontal overflow, header clearance, and visible primary actions;
- automated WCAG 2 A/AA checks with Axe on the five critical pages and every explicit theme;
- newsletter form validation, résumé resources, and copy-email fallback;
- Ask Mantosh first-message submission without onboarding gates, balanced intent-aware response rendering, randomized portfolio prompts, page-aware project prompts, related reading, persistent next-question nudges, restored clickable follow-ups, grounded-source labels, minimize-and-resume history, text export, and deliberate close-and-clear behavior using a controlled response fixture.

Failure evidence includes screenshots, videos, traces, and a browser report retained by GitHub Actions for 14 days. Full-page screenshots are review artifacts, not brittle pixel-perfect approval baselines.

## Performance guardrails

The generated public artifact fails the release when any HTML page exceeds 36 KB, CSS exceeds 100 KB, JavaScript exceeds 60 KB in total, an image exceeds 180 KB, or the public artifact excluding the résumé PDF exceeds 1 MB.

At the time this document was updated, the measured maxima were 25,836-byte HTML, 81,343-byte CSS, 39,272 bytes of JavaScript, and a 595,055-byte public artifact excluding the PDF.

These are transfer-size guardrails, not Core Web Vitals measurements. This repository does not currently claim automated LCP, INP, or CLS results from a production trace.

## After deployment

The Pages workflow publishes a revision marker, waits for that exact commit to appear at the public origin, and then checks the homepage, the Engineering Knowledge System evaluation evidence, `feed.xml`, the Ask Mantosh health endpoint, and a deterministic newsletter navigation response.

The smoke check retries briefly to accommodate GitHub Pages propagation. A failed smoke check makes the deployment workflow fail visibly; it does not silently roll back GitHub Pages.

## Deliberate limits

- Chromium covers the automated desktop and mobile paths; Safari and Firefox remain manual spot checks.
- Axe catches many machine-detectable barriers but is not a formal accessibility conformance audit.
- The Buttondown subscription is validated up to the browser hand-off; CI does not create real subscribers.
- The production smoke test checks availability and deterministic integration, not live AI retrieval quality or quota-bearing generation.
- Human visual judgment, real-device review, and production Core Web Vitals remain separate from these automated gates.

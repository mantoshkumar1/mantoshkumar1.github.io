# Release confidence

The site uses layered checks because no single test can protect content, navigation, accessibility, performance, Ask Mantosh, and deployment behavior at once.

## Before deployment

Every pull request runs the deterministic static audits, 89 Worker tests, the 554-case Ask Mantosh evaluation, and 22 browser checks: eleven visitor journeys in desktop Chromium and a mobile Chromium viewport.

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

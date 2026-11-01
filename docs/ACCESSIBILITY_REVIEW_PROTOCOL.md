# Accessibility review protocol — proposed

**Status:** Proposed operator method for future reviews. This document records no new audit result, does not change the public accessibility statement, and is not a WCAG conformance claim.

**Target:** Evaluate applicable public web content against **WCAG 2.2 Level AA**, which includes all Level A and AA success criteria. Use the normative [WCAG 2.2 Recommendation](https://www.w3.org/TR/WCAG22/) for criteria and levels; use its Understanding documents for interpretation. [WCAG-EM 2.0](https://www.w3.org/TR/wcag-em-2/) is a W3C Group Note process, published 23 July 2026, not an additional WCAG requirement.

## Scope and method

Use the five WCAG-EM steps: define scope; explore the product; select a representative sample; evaluate it; report findings. Revisit earlier steps when exploration reveals another template, state, or complete process. A small sample is a focused review, not a basis for claiming whole-site conformance. WCAG-EM says that in most situations its use alone does not support a conformance claim.

For each review, pin the exact candidate and base commits. Inventory public routes, templates, shared navigation, themes, embedded features, downloadable resources, and third-party hand-offs. Name included and excluded content with reasons. Choose representative routes and states that cover unique templates and complete visitor processes in scope; list each selected URI and state. Expand the sample when shared code or findings affect another route. Do not infer current production behavior from historical source-only observations.

A useful initial sample is:

- Recruiter journey: home → experience → one representative project detail → résumé → contact.
- Shared navigation and appearance: each available theme, navigation states, narrow/reflow states, and applicable focus states.
- Résumé: HTML content and PDF open/download paths. PDF tags and reading order require a suitable PDF inspection method; otherwise mark them not tested.
- Newsletter: inspect the local page, labels, validation, error/focus behavior, and hand-off boundary. Do not submit the live form.
- Ask Mantosh: use only a confirmed local build with its controlled fixture. Do not send prompts to the live service.

This is a starting sample, not a fixed or complete scope. Add routes and states based on the current candidate. Do not call the Ask Mantosh composer a contact form: /contact/ uses email and copy-email actions; the external subscription form is on /newsletter/.

## Evaluate and record

Evaluate each applicable Level A and AA criterion against actual page content and complete in-scope processes. Combine unchanged automated checks with human functional review. Automated checks identify some machine-detectable issues; a clean Axe result is not a conformance result. WCAG conformance involves testable criteria and a combination of automated and human evaluation.

| Dimension | Record when applicable |
|---|---|
| Keyboard and focus | Tab and Shift+Tab order; skip links; visible and unobscured focus; menus/dialogs; focus entry, containment where intended, close and return; keyboard traps. |
| Structure and screen readers | Headings, landmarks, names, roles, states, instructions, errors and status announcements. Test with the named browser/OS/assistive-technology combination; DOM inspection alone does not establish what a screen reader announces. |
| Contrast and appearance | Text, controls, focus indicators and meaningful graphics in relevant themes, forced-colors and interaction states. Record measurements and tested foreground/background; do not infer contrast from a theme label. |
| Zoom and reflow | Viewport, browser zoom or text scaling, orientation, wrapping, clipping, overlap, and whether each task remains usable. A bounding box beyond the viewport alone does not prove visible or functional failure. |
| Forms and interactions | Labels, instructions, validation, error identification, focus, status and recovery. Use local fixtures for Ask Mantosh. Stop newsletter review before external submission. Never send email or contact messages. |
| Résumé and documents | HTML content and PDF behavior separately. Assess PDF tags/reading order only with a suitable tool; otherwise mark not tested. Do not infer PDF inaccessibility from absence of a separate full HTML résumé. |

Check new WCAG 2.2 A/AA criteria where relevant, including 2.4.11 Focus Not Obscured (Minimum), 2.5.7 Dragging Movements, 2.5.8 Target Size (Minimum), 3.2.6 Consistent Help, and 3.3.7 Redundant Entry. This list is not exhaustive; determine applicability from actual content and interaction. Use the level shown in the normative standard.

## Existing automated coverage and limits

The proposal source is main at d8cdb221e47cea9d64eec146ad40a2fbd021c3e1. Current source includes:

- tests/browser/visitor-flows.spec.mjs: Playwright desktop Chromium and mobile Chromium emulating iPhone 13. It visits home, experience, projects, a project case study, résumé and contact; checks headings, main content, horizontal overflow, header clearance, the recruiter journey, appearance choices, newsletter required-field validation without submission, résumé links and contact copy-email fallback. Axe checks use WCAG 2.0/2.1 A/AA tags on configured critical pages and themes. The mobile project is emulation, not physical iOS Safari.
- tests/browser/ask-mantosh-modal-boundary.spec.mjs: controlled local responses and checks for modal focus, inert background, close paths, focus return and Axe. It does not verify announcements through a real screen reader or live-service behavior.
- scripts/audit-accessibility.mjs: static source checks for selected markup, navigation, image, button, accessibility-page, stylesheet-preference and Ask Mantosh patterns. Static checks do not establish rendered or assistive-technology behavior.
- docs/RELEASE_CONFIDENCE.md and docs/REAL_DEVICE_REVIEW.md describe further checks and boundaries. The device checklist is a template, not completed-test evidence; its stated baseline is historical and is not this candidate SHA.

These checks are useful inputs, not a substitute for criterion-by-criterion human review. Read CI results and test counts from the exact reviewed head; do not copy counts from an older document or board entry when they differ. Do not infer physical-device, Firefox/WebKit, screen-reader, measured-contrast, PDF-accessibility, or whole-site results from Chromium/Axe checks.

## Result labels and triage

Use one result per criterion × page/state × tested environment:

- **PASS** — the criterion was evaluated for this exact scope/environment and the expected result was observed. This is not a page-wide or site-wide pass.
- **FAIL** — an applicable criterion is not met, with reproducible steps and evidence on the pinned candidate.
- **ADVISORY** — a usability or robustness concern was observed, but evidence does not demonstrate WCAG criterion failure. Keep it distinct from a defect.
- **NOT_TESTED** — omitted, blocked, unavailable, or incomplete; state why. Never treat as a pass.
- **NOT_APPLICABLE** — the criterion does not apply to in-scope content/functionality; give the concrete reason. Do not use for missing tools, evidence, or untested features.

Set internal priority from demonstrated task impact, not WCAG level: **P1** blocks an essential in-scope task with no usable alternative; **P2** materially prevents or degrades an essential task; **P3** adds a meaningful barrier with a practical workaround; **P4** is advisory or low impact. Explain impact and workaround. This is internal triage, not a W3C severity scale. Do not promote an advisory to a failure without criterion-specific evidence.

For a verified failure, open or update only a separately authorized follow-up with criterion, affected route/process, candidate SHA, environment, reproduction, expected/actual result, evidence, impact, priority and retest requirement. This document authorizes no code, test, or public-statement change.

## Evidence record template

Keep one row per tested criterion and state:

| Field | Required record |
|---|---|
| Identity | Review ID; date/time/timezone; reviewer; exact candidate SHA and base SHA. |
| Scope | Route/template, page state, complete process, included/excluded content and reasons. |
| Criterion | WCAG version, criterion ID/title, level, applicability reasoning and expected outcome. |
| Environment | Physical device or emulation; OS/build; browser/version; viewport/orientation; zoom/text scale; theme/forced-colors; input; assistive technology/version/language, when used. |
| Procedure | Preconditions, exact steps, local-fixture data only, and reset/recovery steps. |
| Observation | Actual result, visible/audible behavior, errors/status, and difference from expectation. |
| Evidence | Safe screenshot, recording, DOM/test output or measurements as applicable; artifact URI; redact personal data, prompts, email addresses, tokens and unrelated content. |
| Outcome | PASS / FAIL / ADVISORY / NOT_TESTED / NOT_APPLICABLE; priority for failure/advisory; impact, workaround, follow-up link and retest SHA. |

Record a tool/browser only when actually used, with its version. Missing browser, screen reader, physical device, contrast tool, or PDF tool is a limit to report, not a reason to infer a result. Usability research with people with disabilities is a separate voluntary study; do not represent a functional review as user research.

## Historical evidence — context only

Earlier issue #33 packets are bounded observations against source 90b38325f66c238be667da60f805890f8f46b73b, dated 26 October 2026. They are not current-main results or whole-site conformance evidence:

- [R75 advisory reproduction](https://github.com/mantoshkumar1/mantoshkumar1.github.io/issues/33#issuecomment-6418922460) recorded the newsletter link 9.3 px beyond a 320 px viewport while visible, clickable and keyboard-reachable in that run, with no page-level horizontal scroll. It was **ADVISORY**, not a demonstrated failure.
- That packet found substantive HTML experience/focus/highlights content on /resume/; PDF tag/accessibility inspection was **NOT_RUN**. It distinguished the site-wide Ask Mantosh composer from the newsletter form; /contact/ has no contact submission form.
- Strategy's [R77 correction](https://github.com/mantoshkumar1/mantoshkumar1.github.io/issues/33#issuecomment-6419345365) rejected claims that the PDF was inaccessible, HTML career content absent, or geometry alone proved a blocking failure.
- The [real-device checklist](REAL_DEVICE_REVIEW.md) complements this protocol; it does not supply screen-reader, contrast, or PDF evidence.

Recheck historical observations only when a new admitted task pins a new source. Do not carry old results forward as current evidence.

## Public-statement and conformance boundary

The existing [accessibility statement](../accessibility/) describes features and support. This proposal does not verify or revise its claims. Update public wording only after a limitation or finding is verified on a pinned candidate and its owner approves the exact wording.

A proposed WCAG target is not a conformance claim. A bounded sample, clean automated scan, or this methodology alone does not establish conformance. Any future public statement must define its scope and evaluation date, follow normative WCAG conformance requirements, identify limitations accurately, and be maintained by the site owner. WCAG-EM 2.0 notes that its use alone does not support conformance claims in most situations.

## Primary references

- [WCAG 2.2 Recommendation](https://www.w3.org/TR/WCAG22/) — normative success criteria and conformance requirements.
- [Understanding WCAG 2.2: Conformance](https://www.w3.org/WAI/WCAG22/Understanding/conformance) — explanatory evaluation and conformance guidance.
- [WCAG-EM 2.0](https://www.w3.org/TR/wcag-em-2/) — W3C Group Note, published 23 July 2026; scope, exploration, representative sampling, evaluation and reporting.
- [WCAG-EM overview](https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/) — W3C introduction to the methodology.

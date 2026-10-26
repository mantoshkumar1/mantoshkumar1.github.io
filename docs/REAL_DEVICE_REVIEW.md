# Real-device review checklist

A focused, human-run release check for changes whose behavior depends on a physical device or browser engine. This is a checklist and evidence template, not a supported-device guarantee or a record of completed testing.

**Source baseline:** `main` at `90b38325f66c238be667da60f805890f8f46b73b` (2026-10-26). Review the candidate commit, not just this baseline. **Automated boundary:** the current Playwright configuration runs desktop Chromium and an iPhone 13 viewport with Chromium. That viewport is emulation, not physical iOS Safari. See [release confidence](RELEASE_CONFIDENCE.md) and [`playwright.config.mjs`](../playwright.config.mjs). This checklist adds no Firefox/WebKit automation and makes no device-test claim.

## Choose the smallest relevant check

- Shared navigation, responsive layout, appearance, focus, or common CSS/runtime change: check a physical iPhone with Safari and a physical Android device with Chrome; use desktop Firefox and Safari where available and relevant to the changed surface. Record unavailable browsers as `NOT_RUN`.
- Résumé/contact/resource change: check the affected link or file on at least one physical mobile browser and one desktop browser. Test open and download alternatives; never send a message.
- Ask Mantosh interface/state change: use a local build with its controlled fixture only. If a local fixture is unavailable, record `NOT_RUN`; do not send a prompt to the live service.
- Isolated page/content change with no shared behavior: check that page on one physical mobile browser and one desktop browser. Expand only when the change affects another surface.

Run applicable existing automated checks separately. Manual observations do not replace them, and emulation does not count as a physical-device row.

## Record the environment

Fill one row per actual environment. Use full versions/builds; do not infer them from a device name. Do not record a browser as tested unless the steps below were performed there.

| Device (physical model) | OS/version and build | Browser/version | Viewport/orientation | Date/time and zone | Tester |
|---|---|---|---|---|---|
| iPhone / iPad, if applicable |  | Safari |  |  |  |
| Android phone/tablet, if applicable |  | Chrome |  |  |  |
| Desktop, if applicable |  | Firefox or Safari |  |  |  |

## Focused checks

For each applicable row, record the **actual observation**, result, and evidence. Mark anything not exercised `NOT_RUN`; it is not a pass.

| Surface / action | Expected observation | Result and evidence |
|---|---|---|
| Recruiter path: Home → Experience → Projects → Résumé → Contact | Each intended page opens; primary actions and return navigation work without overlap, dead ends, or unexpected horizontal scrolling. |  |
| Mobile navigation (physical mobile only) | Open and close the menu; all primary destinations remain reachable and tappable; menu state and focus behave as expected for that browser. |  |
| Appearance: Auto, Light, Dark, Soft, Contrast | Each available choice applies; text, controls, selected state, and links remain legible across a route change/reload. Record any mode not available on the candidate. |  |
| Reflow and orientation | At a larger text/zoom setting and after orientation change where supported, content and actions remain usable without clipping or obscured controls. Record the setting used. |  |
| Keyboard/focus (where supported) | Tab/Shift+Tab reaches interactive controls in a sensible order; focus is visible; dialogs or menus do not strand focus and return it appropriately when closed. Do not claim a formal accessibility audit. |  |
| Résumé resource | Try the browser PDF/open path and the download alternative. Confirm the chosen result is usable; record browser-specific viewer limitations and the fallback. |  |
| Contact fallback | Check the email link and copy-email fallback if present. Confirm the copied value locally without sending email, opening a live submission, or disclosing the address in evidence. |  |
| Ask Mantosh (local fixture only) | With a controlled local response, check launcher, minimize/reopen, history and clear. If fixture isolation cannot be confirmed, do not interact with the live service; mark `NOT_RUN`. |  |
| Network / third-party degradation | Where practical, block or disconnect a nonessential third-party dependency and observe the affected page. Record what remains usable and what fails. Do not infer offline support or treat a failed dependency as a pass. |  |

## Result and release-risk record

**Candidate:** PR/commit and exact head SHA:  
**Source/base SHA:**  
**Changed surface and focused checks selected:**  
**Overall result:** `PASS` / `FAIL` / `NOT_RUN` — `PASS` means every selected row matched its expected observation; `FAIL` means at least one did not; `NOT_RUN` means selected evidence is incomplete. This summary is not release approval.  
**Release risk / affected user path:**  
**Follow-up owner and issue/PR:**  

For every `FAIL`, include concise reproduction steps, expected versus actual behavior, the exact environment row, impact, and a screenshot/video or other safe evidence. Link the evidence and candidate. Remove personal data, query text, tokens, and contact details from captures and logs. Report a failure against the tested head; rerun affected checks after a fix because a new head invalidates prior observations.

This document authorizes no live chat, newsletter, contact, or other external submission. A human may exercise any consent-sensitive external flow only under separate explicit authority. No submission is part of this checklist's default run.

# Professional conversion measurement model

**Status:** Proposal only. This document neither adopts an event contract nor authorizes instrumentation, event sends, provider access, visitor-data reads, or a release gate. No baseline or conversion result has been measured.

**Source snapshot:** `d8cdb221e47cea9d64eec146ad40a2fbd021c3e1`.

## Purpose and outcome paths

The site's primary professional goal is to help recruiters and hiring managers assess fit for Staff or Principal opportunities and start a useful conversation; readers and collaborators are also important visitors. The funnel below is a set of paths to measure in future work, not an observed journey or causal model.

| Path | Useful visitor progression | Observable outcome to consider |
| --- | --- | --- |
| Professional opportunity | Entry page → Experience or résumé → contact option | Résumé view/download or contact-action click |
| Project or insight reader | Entry page → project/insight → related public evidence or outbound destination | Read-through threshold or evidence/outbound click |
| Newsletter reader | Newsletter page → subscription form | Submission attempt only; this site's form does not expose a confirmed subscription result |
| Ask Mantosh visitor | Open → answer displayed → public source opened | Dialog open, completed visible answer, or source click; none means answer quality or hiring conversion |

A useful aggregate model should answer which *types of pages and actions* merit attention. Without an approved visitor/session identifier, it cannot establish that a specific visitor followed a sequence of steps. Event counts are not unique people, and before/after changes do not establish that a design caused the difference.

## What the pinned source currently shows

### Site pageviews and AI referrals

At the pinned source, [`seo.config.json`](../seo.config.json) declares the Plausible provider and site domain. [`scripts/generate-seo.mjs`](../scripts/generate-seo.mjs) emits a loader that appends the Plausible script after the page load event and includes [`assets/js/ai-referral-analytics.js`](../assets/js/ai-referral-analytics.js) on generated pages. This documents source configuration and page wiring only; no hosted Plausible settings, successful delivery, or collected data were inspected.

The AI-referral script matches the current page referrer hostname to five fixed labels—`chatgpt`, `perplexity`, `claude`, `copilot`, or `gemini`—then sets a page data attribute and dispatches the browser event `ai-referral` with only that label. It conditionally calls `window.plausible("AI referral", { props: { source } })` if that function is available when the script runs. It does not itself establish that Plausible received the event, and it does not associate that event with later page actions. A guarded `window.umami` call is also present, but this source snapshot does not load an Umami script.

Examples of important page actions already present in HTML include [résumé PDF view/download](../resume/index.html), [contact email/copy-email](../contact/index.html), and a [newsletter form posting directly to Buttondown](../newsletter/index.html). The home, project, and insight pages also link visitors among those destinations. In the inspected page/client sources, these actions do not have a verified end-to-end custom conversion event. A form submission attempt is not evidence of a confirmed newsletter subscription.

### Separate Worker counters

[The Worker analytics service](../chat-worker/src/intelligence/analytics-service.js) writes daily event counts to its D1 analytics table when the binding is available. [Worker route code](../chat-worker/src/index.js) calls event types including `recommendation_click`, `conversation`, `scope_boundary`, `project_view`, `navigation`, `knowledge_answer`, `response_cache_hit`, `knowledge_search`, `knowledge_gap`, and `model_output_recovered`. These are product/route telemetry, not a site-wide professional-conversion funnel.

The service hashes dimensions passed to `track()` before storing them; some call sites pass the question as that dimension. A hash is not a safe event property to forward to another analytics provider and is not a guarantee that low-entropy text cannot be guessed. The separate `trackAggregate()` path accepts only these literal allowlists:

| Metric | Allowed dimensions in source |
| --- | --- |
| `relevance_gate` | `blocked`, `continued_related`, `continued_uncertain` |
| `lexical_coverage` | `coverage_0`, `coverage_1_39`, `coverage_40_69`, `coverage_70_100` |
| `post_gate_outcome` | `grounded_answer`, `knowledge_gap` |
| `ai_call_avoided` | `embedding`, `generation` |

These code paths show what can be recorded, not whether a deployed D1 binding is present, writes succeed, or any particular count exists. No analytics rows or visitor records were read for this proposal.

The separate [privacy data-flow audit draft](https://github.com/mantoshkumar1/mantoshkumar1.github.io/blob/7c5f431b66c155ea3bf87d4a0a233e386e2ec2e1/docs/PRIVACY_DATA_FLOW_AUDIT.md) and [latency/recovery protocol draft](https://github.com/mantoshkumar1/mantoshkumar1.github.io/blob/5e6df0fb0ec6bff81591179cf05e8a8de8583557/docs/ASK_MANTOSH_LATENCY_PROTOCOL.md) cover adjacent data-flow and response-timing questions. They do not establish hosted analytics configuration, visitor conversion, or an adopted measurement policy.

## Proposed bounded event registry

**All names and properties in this section are proposed, not emitted or adopted.** A future implementation should define them in one central registry and use the same spelling and value allowlists at each call site. Do not scatter ad hoc event strings across pages.

| Proposed event | Trigger | Allowlisted properties |
| --- | --- | --- |
| `resume_action` | Visitor opens or downloads the résumé PDF | `action=view|download`; `format=pdf`; `page_group=resume` |
| `contact_action` | Visitor opens the email link or uses copy-email | `action=email_open|copy_email`; `page_group=contact` |
| `content_engaged` | Visitor reaches a predeclared read-through threshold on a project or insight | `content_type=project|insight`; `content_id=<approved public slug>`; `depth=50|90`; `page_group=project|insight` |
| `outbound_action` | Visitor opens an approved external project, source, or profile destination | `destination_type=project_demo|evidence|linkedin|github`; `source_page_group=<allowlisted page group>` |
| `newsletter_action` | Visitor submits the newsletter form | `action=submit_attempt`; `page_group=newsletter` |
| `ask_action` | Visitor opens Ask Mantosh, sees a completed non-error answer, or opens a cited source | `action=open|answer_complete|source_click`; `source_type=project|insight|experience|other` where applicable; `page_group=<allowlisted page group>` |

The event registry should use finite values only. If a future version adds `referrer_group`, it should contain only an approved category such as `direct`, `search`, one of the five current AI labels, or `other`; it must never contain the full referrer URL. A same-page category would not by itself attribute later actions to the same visitor.

Do not send or store question/answer text, email addresses, clipboard contents, raw URLs/referrers, IP or user-agent values, conversation IDs, arbitrary recommendation IDs, or per-visitor identifiers as properties. Do not add a `newsletter_subscribed` event without a separately verified confirmation signal and authority. `answer_complete` would mean only that non-error answer text finished rendering; it would not assert grounding, correctness, satisfaction, or conversion.

## Aggregate review template

For each review, preselect and report a consistent time window and denominator. Keep source and event definitions visible so a pageview count is not silently compared with a different unit.

| Field | Record |
| --- | --- |
| Window (UTC start/end) and comparison window | |
| Source commit and event-schema revision | |
| Data source and collection status (verified / unavailable / unknown) | |
| Event name, page group, content/destination category | |
| Attribution category, or `unknown/not joinable` | |
| Numerator: event count and definition | |
| Denominator: count, definition, source, and same-window check | |
| Events per 100 denominator events, or `not comparable` | |
| Missing data, configuration limits, and interpretation | |
| Decision or follow-up question | |

Where numerator and denominator are compatible, calculate `100 × event count ÷ denominator count` and call it **events per 100 denominator events**, not a person-level conversion rate. Counts can include repeat actions; do not join unrelated pageview and event totals into a visitor journey. If the denominator or attribution is unavailable, report the count alone or `unknown`. Describe an observed association only; do not claim causation or set a target from an unreviewed baseline.

## Limits and separate decisions

This proposal does not verify live Plausible, Buttondown, or Cloudflare settings; query provider data; read visitor data; define retention; or claim that existing source events were received. The canonical source does not provide a measured professional-conversion baseline. Instrumentation, any data-retention/access policy, public privacy wording, and production verification require their own evidence and authorization. No event contract, threshold, budget, or public behavior is adopted by this document.

Pinned implementation references: [analytics config](../seo.config.json), [SEO page generator](../scripts/generate-seo.mjs), [AI-referral code](../assets/js/ai-referral-analytics.js), [Worker analytics service](../chat-worker/src/intelligence/analytics-service.js), [Worker route call sites](../chat-worker/src/index.js), [site vision](../VISION.md), [privacy audit draft](https://github.com/mantoshkumar1/mantoshkumar1.github.io/pull/116), and [latency protocol draft](https://github.com/mantoshkumar1/mantoshkumar1.github.io/pull/124).

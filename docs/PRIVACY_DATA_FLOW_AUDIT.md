# Privacy data-flow audit

Last reviewed: 2026-10-26
Source commit reviewed: `90b38325f66c238be667da60f805890f8f46b73b` (main)
Revision note: corrected per independent-review finding [6406108972](https://github.com/mantoshkumar1/mantoshkumar1.github.io/pull/116#issuecomment-6406108972) on 2026-10-26, with disposition of all five points recorded on PR #116; further corrected per residual re-review finding [6407573008](https://github.com/mantoshkumar1/mantoshkumar1.github.io/pull/116#issuecomment-6407573008) on 2026-10-26 to scope the referral-script claim, describe session-level expiry renewal and opportunistic cleanup instead of per-turn/same-conversation cleanup, and limit the no-persistent-identifier statement to the Plausible analytics flow; further corrected per source-scope finding [6408905637](https://github.com/mantoshkumar1/mantoshkumar1.github.io/pull/116#issuecomment-6408905637) on 2026-10-26 to drop the unsupported provider-wide "cookieless" characterization of Plausible and narrow it to what the local loader does, and to qualify storage/TTL/cleanup to the tracked `wrangler.toml` default and the Worker's actual D1-present, recorded-turn code paths rather than an independently verified deployed guarantee.

## Scope and boundary

This is a **source-code audit**, not a legal or compliance review and not a statement of guaranteed privacy. It documents what the committed code in this repository sends, stores, and retains for four visitor-facing data paths: analytics, the newsletter signup, the Ask Mantosh chat assistant, and browser `localStorage`/`sessionStorage` usage. Every claim below cites a file and line.

It explicitly does **not** claim to know:
- What Plausible, Buttondown, or Cloudflare do with data once it reaches their own servers (retention periods, sub-processors, backups). Those are third-party platforms; their behavior is governed by their own policies, not by this codebase.
- The live configuration of the deployed Cloudflare account (D1/Vectorize data-retention settings, log retention in the dashboard, Analytics Engine retention) — only what the Worker code itself does with data before it leaves this repository's control.
- Anything about account-level settings, secrets, or provider configuration. No deployed/production system was inspected to produce this document; it is a read of the source tree only.

This document is a prerequisite for a future public-facing privacy page (tracked in [#45](https://github.com/mantoshkumar1/mantoshkumar1.github.io/issues/45)), not that page itself, and does not by itself satisfy #45's remaining criteria.

## 1. Analytics

**Plausible Analytics** (third-party pageview analytics) — `index.html:37-42`, and the identical pattern repeated on every page (`resume/`, `projects/*.html`, `accessibility/`, `404.html`, `systems/`, `contact/`, `thinking/*.html`, `insights/`, etc.):

```js
window.addEventListener("load", () => {
  const analytics = document.createElement("script");
  analytics.defer = true;
  analytics.dataset.domain = "mantoshkumar1.github.io";
  analytics.src = "https://plausible.io/js/script.js";
  document.head.append(analytics);
}, { once: true });
```

The script loads only after `window.load`, and sends pageview events directly from the visitor's browser to `plausible.io`. No cookie is set by this local snippet, and this analytics loader generates no persistent visitor identifier of its own (see §3 for the separate conversation IDs and rate-limit fingerprint used by Ask Mantosh, which are not part of this analytics flow). This is a statement about what this local loader does, not a verified claim about Plausible's own provider-side behavior: whether Plausible itself is "cookieless" is a provider characterization this source audit did not independently source or verify, and is not asserted here.

**Custom AI-referral signal** — `assets/js/ai-referral-analytics.js`, loaded via `index.html:45` (and the same deferred `<script>` tag on every page):

```js
(() => {
  let host = "";
  try { host = document.referrer ? new URL(document.referrer).hostname.toLowerCase() : ""; } catch { return; }
  const sources = [["chatgpt.com","chatgpt"],["perplexity.ai","perplexity"],["claude.ai","claude"],
                   ["copilot.microsoft.com","copilot"],["gemini.google.com","gemini"]];
  const source = sources.find(([domain]) => host === domain || host.endsWith(`.${domain}`))?.[1];
  if (!source) return;
  document.documentElement.dataset.aiReferral = source;
  window.dispatchEvent(new CustomEvent("ai-referral", { detail: { source } }));
  if (typeof window.umami?.track === "function") window.umami.track("AI referral", { source });
  if (typeof window.plausible === "function") window.plausible("AI referral", { props: { source } });
})();
```

This reads `document.referrer` client-side only, matches it against five known AI-assistant domains, and — only if a match exists and Plausible's script has already loaded — forwards the matched *source name* (e.g. `"claude"`) to Plausible as a custom event property. This script makes no network request of its own, and its own event/callback payload contains only the matched source name, never the raw referrer URL; that is a statement about this one script's payload, not a claim that the raw referrer can never leave the browser through other browser or provider network behavior.

A repo-wide search for Google Analytics, Google Tag Manager, Cloudflare Web Analytics' beacon script, Umami, or Fathom found no such script tags. `window.umami` is referenced defensively (`typeof window.umami?.track === "function"`) but no Umami script is loaded anywhere in the source tree.

**Retention:** not visible in this repo. Plausible is a hosted third party; its server-side retention is outside this codebase's control and not asserted here.

## 2. Newsletter

`newsletter/index.html:77`:

```html
<form action="https://buttondown.com/api/emails/embed-subscribe/mantoshkumar" method="post" target="_blank" rel="noopener noreferrer" class="newsletter-form" data-buttondown-status="active">
```

This is a plain HTML form. A visitor's email address posts **directly from the browser to Buttondown's own API** (`buttondown.com`). No site backend, Cloudflare Worker route, or repository code receives, logs, or stores the submitted email at any point — it is a pure client-to-third-party pass-through.

**Retention:** not visible in this repo; entirely Buttondown-side.

## 3. Ask Mantosh (chat-worker, Cloudflare Worker)

Configuration — `chat-worker/wrangler.toml`: `AI_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast"`, `AI_EMBEDDING_MODEL = "@cf/baai/bge-m3"`, `CONVERSATION_TTL_SECONDS = "86400"` (24h), D1 binding `KNOWLEDGE_DB`, Vectorize binding `KNOWLEDGE_INDEX`.

**Inference provider.** `chat-worker/src/ai.js:4-5` calls only `env.AI.run(...)` — the Cloudflare Workers AI binding. A search for outbound `fetch(` calls in `ai.js` and `retrieval.js` found none: the visitor's question and retrieved knowledge-base context are sent to Cloudflare's own Workers AI inference and not to any external LLM vendor (OpenAI, Anthropic, etc.). What Cloudflare's platform itself does with that inference traffic server-side is not determinable from this repo.

**Conversation storage** — `chat-worker/src/intelligence/memory-manager.js`:
- Both `load()` and `recordTurn()` are no-ops (`load()` returns an empty summary/message list; `recordTurn()` returns without writing) when the Worker's `KNOWLEDGE_DB` (D1) binding is absent (`memory-manager.js:28,39`). Everything below describes what happens only when that binding is present and a turn is actually recorded; not every request path calls `recordTurn()` (`chat-worker/src/index.js:212-240` shows it called on the social/boundary/navigation/profile-overview paths, awaited via `ctx.waitUntil`, not on every possible response path).
- `expires_at` belongs to the `conversation_sessions` row for the whole conversation, not to individual turns or messages. `recordTurn()` upserts that row and sets `expires_at = now + CONVERSATION_TTL_SECONDS` on every recorded turn, so each new recorded turn renews the session's expiry rather than starting an independent per-turn timer. `CONVERSATION_TTL_SECONDS` is a `config.js:60` runtime-configurable value with a tracked default of 86400 seconds (24 hours) in `chat-worker/wrangler.toml` — this document audits the tracked default and the code path, not an independently verified value of the live deployed binding, which could be overridden at deploy time without a corresponding source change.
- `load()` first runs `DELETE FROM conversation_sessions WHERE expires_at < ?` against the whole `conversation_sessions` table — i.e., it opportunistically deletes *any* expired session, not only the one requested — before reading the requested conversation's summary and recent messages. So a session can be cleaned up as a side effect of a chat request for a *different* conversation, not only on its own next use.
- Individual `conversation_messages` rows carry no `expires_at` of their own; they are removed via `conversation_id` cascade when their parent session row is deleted (see schema below), and separately summarized/pruned once a conversation reaches 10+ stored messages (summary capped at 1000 characters).

Schema — `chat-worker/migrations/0003_intelligence.sql`: `conversation_sessions(conversation_id, subject_id, summary, expires_at, created_at, updated_at)` and `conversation_messages(id, conversation_id, role, content, source_labels, created_at)`, with `conversation_messages.conversation_id` declared `REFERENCES conversation_sessions(conversation_id) ON DELETE CASCADE`. Neither table has an IP-address or user-agent column.

**Rate limiting.** `chat-worker/src/rate-limit.js:14-19`:

```js
const networkIdentity = `${request.headers.get("CF-Connecting-IP") || "anonymous"}|${request.headers.get("User-Agent") || ""}`;
result = await env.RATE_LIMITER.limit({ key: await fingerprint(networkIdentity) });
```

`fingerprint()` (`chat-worker/src/cache.js:10-13`) is a one-way SHA-256 hash. Only that hash — never the raw IP or user-agent string — is passed to Cloudflare's `RATE_LIMITER` binding or persisted anywhere in this Worker's own code.

**Observability.** `chat-worker/src/observability.js:4-20` logs a structured line (route, status, outcome, cache state, confidence, durations, character/token counts, a random request ID) via `console.log`, mirrored to `env.ANALYTICS.writeDataPoint` (Cloudflare Analytics Engine). This object contains **no question text, answer text, or IP address** — counts, timings, and status codes only.

**Aggregate analytics.** `chat-worker/src/intelligence/analytics-service.js` hashes dimension values (e.g. topic/coverage buckets) with SHA-256 before storing them as daily counters in `intelligence_analytics(event_day, event_type, dimension, count)` — aggregate counts only, no raw question/answer text retained in this table.

**Not visible in code:** Cloudflare's own backend retention of Workers AI inference calls, the durability/retention guarantees of the D1 and Vectorize bindings themselves, or how long `console.log` output persists in the Cloudflare dashboard. These are platform-level behaviors outside this repository.

### Related but out of the four-area scope

- **Content sync.** `chat-worker/src/github-oidc.js` and the `GITHUB_OIDC_AUDIENCE` / `GITHUB_REPOSITORY` / `GITHUB_SYNC_REF` variables in `wrangler.toml` drive a pipeline that pulls the public knowledge-base documents from this GitHub repo into D1/Vectorize. This is content ingestion, not visitor data, but it runs in the same Worker.
- `chat-worker/migrations/0004_ai_daily_usage.sql` and `0005_profile_facts.sql`: `ai_daily_usage`/`ai_request_windows` store only day/window keys and counts (global quota tracking, no per-visitor data); `profile_facts` holds Mantosh's own public knowledge-base facts, not visitor data.

## 4. `localStorage` / `sessionStorage`

| Key | Storage | File:line | Data | Owning feature |
| --- | --- | --- | --- | --- |
| `mantosh-appearance` | `localStorage` | `assets/js/theme-init.js:5` (read), `assets/js/ask-mantosh-widget.js:3,38` (read/write) | Theme choice string (`"light"` / `"dark"`) | Site-wide light/dark toggle |
| `ask-mantosh-conversation-v1` | `sessionStorage` | `assets/js/main.js:283` (key), `:292` (read), `:316` (write) | `{conversationId, messages[]}` — a local copy of the visible chat transcript (role, text, sources, follow-ups), capped to the last 20 messages, kept so a page reload doesn't lose the open conversation. This local copy is separate from the question/answer rows the Worker records server-side (§3) — it does not change what the Worker already received and stored. | Ask Mantosh widget |
| `ask-mantosh-audience-v1` | `localStorage` | `assets/js/main.js:373` | Only ever **removed**, never written anywhere in current source (`grep -rn "ask-mantosh-audience-v1"` finds only this one `removeItem` call) | Dead reference to a retired feature |

`sessionStorage` clears automatically when the browser tab closes — no code-level expiry is needed for that key. `clearConversation()` (`assets/js/main.js:373`) also explicitly wipes both the conversation and the dead audience key when a visitor uses "clear chat."

## Other data flows noticed (flagged, not in the four requested areas)

- **Contact page** (`contact/index.html:82`) is a plain `mailto:` link with a pre-filled subject/body template. It opens the visitor's own email client; no form submission occurs and no data touches this site or any backend.

## Proposed visitor-facing wording (draft, for review — not published)

> **What this site collects.** Page views are measured by [Plausible](https://plausible.io); the local script that loads Plausible on this site does not set a tracking cookie or generate a persistent visitor identifier of its own — this is a statement about this site's own loader, not a verified claim about how Plausible's own servers handle cookies or tracking once a pageview reaches them. If you arrive from an AI assistant such as ChatGPT or Claude, a script on this site recognizes the referring domain and passes only the matched source name (e.g. "claude") — never your full referrer URL — in its own event/callback payload; that is a statement about this one script, not a claim that your referrer can never reach a server through other browser or provider network behavior. If you sign up for the newsletter, your email goes directly from your browser to our email provider (Buttondown); this site's own servers do not receive, log, or store it. If you use Ask Mantosh, and the Worker's database is available for your request, your question and the assistant's answer are sent to a Cloudflare Worker and stored there — not just kept in your browser — so the conversation can continue across messages; your conversation is tracked as a single session whose expiry is renewed, for each turn the Worker actually records, to this site's configured retention window (24 hours by the tracked default, which the deployed service could change), and expired sessions (including, sometimes, other visitors' sessions) are opportunistically deleted the next time anyone's chat request runs, rather than on a fixed per-message timer or a schedule dedicated to your conversation; if that database is unavailable, nothing is stored server-side for that request. To limit abuse, the Worker combines your IP address and browser user-agent into a one-way SHA-256 hash and uses only that hash — never the raw values — as a rate-limiting key; this hash is a pseudonymous fingerprint, not a guarantee of anonymity, and how long Cloudflare's rate-limiting service itself retains it is not something this site's code controls or can state. Your theme preference and a local copy of the visible chat transcript are also kept in your browser's storage for convenience; that local copy is separate from, and does not change, what is already sent to and stored by the Worker as described above.
>
> This description covers only what this site's own code does, as reviewed here. It does not establish, and should not be read as promising, how Plausible, Buttondown, or Cloudflare's infrastructure handle data once it reaches their systems, or what their deployed account-level retention settings are — see their own privacy policies for that.

This wording is a draft input for the eventual public privacy page tracked in #45; it is not published anywhere by this document, and this document does not add a site link or page for it.

## Explicit unknowns

- Deployed/account-level retention settings on Cloudflare (D1, Vectorize, Analytics Engine, Workers logs) are not inspected or assumed here.
- Plausible's and Buttondown's own server-side data retention and sub-processor practices are governed by their published policies, not this repository, and are not restated or guaranteed here.
- Whether any of these third parties' current policies differ from what is described above was not re-verified against their live, current policy pages as part of this audit; only this repository's own code was read.

## Limits of this audit

- Read-only review of the source tree at commit `90b38325f66c238be667da60f805890f8f46b73b`; no deployed environment, Cloudflare dashboard, or provider account was accessed.
- No code, tests, fixtures, or workflows were modified to produce this document.
- No public privacy page or site navigation link was added; this document lives only in `docs/` as an internal audit artifact pending founder review and independent verification.

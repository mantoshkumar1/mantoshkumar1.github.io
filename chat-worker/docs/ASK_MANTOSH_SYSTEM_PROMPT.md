# Permanent Ask Mantosh system prompt

The executable prompt engine lives in [`src/prompt/`](../src/prompt/). It is
documented separately so changes are reviewable as product-policy changes, not
incidental wording edits.

## Prompt engine layout

| Module | Responsibility |
| --- | --- |
| `system-prompt.js` | Durable identity, evidence, citation, voice, and output rules. |
| `prompt-builder.js` | Encodes the visitor question as data, selects a visitor-centered response mode, deduplicates chunks, and builds model input. |
| `intent-classifier.js` | Deterministically selects profile, problem-guidance, or direct-answer formatting without weakening retrieval or evidence rules. |
| `guardrails.js` | XML escaping, answerability gating, and the canonical unavailable response. |
| `confidence-scorer.js` | Conservative retrieval-evidence score: `high`, `medium`, or `low`. |
| `citation-builder.js` | Canonical source labels, URLs, and deduplication. |
| `response-formatter.js` | Stable response with sources, related content, follow-ups, and confidence. |

## Prompt builder

The builder has five durable layers:

1. **Identity** — Ask Mantosh represents published thinking without claiming to
   be Mantosh or a general chatbot.
2. **Evidence boundary** — only retrieved documents can support a response;
   insufficient evidence produces the exact unavailable-answer sentence.
3. **Voice** — technical, direct, and non-promotional.
4. **Citation policy** — every substantive claim uses a supplied source label
   and public URL; the final Sources section is deduplicated.
5. **Response template** — a compact Markdown structure that omits unsupported
   sections, preserves technical categories, deduplicates sources, and ends with
   exactly three evidence-grounded follow-up questions. Profile questions use a concise hiring-oriented structure, stated visitor problems receive practical but explicitly bounded guidance, and direct questions receive a compact answer rather than a generic report.

## Hallucination prevention rules

- Retrieval is a hard precondition. No retrieved source skips the model call and
  returns the unavailable-answer sentence.
- Documents are marked as untrusted data, preventing document text from
  redefining the system instructions.
- The model cannot use its general knowledge, visitor-provided claims, or
  plausible inference as evidence.
- Missing support for even part of an answer requires the unavailable-answer
  response, not a qualified guess.
- The Worker, not the model, returns the canonical structured source objects and
  their clickable URLs.

## Confidence strategy

Confidence is a groundedness gate, not a user-visible percentage:

1. No fused retrieval candidates: unavailable answer without a Workers AI generation call.
2. Candidates below the semantic threshold and with no BM25 support: unavailable
   answer.
3. Retrieved candidates: the model must still verify explicit documentary
   support before responding.
4. An offline evaluation set—not intuition—must justify any change to the
   semantic threshold, chunk size, or fusion weights.

This avoids misleading numerical confidence labels while keeping the failure
mode honest. `low` returns the unavailable-answer response rather than risking
an unsupported answer; `medium` and `high` describe retrieval evidence, not
model certainty.

## Citation and follow-up strategy

Each context document carries a source label and public URL. The model renders
them as Markdown links; the Worker also returns the same URLs in `sources` for
the frontend. Follow-up questions are generated deterministically from
retrieved public metadata and returned in both `followUpQuestions` and the
backward-compatible `suggestedQuestions` API field. The frontend preserves that
metadata even if the generated Markdown reaches its output-length limit.

## Extension rules

- Conversation memory is appended only as bounded visitor context; it never
  becomes evidence about Mantosh.
- Related content and suggested questions come from retrieved metadata, not
  general model recommendations.
- Add structured-output schemas only as a backward-compatible API version; the
  current Markdown response is intentionally frontend-safe.
- Treat any modification to the evidence boundary, unavailable-answer text, or
  citation policy as a product-security review requiring evaluation tests.

# Ask Mantosh — Offline Aggregate Review Template

**Status: proposed manual worksheet; not an operational report or approved publication policy.**

Use this blank worksheet only after a separately authorized aggregate input is available. It is a human review aid. It does not query a database, establish that any events exist, create backlog items, or authorize publication.

## Evidence boundary

The source feasibility review found four existing literal aggregate metric families: `relevance_gate`, `lexical_coverage`, `post_gate_outcome`, and `ai_call_avoided`. Their exact allowlisted dimensions are listed below. These events are emitted only on particular code paths. They have no all-request denominator, visitor, topic, article, or document attribution; counts are not visitor rates or a map of missing content.

Exclude unprefixed/hashed `track()` rows. Hashing is not proof of anonymity and those rows must not be reverse-mapped. Do not enter raw questions, identifiers, or sensitive data here. See the [accepted source-feasibility findings on #55](https://github.com/mantoshkumar1/mantoshkumar1.github.io/issues/55#issuecomment-6412301302), the [analytics allowlist at the pinned source](https://github.com/mantoshkumar1/mantoshkumar1.github.io/blob/aa5d08511e8f9cf289dfa8f9b39df02d5df4b87e/chat-worker/src/intelligence/analytics-service.js), and the [daily aggregate schema at the pinned source](https://github.com/mantoshkumar1/mantoshkumar1.github.io/blob/aa5d08511e8f9cf289dfa8f9b39df02d5df4b87e/chat-worker/migrations/0003_intelligence.sql).

## Review record

- Review date (UTC): ____________________
- Window start (UTC, inclusive): ____________________
- Window end (UTC, exclusive): ____________________
- Source revision: ____________________
- Aggregate input provenance and separate authorization (who/what authorized, extraction date and method):  
  ______________________________________________________________________
- Input completeness or known gaps:  
  ______________________________________________________________________

## Optional allowlisted counts

For each row, leave the count blank unless an authorized input reports it. Record status separately: `OBSERVED`, `MISSING`, or `SUPPRESSED`. An observed zero is `OBSERVED` with count `0`; blank, missing, and suppressed are not zero. Do not calculate percentages or compare metrics as though they shared a denominator.

| Metric | Allowlisted dimension | Count (optional) | Status |
|---|---|---:|---|
| `aggregate:relevance_gate` | `blocked` |  |  |
| `aggregate:relevance_gate` | `continued_related` |  |  |
| `aggregate:relevance_gate` | `continued_uncertain` |  |  |
| `aggregate:lexical_coverage` | `coverage_0` |  |  |
| `aggregate:lexical_coverage` | `coverage_1_39` |  |  |
| `aggregate:lexical_coverage` | `coverage_40_69` |  |  |
| `aggregate:lexical_coverage` | `coverage_70_100` |  |  |
| `aggregate:post_gate_outcome` | `grounded_answer` |  |  |
| `aggregate:post_gate_outcome` | `knowledge_gap` |  |  |
| `aggregate:ai_call_avoided` | `embedding` |  |  |
| `aggregate:ai_call_avoided` | `generation` |  |  |

## Human disposition

Select one only after separately approved repeat-window, minimum-sample, and suppression criteria are available and met. Those criteria are intentionally unset here. If input or criteria are unavailable, leave the disposition blank and make no finding or publication decision.

- [ ] `INSUFFICIENT_VOLUME`
- [ ] `REVIEW_PUBLIC_EVIDENCE`
- [ ] `KEEP_UNSUPPORTED`

- Public evidence independently reviewed (URL and revision; not inferred from aggregate counts):  
  ______________________________________________________________________
- Rationale and limits:  
  ______________________________________________________________________
- Follow-up, if any (requires ordinary editorial authority; no automatic backlog creation):  
  ______________________________________________________________________

A repeated aggregate pattern can at most prompt an authorized human to review existing public evidence or retain an unsupported boundary. It cannot identify which topic, source, or document is missing. Any content decision must rest on independently verified public evidence and ordinary editorial authority.

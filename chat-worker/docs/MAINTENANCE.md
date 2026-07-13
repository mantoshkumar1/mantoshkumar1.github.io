# Maintenance runbook

## Every change

- Add public engineering claims only as Markdown with complete YAML front
  matter and source links.
- Review retrieval quality for exact project names, semantic paraphrases, and
  an unrelated question before publishing.
- Keep chunks concise and document decisions, trade-offs, outcomes, and limits
  under explicit headings.

## Weekly

- Review 429, 5xx, timeout, no-answer, and cache-hit rates.
- Review the most-used source labels and low-confidence searches without
  collecting raw visitor questions.
- Check token usage and output-length distributions for regressions.

## Monthly

- Review access to the recovery index token. Rotate it after suspected disclosure
  or when a contributor who could access it departs.
- Check Cloudflare Workers AI model, quota, and rate-limit change notices.
- Run production `/health`, grounded-answer, and no-evidence smoke tests, then run
  the automated accessibility audit. Exercise rollback only after an isolated
  staging environment exists.

## Data lifecycle

Delete a Markdown document through Git, let the index workflow remove it, and
verify it no longer appears in D1, Vectorize, or cached answers. Keep production
analytics aggregated; retain no raw question text by default.

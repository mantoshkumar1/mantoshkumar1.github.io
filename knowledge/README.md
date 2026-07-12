# Ask Mantosh knowledge source

This directory is the sole source of truth for the public knowledge base. Add
one Markdown file with the required YAML front matter to a category directory;
the GitHub Actions workflow indexes it after it reaches `main`.

Knowledge documents must contain evidence and judgments that can be safely
quoted by the assistant. Do not place private, draft, or unverified material in
public documents. `visibility: private` and `visibility: draft` are removed
from the public index.

Use [`_template.md`](_template.md) as the schema reference. Files beginning
with `_` are intentionally not indexed.

## Current public corpus

As of 2026-07-12, the public index contains four source documents:

- `Project: PhotoSahi`
- `Project: Workflow Automation Toolkit`
- `Note: Engineering Philosophy: Build Leverage, Not Just Software`
- `Article: Why Does This Still Require Me?`

Each source has one clear topic, a factual summary, retrieval tags, related
topics, an explicit public URL, and an evidence boundary in its body. The
automatic sync workflow uses changed-file indexing for normal pushes and a full
reindex for manual workflow runs.

## Publication checklist

Before setting `visibility: public`:

1. Confirm every claim is safe to quote without surrounding private context.
2. Use explicit headings for evidence, decisions, trade-offs, outcomes, and
   limitations when the source supports them.
3. Keep the canonical website page and knowledge document consistent.
4. Run `node scripts/audit-docs.mjs`, the site audits, and Worker tests.
5. After synchronization, ask one grounded question and one unrelated question;
   verify canonical source labels and the fixed no-evidence response.

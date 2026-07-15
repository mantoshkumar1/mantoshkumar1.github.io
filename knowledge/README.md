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

As of 2026-07-13, the public index contains 14 source documents:

- `Project: Evidence-First Engineering Knowledge System`
- `Project: PhotoSahi`
- `Project: Workflow Automation Toolkit`
- `Project: GTT Trigger Price Calculator`
- `Project: Validation Platform and Release Intelligence`
- `Note: Engineering Philosophy: Build Leverage, Not Just Software`
- `Article: Why Does This Still Require Me?`
- `Note: Release Reports as Operational History`
- `Article: In Distributed Systems, Complexity Changes Address`
- `Article: Blockchain Without a Master Branch`
- `Note: Engineering Ownership Before Escalation`
- `Experience: Engineering Capabilities and Technical Skills`
- `Experience: GATE CS & IT Top-1% Achievement and TUM Admission Context`
- `FAQ: About Mantosh and Where His Experience Can Help`

Each source has one clear topic, a factual summary, retrieval tags, related
topics, an explicit public URL, and an evidence boundary in its body. The
automatic sync workflow uses changed-file indexing for normal pushes and a full
reindex for manual workflow runs.

## Whole-site coverage

Ask Mantosh uses all relevant reviewed website content without treating interface
copy as evidence. Project case studies, Insights, experience, capabilities,
achievements, and public profile facts are retrieved from the source documents
above. Home, Projects, Insights, résumé, contact, newsletter, and accessibility
requests use deterministic navigation. Error pages and legacy redirects are
explicitly excluded from evidence.

[`site-coverage.json`](site-coverage.json) records those utility and non-evidence
routes. `node scripts/audit-ask-mantosh-coverage.mjs` discovers every public HTML
page and fails CI if a route is not backed by public knowledge, deterministic
navigation, or a documented no-index exclusion.

## Publication checklist

Before setting `visibility: public`:

1. Confirm every claim is safe to quote without surrounding private context.
2. Use explicit headings for evidence, decisions, trade-offs, outcomes, and
   limitations when the source supports them.
3. Keep the canonical website page and knowledge document consistent.
4. Run `node scripts/audit-docs.mjs`, `node scripts/audit-ask-mantosh-coverage.mjs`, the site audits, and Worker tests.
5. After synchronization, ask one grounded question and one unrelated question;
   verify canonical source labels and the fixed no-evidence response.

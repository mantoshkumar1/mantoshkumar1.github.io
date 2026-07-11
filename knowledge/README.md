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

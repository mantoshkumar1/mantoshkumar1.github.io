# Publishing a project and its homepage selection

This is the authoritative document for how a project's homepage presence
works. It covers only what the current repository actually implements.

## Publication pair

Like an insight, most projects have two coordinated files: `projects/<slug>.html`
(the human-readable case study) and `knowledge/projects/<slug>.md` (the
retrieval source Ask Mantosh may quote). The full `projects/index.html`
catalog is hand-authored and out of scope for this document — this file
covers only `seo.config.json`'s per-project metadata and the homepage
Selected Projects section generated from it.

## Insights and Projects have different homepage policies

The homepage generates two sections at build time, from the same
`seo.config.json` file, using the same `scripts/generate-seo.mjs` marker-injection
mechanism — but they answer different questions and use different selection
rules. Do not simplify them into one algorithm:

- **Insights teaser** ("what did I publish most recently?") — recency-driven.
  Always the 3 most recently published insight articles, newest first,
  fully automatic. See [`PUBLISHING_INSIGHTS.md`](PUBLISHING_INSIGHTS.md).
- **Selected Projects** ("which projects are my strongest Staff/Principal
  hiring evidence right now?") — editorially selected, documented here.
  Never date-driven.

## Homepage Selected Projects

The homepage's "Selected Projects" section (`#systems` in `index.html`)
always contains **exactly 3** projects, generated automatically between
`<!-- projects:generated:start -->` and `<!-- projects:generated:end -->`
markers. `index.html` must never be hand-edited to add, remove, or reorder
a project card.

### Selection is editorial, not date-driven

A project qualifies for the homepage only when its `seo.config.json` entry
carries an explicit `homepageOrder` field (`1`, `2`, or `3`). There is no
fallback to `dateModified`, creation date, or any other recency signal —
project metadata mostly carries `dateModified` rather than a meaningful
publication chronology, and projects are heavier hiring evidence than
Insights, so a newer project must never automatically displace a stronger
existing case study. Publishing a new project page does not change the
homepage on its own.

Changing which 3 projects are featured is a deliberate editorial decision —
an Engineering Brand Guardian review of which projects currently make the
strongest Staff/Principal case — not something an automated process should
change on its own. To change the selection, update `homepageOrder` (and add
`card` metadata, see below) on the newly selected project's `seo.config.json`
entry, and remove `homepageOrder`/`card` from the project being replaced.

### Metadata source and required fields

`seo.config.json` is the single metadata source; there is no second project
registry. Every project entry that carries `homepageOrder` must also include
a `card` object with:

- `kicker` — the category label (e.g. "Production system • Platform case study").
- `title` — the card headline.
- `description` — one concise sentence.
- `impact` — one concise impact statement.
- `tech` — an array of technology tag strings.
- `links` — an array of `{ label, href }` objects. Mark exactly one link
  `detail: true` for the stretched case-study link that covers the whole
  card; mark a link `external: true` if it should open in a new tab with
  `rel="noreferrer"` (an external live-product or source link).

### Build/audit failure conditions

`scripts/generate-seo.mjs` throws a build error, and `scripts/audit-homepage-projects.mjs`
fails the same way as a standalone regression check, if any of the
following hold:

- fewer or more than exactly 3 projects carry `homepageOrder`;
- `homepageOrder` values are not a unique cover of `1`, `2`, and `3`
  (duplicates, gaps, or values outside that range);
- a project carrying `homepageOrder` is missing `card` metadata;
- the built `index.html` does not match the configured selection, order,
  or card text (catches drift from a hand-edit or a stale build).

Ambiguity always fails loudly rather than silently rendering something
unintended.

## Verification

`scripts/audit-homepage-projects.mjs` is part of `npm run verify`, the
README's documented verification gate, and both `.github/workflows/technical-seo.yml`
and `.github/workflows/deploy-pages.yml`.

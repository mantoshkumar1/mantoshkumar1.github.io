# Publishing an engineering insight

Insights are published under the stable `/insights/` URL space and presented to visitors as **Insights**. Use this workflow for engineering philosophy, architecture notes, field notes, and technical articles that meet the evidence standard.

## Publication pair

Every publishable insight has two coordinated files:

1. `insights/<slug>.html` — the human-readable article with navigation, evidence boundary, and canonical metadata.
2. `knowledge/articles/<slug>.md` or `knowledge/notes/<slug>.md` — the concise retrieval source Ask Mantosh may quote.

The website page can explain and structure the idea. The knowledge document must remain independently understandable, factual, and safe to retrieve without surrounding context.

## Choose the form

- Use an **engineering philosophy** for durable principles supported by existing first-person material.
- Use an **engineering note** for one bounded heuristic, decision, or lesson.
- Use a **technical article** when architecture, constraints, alternatives, and evidence require deeper treatment.
- Use a **project case study** under `projects/` when working software or source code is the primary evidence.
- Keep the item private or draft when outcomes, ownership, or evidence cannot be disclosed safely.

## Required evidence

At least one of these must support every substantive claim:

- public working software or source code;
- an explicit architecture decision or constraint;
- a résumé-verified fact;
- a reviewed first-person principle or lesson;
- a publishable measurement or outcome with enough context to interpret it.

Never infer employer results, adoption, scale, incidents, or metrics. Put future improvements and hypotheses in clearly labeled sections.

## Publishing steps

1. Create the HTML page from `templates/article.html` and add an explicit evidence-boundary section.
2. Create the paired Markdown document from `knowledge/_template.md`; choose `article` or `note`, set its canonical `url`, and keep `visibility: draft` during review.
3. Add the dated page to `seo.config.json` (including its `card` object, see below), the Insights index, and `llms.txt`. `scripts/generate-seo.mjs` adds every dated article or project to `feed.xml` automatically, and regenerates the homepage Insights teaser automatically — see "Homepage Insights teaser" below.
4. Add the page to `scripts/audit-site.mjs`.
5. Review every claim, then set the knowledge document to `visibility: public`.
6. Run the complete release gates documented in the root README.
7. Push `main`; Pages deploys the article and the knowledge workflow synchronizes the paired retrieval document.
8. Ask one direct, one paraphrased, and one unrelated question. Verify the source label, URL, and no-evidence behavior.

## Homepage Insights teaser

The homepage's Insights section always shows the **3 most recently published
insight articles, newest first**. This is generated automatically at build
time by `scripts/generate-seo.mjs` — there is no manual curation step and the
homepage's `index.html` must never be hand-edited to add, remove, or reorder a
card. The generated markup lives between `<!-- insights:generated:start -->`
and `<!-- insights:generated:end -->` markers inside the `#insights` section's
`.cards` block.

`seo.config.json` is the single source of truth for both ordering and card
text, because it already drives `sitemap.xml` and `feed.xml`:

- **Ordering** — sort by `datePublished` descending; this always wins on its
  own, so an article published 2026-08-09 outranks one published 2026-08-08
  regardless of any other field. `homepageRank` is consulted **only** to
  break a tie between articles that share the exact same `datePublished` — it
  can never promote an older article over a newer one, and it does not bring
  back manual "featuring." Within a same-day tie: lower `homepageRank` wins;
  articles without a rank sort after every ranked one; remaining ties break
  on `dateModified` descending, then route. Set `homepageRank` only when you
  need to control a same-day tie.
- **Card text** — every insight article entry must include a `card` object
  with `kicker`, `readTime`, `title`, `summary`, and `cta`. `generate-seo.mjs`
  throws a build error if a published insight article is missing `card`
  metadata, so the build fails loudly rather than silently omitting a card or
  rendering blank text.

When you publish a new insight with a `datePublished` newer than the current
top 3, it replaces the oldest featured card automatically on the next build —
no `index.html` edit required.

## Empty-section behavior

Autonomous publishing must never leave an editorial lane visually blank and
must never invent a dummy article to fill it. `scripts/content-sections.json`
defines the public-document filter for each visible lane. The matching HTML
element records its current count through `data-content-count`.

When the count is zero, render a designed empty state with
`data-empty-state="true"` that explains what evidence is required. When the
first qualifying public document is added, replace that empty state with the
real content and update the recorded count. `scripts/audit-content-sections.mjs`
fails CI if the public knowledge corpus, count, or empty-state marker disagree.

The empty state is a publication signal, not content. It must not have a
canonical article URL, feed entry, sitemap entry, or Ask Mantosh document.

## Definition of done

An insight is complete only when:

- a visitor can find it from the Insights navigation, and from the homepage automatically once it is among the 3 most recently published insights;
- the page has one H1, canonical metadata, structured data, feed/sitemap discovery, and working links;
- Ask Mantosh can answer a concrete question from its paired public document and cite the canonical page;
- unsupported claims are excluded rather than softened with marketing language;
- documentation and automated audits pass.
- every configured publication lane contains real public content or an explicit evidence-first empty state.
- `feed.xml` is regenerated from dated `article` and `project` entries in `seo.config.json` during verification and deployment; never edit it by hand.

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
3. Add the dated page to `seo.config.json`, the Insights index, the homepage when featured, and `llms.txt`. `scripts/generate-seo.mjs` adds every dated article or project to `feed.xml` automatically.
4. Add the page to `scripts/audit-site.mjs` and `scripts/validate-discoverability.mjs`.
5. Review every claim, then set the knowledge document to `visibility: public`.
6. Run the complete release gates documented in the root README.
7. Push `main`; Pages deploys the article and the knowledge workflow synchronizes the paired retrieval document.
8. Ask one direct, one paraphrased, and one unrelated question. Verify the source label, URL, and no-evidence behavior.

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

- a visitor can find it from the homepage and Insights navigation;
- the page has one H1, canonical metadata, structured data, feed/sitemap discovery, and working links;
- Ask Mantosh can answer a concrete question from its paired public document and cite the canonical page;
- unsupported claims are excluded rather than softened with marketing language;
- documentation and automated audits pass.
- every configured publication lane contains real public content or an explicit evidence-first empty state.
- `feed.xml` is regenerated from dated `article` and `project` entries in `seo.config.json` during verification and deployment; never edit it by hand.

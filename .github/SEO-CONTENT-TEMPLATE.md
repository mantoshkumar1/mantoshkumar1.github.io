# Publishing a future engineering page

Create a directory URL, such as `thinking/release-health/index.html`, by copying
`templates/article.html`. Replace the visible title, summary, page type, and
article body with factual, evidence-backed content.

Do not hand-write canonical, Open Graph, Twitter, robots, or baseline JSON-LD
tags. The Pages workflow generates them from the title, first summary paragraph,
route, and `seo.config.json`, then refreshes `sitemap.xml`.

For a dated technical article, add this optional comment in the document head
and replace both dates before publishing:

```html
<!-- seo:page {"datePublished":"2026-07-11","dateModified":"2026-07-11"} -->
```

For a browser-based software project, use a `projects/project-slug/index.html`
route and add explicit metadata only when `SoftwareApplication` is truthful:

```html
<!-- seo:page {"entityName":"Project name","softwareApplication":true,"applicationCategory":"UtilitiesApplication"} -->
```

The generator infers `TechArticle` for pages under `thinking/`, `articles/`, and
`notes/`; it infers `Project` for pages under `projects/`. Do not claim software
application, dates, metrics, or outcomes that the visible page cannot support.

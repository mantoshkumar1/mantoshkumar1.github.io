# SEO launch runbook

## Canonical host

This repository publishes canonical URLs on `https://mantoshkumar1.github.io`.
Do not deploy these files to `mantoshkumar.com`; that hostname is not this site.
If a custom domain is deliberately configured later, update the site URL and
analytics domain in `seo.config.json`, then update `robots.txt`, `_config.yml`,
`llms.txt`, `feed.xml`, and the discovery validator hostname in one pull
request. The generator will rewrite canonical URLs, Open Graph URLs, Twitter
image URLs, JSON-LD URLs, and `sitemap.xml`.

## GitHub Pages deployment

In **Settings → Pages**, select **GitHub Actions** as the deployment source.
The committed `deploy-pages.yml` workflow generates metadata and the sitemap in
a disposable static artifact, validates it, and deploys only public site files.
It deliberately excludes worker source, knowledge-source Markdown, repository
instructions, plans, and build scripts from the published artifact.

## Google Search Console

1. Add the URL-prefix property `https://mantoshkumar1.github.io/`.
2. Choose the HTML tag verification method and paste the exact
   `google-site-verification` meta tag into the root `index.html` head. Keep it
   after verification.
3. Open **Sitemaps** and submit
   `https://mantoshkumar1.github.io/sitemap.xml`.
4. Use URL Inspection on the home page and the PhotoSahi case study, request
   indexing once, and review Page Indexing and Core Web Vitals monthly.

## Bing Webmaster Tools

Import the verified Search Console property, or add the same URL manually and
use the offered HTML file, meta-tag, or DNS verification method. Submit the
same sitemap in **Sitemaps**. Importing a verified Search Console property also
imports its sitemap configuration.

## Analytics recommendation

Use **Plausible Analytics** for this personal engineering site. Its lightweight,
privacy-friendly script is generated on every public page and works with the
existing AI-referral signal. Create a Plausible site for
`mantoshkumar1.github.io`, then verify its dashboard receives traffic. Do not
install GA4 alongside it by default.

Choose GA4 only if you later need Google Ads integrations, detailed event
funnels, or a Google-owned analytics stack; it brings more governance and
consent work. Plausible is the better default for a fast engineering portfolio.

## Ongoing publishing

Copy `templates/article.html` for every new engineering article or note. Prefer
directory URLs such as `/thinking/article-slug/`, replace the visible title and
summary with factual content, and push to `main`. The Pages workflow generates
the canonical URL, metadata, Open Graph and Twitter cards, JSON-LD, RSS link,
and sitemap entry automatically. Use the optional `seo:page` comment only for
published or modified dates and software-project schema. The technical SEO
workflow rejects pages missing required metadata, JSON-LD, or a single `h1`.

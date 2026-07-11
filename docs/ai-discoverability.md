# AI search and answer-engine discoverability

This site is configured for technical eligibility and machine readability; no
crawler directive, sitemap, feed, or structured-data markup guarantees
inclusion, ranking, citation, or answer-engine listing.

## Crawler policy

`/robots.txt` permits public-page discovery by OAI-SearchBot, ChatGPT-User,
PerplexityBot, Perplexity-User, ClaudeBot, Claude-SearchBot, Googlebot, Bingbot,
and general crawlers. It intentionally does **not** mention `GPTBot`. Search and
answer discovery are separate from permission to use content for model training.

Public assets, JavaScript, images, JSON-LD, project pages, and knowledge
Markdown are not blocked. Worker source, planning material, and repository
administration paths remain excluded.

## Files and validation

Run static validation before publishing:

```bash
node scripts/validate-discoverability.mjs
```

After GitHub Pages deploys, verify public reachability and canonical responses:

```bash
curl -I https://mantoshkumar1.github.io/robots.txt
curl -I https://mantoshkumar1.github.io/sitemap.xml
curl -I https://mantoshkumar1.github.io/llms.txt
curl -I https://mantoshkumar1.github.io/feed.xml
curl -I https://mantoshkumar1.github.io/projects/photosahi.html
```

Validate JSON-LD with [Schema Markup Validator](https://validator.schema.org/).
Use browser view-source or a non-JavaScript HTTP client to confirm meaningful
page text, one H1, canonical URLs, and no unintended `noindex` directives.

`llms-full.txt` is intentionally not published. The site has no automated build
that can assemble it from the public source without duplicating content or
going stale. Add it only when a build step can generate it from the same public
documents that power the site and Ask Mantosh.

## Search-engine submission

1. In [Google Search Console](https://search.google.com/search-console), add and
   verify the `https://mantoshkumar1.github.io/` URL-prefix property. Submit
   `https://mantoshkumar1.github.io/sitemap.xml` in **Sitemaps**. Use **URL
   Inspection** for a newly published canonical page and select **Request
   indexing** when appropriate.
2. In [Bing Webmaster Tools](https://www.bing.com/webmasters/), add and verify
   the same canonical host, then submit the sitemap in **Sitemaps**. Bing can
   also import verified Google Search Console sites.
3. Use Bing's URL Submission tool for individual changed URLs when necessary.
   For a publish pipeline with a stable custom domain, evaluate
   [IndexNow](https://www.indexnow.org/documentation): host its ownership-key
   file and submit only changed canonical URLs. Do not add an IndexNow key or
   submission call to this GitHub Pages repository until a key-management and
   publish workflow is selected.
4. Confirm reports use the GitHub Pages canonical host, not an alternate host or
   a non-canonical URL form.

ChatGPT Search, Perplexity, and Claude do not have an equivalent public
webmaster URL-submission workflow documented here. Rely on crawlability,
canonical content, links, and sitemaps rather than claiming a submission path.

## AI referral analytics

`assets/js/ai-referral-analytics.js` recognizes only documented referrers from
ChatGPT, Perplexity, Claude, Copilot, and Gemini. It does not fingerprint users,
store identifiers, or send network requests. It emits an `ai-referral` browser
event and optionally forwards the source name to an already-configured Umami or
Plausible installation. Configure a consent-appropriate analytics provider
separately if aggregate reporting is desired.

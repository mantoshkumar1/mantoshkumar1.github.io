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

## Post-publication review (proposed)

For a significant publication change, record a small manual snapshot at the
next monthly content or maintenance review. Check sooner only if a provider
report shows a concrete issue. Repeat at the next monthly review only while a
material item remains unresolved. This is a suggested internal cadence, not a
crawl-time expectation or provider service level; it creates no scheduled task
or automatic submission.

For the verified canonical property in each provider:

- Record the sitemap's reported processing status and last-read date, plus
  submitted or discovered URL counts when shown. A sitemap being read or URLs
  being discovered does not establish that each URL was crawled or indexed.
- Check a small, consistent sample of newly published or materially changed
  canonical Insights and Projects. In Google's [Sitemaps report](https://support.google.com/webmasters/answer/7451001),
  [Page indexing report](https://support.google.com/webmasters/answer/7440203),
  and [URL Inspection](https://support.google.com/webmasters/answer/9012289),
  record each state and reason as reported. In Bing, use its
  [Sitemaps](https://www2.bing.com/webmasters/help/sitemaps-3b5cf6ed)
  and [URL Inspection](https://www.bing.com/webmasters/help/URL-Inspection-55a30305)
  reports. Keep discovery, crawl eligibility, crawling, and indexing distinct.
  A discovered or crawlable URL is not necessarily indexed.
- Record clicks, impressions, and a few query or landing-page rows only when
  visible for an explicit date range in Google's
  [Search results Performance report](https://support.google.com/webmasters/answer/7576553)
  or Bing's [Search Performance report](https://www.bing.com/webmasters/help/search-performance-c680da36).
  Do not export query data for this review.

Use the report's reason and the page's intended canonical and crawl settings to
triage an exclusion. An intentional duplicate, alternate, or noindex page is
not automatically a defect. For a possible site issue, recheck the live
canonical URL, response, robots/noindex directives, sitemap entry, and internal
links; record a separate issue if a reproducible code change is needed. An
unclear reason stays unclear until investigated. Do not call ordinary elapsed
time a defect by itself or infer a provider result from static configuration.

### Blank review record

- Release date (UTC) / exact deployed revision:
- Sitemap URL / provider property / review date:
- Report date range:
- Sitemap status / last-read date / submitted or discovered count (if shown):
- Sample canonical URLs and provider-reported state, reason, and check date:
- Clicks / impressions / visible queries or landing pages:
- Missing information (for example, no access, no report row, or data not shown):
- Triage (intentional exclusion / reproducible site issue / unclear) and evidence:
- Next manual review date, if a material item remains open:

Write an actual numeric zero only when the report shows zero. Use `not shown`,
`unavailable`, or `not assessed` when data or access is absent; absence is not
zero. Leave this record blank until someone performs the review. Do not claim
property verification, submission, baseline measurement, or indexing from this
proposal.

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

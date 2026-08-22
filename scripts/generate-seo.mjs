import { readFile, readdir, writeFile } from "node:fs/promises";
import { resolve, relative, dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_ROOT = resolve(process.env.SITE_ROOT || process.cwd());
const CONFIG_PATH = resolve(process.env.SEO_CONFIG || join(SOURCE_ROOT, "seo.config.json"));
const GENERATED_START = "<!-- seo:generated:start -->";
const GENERATED_END = "<!-- seo:generated:end -->";
export const INSIGHTS_START = "<!-- insights:generated:start -->";
export const INSIGHTS_END = "<!-- insights:generated:end -->";
export const PROJECTS_START = "<!-- projects:generated:start -->";
export const PROJECTS_END = "<!-- projects:generated:end -->";

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function escapeJson(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function stripHtml(value) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function cleanDescription(value) {
  const text = stripHtml(value);
  return text.length <= 160 ? text : `${text.slice(0, 157).trimEnd()}…`;
}

function pathToRoute(root, file) {
  const path = relative(root, file).replaceAll("\\", "/");
  if (path === "index.html") return "/";
  if (path.endsWith("/index.html")) return `/${path.slice(0, -"index.html".length)}`;
  return `/${path}`;
}

function routeToUrl(site, route) {
  return `${site.url.replace(/\/$/, "")}${route}`;
}

function breadcrumbName(route, title) {
  if (route === "/") return "Home";
  const segment = route.replace(/^\//, "").replace(/\/$/, "").split("/").at(-1).replace(/\.html$/, "");
  return segment ? title.replace(/\s*\|\s*Mantosh Kumar$/i, "") : "Home";
}

function schemaFor({ site, page, url, route }) {
  const itemListElement = [{ "@type": "ListItem", position: 1, name: "Home", item: site.url }];
  for (const crumb of page.breadcrumbs || []) {
    itemListElement.push({
      "@type": "ListItem",
      position: itemListElement.length + 1,
      name: crumb.name,
      item: routeToUrl(site, crumb.path)
    });
  }
  if (route !== "/") itemListElement.push({ "@type": "ListItem", position: itemListElement.length + 1, name: breadcrumbName(route, page.title), item: url });
  const graph = [{
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumb`,
    itemListElement
  }];

  const basePage = {
    "@id": `${url}#webpage`,
    "@type": page.schemaType || "WebPage",
    name: page.title,
    description: page.description,
    url,
    inLanguage: site.language,
    isPartOf: { "@id": `${site.url}/#website` },
    breadcrumb: { "@id": `${url}#breadcrumb` }
  };

  if (page.kind === "home") {
    graph.push(
      {
        "@type": "Person",
        "@id": `${site.url}/#person`,
        name: site.author,
        url: site.url,
        jobTitle: "Staff Software Engineer",
        description: site.description,
        sameAs: ["https://github.com/mantoshkumar1", "https://www.linkedin.com/in/mantoshk/"]
      },
      {
        "@type": "WebSite",
        "@id": `${site.url}/#website`,
        name: site.name,
        alternateName: "Mantosh Kumar Engineering Portfolio",
        url: site.url,
        inLanguage: site.language,
        publisher: { "@id": `${site.url}/#person` }
      },
      { ...basePage, mainEntity: { "@id": `${site.url}/#person` } }
    );
  } else if (page.kind === "project") {
    graph.push(
      basePage,
      {
        "@type": ["Project", "CreativeWork"],
        "@id": `${url}#case-study`,
        name: `${page.entityName || page.title.replace(/\s*\|\s*Mantosh Kumar$/i, "")} architecture case study`,
        description: page.description,
        url,
        author: { "@id": `${site.url}/#person` },
        mainEntityOfPage: url,
        ...(page.dateModified ? { dateModified: page.dateModified } : {})
      }
    );
    if (page.softwareApplication) graph.push({
      "@type": "SoftwareApplication",
      "@id": `${url}#software`,
      name: page.entityName || page.title.replace(/\s*\|\s*Mantosh Kumar$/i, ""),
      description: page.description,
      applicationCategory: page.applicationCategory || "UtilitiesApplication",
      operatingSystem: "Web",
      isAccessibleForFree: true,
      url,
      author: { "@id": `${site.url}/#person` }
    });
  } else if (page.kind === "article") {
    graph.push({
      ...basePage,
      "@type": "TechArticle",
      headline: page.title.replace(/\s*\|\s*Mantosh Kumar$/i, ""),
      author: { "@type": "Person", name: site.author, url: site.url },
      ...(page.datePublished ? { datePublished: page.datePublished } : {}),
      ...(page.dateModified ? { dateModified: page.dateModified } : {})
    });
  } else {
    graph.push(basePage);
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

function generatedHead({ site, page, url, route, canonicalUrl = url }) {
  const image = routeToUrl(site, page.image || site.socialImage);
  const schema = schemaFor({ site, page, url, route });
  const analytics = site.analytics?.provider === "plausible"
    ? `\n    <script>
      window.addEventListener("load", () => {
        const analytics = document.createElement("script");
        analytics.defer = true;
        analytics.dataset.domain = "${escapeHtml(site.analytics.domain)}";
        analytics.src = "https://plausible.io/js/script.js";
        document.head.append(analytics);
      }, { once: true });
    </script>`
    : "";
  return `${GENERATED_START}
    <meta name="description" content="${escapeHtml(page.description)}" />
    <meta name="author" content="${escapeHtml(site.author)}" />
    <meta name="robots" content="${page.noindex ? "noindex,follow" : "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"}" />
    <meta name="theme-color" content="${escapeHtml(site.themeColor)}" />
    <meta name="application-name" content="${escapeHtml(site.name)}" />
    <meta name="apple-mobile-web-app-title" content="${escapeHtml(site.name)}" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <link rel="alternate" type="application/rss+xml" title="${escapeHtml(site.name)} — Engineering Writing and Systems" href="${escapeHtml(routeToUrl(site, "/feed.xml"))}" />
    <link rel="manifest" href="/site.webmanifest" />
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <meta property="og:locale" content="en_CA" />
    <meta property="og:title" content="${escapeHtml(page.title)}" />
    <meta property="og:description" content="${escapeHtml(page.description)}" />
    <meta property="og:type" content="${page.kind === "article" ? "article" : "website"}" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta property="og:site_name" content="${escapeHtml(site.name)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtml(page.title)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(page.title)}" />
    <meta name="twitter:description" content="${escapeHtml(page.description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
    <meta name="twitter:image:alt" content="${escapeHtml(page.title)}" />
    <script type="application/ld+json">${escapeJson(schema)}</script>${analytics}
    <script defer src="/assets/js/ai-referral-analytics.js"></script>
    ${GENERATED_END}`;
}

function removeOldSeo(html) {
  const patterns = [
    new RegExp(`${GENERATED_START}[\\s\\S]*?${GENERATED_END}\\s*`, "g"),
    /\s*<meta\s+(?:name|property)=["'](?:description|author|robots|theme-color|keywords|twitter:[^"']+|og:[^"']+)["'][^>]*>\s*/gi,
    /\s*<link\s+[^>]*rel=["'](?:canonical|manifest|icon|apple-touch-icon)["'][^>]*>\s*/gi,
    /\s*<link\s+[^>]*rel=["']alternate["'][^>]*type=["']application\/(?:rss|atom)\+xml["'][^>]*>\s*/gi,
    /\s*<script\s+type=["']application\/ld\+json["']>[\s\S]*?<\/script>\s*/gi,
    /\s*<script\s+defer\s+data-domain=["'][^"']+["']\s+src=["']https:\/\/plausible\.io\/js\/script\.js["']><\/script>\s*/gi,
    /\s*<script\s+defer\s+src=["']\/?assets\/js\/ai-referral-analytics\.js["']><\/script>\s*/gi
  ];
  return patterns.reduce((result, pattern) => result.replace(pattern, "\n"), html);
}

function metadataFromHtml(html, route, config, knowledgeVisibility) {
  const override = config.pages?.[route] || {};
  const inline = html.match(/<!--\s*seo:page\s+([\s\S]*?)-->/i)?.[1]?.trim();
  let inlineMetadata = {};
  if (inline) {
    try { inlineMetadata = JSON.parse(inline); } catch { throw new Error(`${route}: invalid seo:page JSON.`); }
  }
  const currentTitle = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1];
  const heading = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  const firstParagraph = html.match(/<h1[^>]*>[\s\S]*?<\/h1>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i)?.[1];
  const title = override.title || stripHtml(currentTitle || heading || config.site.name);
  const description = override.description || cleanDescription(firstParagraph || config.site.description);
  const inferredKind = route.startsWith("/insights/") && route !== "/insights/"
    ? "article"
    : route.startsWith("/articles/") || route.startsWith("/notes/")
      ? "article"
      : route.startsWith("/projects/")
        ? "project"
        : "page";
  // Single source of truth: a page paired with a knowledge/*.md document takes its
  // indexability from that document's own `visibility` field, not a second hand-set
  // flag that can silently drift out of sync with it. Only public documents are
  // indexable; draft/private documents are forced noindex regardless of what an
  // inline seo:page comment claims. An explicit seo.config.json page override still
  // wins over this, for the rare case that genuinely needs one.
  const pairedVisibility = knowledgeVisibility?.get(route);
  const visibilityNoindex = pairedVisibility === undefined ? undefined : pairedVisibility !== "public";
  return {
    title,
    description,
    kind: inferredKind,
    ...inlineMetadata,
    ...(visibilityNoindex === undefined ? {} : { noindex: visibilityNoindex }),
    ...override
  };
}

async function htmlFiles(directory, files = []) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if ([".git", ".github", "assets", "chat-worker", "knowledge", "node_modules", "scripts", "templates", "dist"].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await htmlFiles(path, files);
    else if (entry.isFile() && extname(entry.name) === ".html") files.push(path);
  }
  return files;
}

async function markdownFiles(directory, files = []) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await markdownFiles(path, files);
    else if (entry.isFile() && extname(entry.name) === ".md") files.push(path);
  }
  return files;
}

function parseFrontMatterField(raw, key) {
  const match = raw.match(new RegExp(`^${key}\\s*:\\s*(.+)$`, "m"));
  return match?.[1]?.trim().replace(/^['"]|['"]$/g, "");
}

/**
 * Maps each route backed by a knowledge/*.md document to that document's declared
 * `visibility`. Used so a draft or private knowledge document can never end up
 * indexable in sitemap.xml/feed.xml merely because its paired HTML page forgot to
 * say so — the knowledge document's own visibility field is authoritative.
 */
async function knowledgeVisibilityByRoute(root) {
  const map = new Map();
  const files = await markdownFiles(join(root, "knowledge"));
  for (const file of files) {
    const raw = await readFile(file, "utf8");
    const frontMatter = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1];
    if (!frontMatter) continue;
    const url = parseFrontMatterField(frontMatter, "url");
    const visibility = parseFrontMatterField(frontMatter, "visibility");
    if (!url || !visibility) continue;
    const route = /^https?:\/\//i.test(url) ? new URL(url).pathname : url;
    map.set(route, visibility);
  }
  return map;
}

function formatCardDate(value) {
  const date = new Date(`${value}T12:00:00Z`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

/**
 * The homepage Insights teaser always shows the 3 most recently published
 * insight articles, newest first — no manual curation, and nothing below can
 * recreate the old hand-picked "featured" model. `datePublished` is the sole
 * ordering signal and always wins on its own: an article published
 * 2026-08-09 outranks one published 2026-08-08 no matter what any other
 * field says. `homepageRank` is consulted ONLY to break a tie between
 * articles that share the exact same `datePublished` — the comparator
 * returns before ever reading `homepageRank` when dates differ, so a rank
 * can never promote an older article over a newer one. Within a same-day
 * tie: lower `homepageRank` wins; articles without a rank sort after ranked
 * ones; remaining ties break on `dateModified` (newest first), then route
 * (alphabetical) so the result is fully deterministic regardless of input
 * order.
 */
// Exported so scripts/audit-homepage-insights.mjs can verify the built
// homepage against this exact selection instead of re-implementing (and
// risking drift from) the sort/tiebreak rules.
export function selectHomepageInsights(entries) {
  const candidates = entries.filter(({ route, page }) =>
    page.kind === "article" && route.startsWith("/insights/") && route !== "/insights/" && !page.noindex
  );
  const missingCard = candidates.filter(({ page }) => !page.card);
  if (missingCard.length) {
    throw new Error(`Homepage insight cards require "card" metadata in seo.config.json: ${missingCard.map(({ route }) => route).join(", ")}`);
  }
  const missingDate = candidates.filter(({ page }) => !page.datePublished);
  if (missingDate.length) {
    throw new Error(`Homepage insight cards require datePublished in seo.config.json: ${missingDate.map(({ route }) => route).join(", ")}`);
  }
  const sorted = [...candidates].sort((left, right) => {
    if (left.page.datePublished !== right.page.datePublished) return right.page.datePublished.localeCompare(left.page.datePublished);
    const leftRank = left.page.homepageRank ?? Infinity;
    const rightRank = right.page.homepageRank ?? Infinity;
    if (leftRank !== rightRank) return leftRank - rightRank;
    const leftModified = left.page.dateModified || "";
    const rightModified = right.page.dateModified || "";
    if (leftModified !== rightModified) return rightModified.localeCompare(leftModified);
    return left.route.localeCompare(right.route);
  });
  const top3 = sorted.slice(0, 3);
  if (top3.length < 3) throw new Error(`Homepage requires at least 3 published insight articles with card metadata; found ${top3.length}.`);
  return top3;
}

function homepageInsightsCards(entries) {
  const top3 = selectHomepageInsights(entries);
  const cards = top3.map(({ page, route }) => {
    const card = page.card;
    const dateLabel = formatCardDate(page.datePublished);
    const href = route.replace(/^\//, "");
    return `            <article class="card insight-card">
              <p class="card-kicker">${escapeHtml(card.kicker)} • ${escapeHtml(card.readTime)} • <time datetime="${escapeHtml(page.datePublished)}">${escapeHtml(dateLabel)}</time></p>
              <h3>${escapeHtml(card.title)}</h3>
              <p>${escapeHtml(card.summary)}</p>
              <a href="${escapeHtml(href)}">${escapeHtml(card.cta)} <span aria-hidden="true">→</span></a>
            </article>`;
  }).join("\n");
  return `${INSIGHTS_START}\n${cards}\n            ${INSIGHTS_END}`;
}

function injectHomepageInsights(html, entries) {
  if (!html.includes(INSIGHTS_START)) return html;
  const block = homepageInsightsCards(entries);
  return html.replace(new RegExp(`${INSIGHTS_START}[\\s\\S]*?${INSIGHTS_END}`), block);
}

/**
 * Homepage "Selected Projects" is deliberately NOT the Insights recency
 * model. Projects are heavier hiring evidence than Insights, the section
 * heading is literally "Selected Projects," and project metadata mostly
 * carries `dateModified` rather than a meaningful publication chronology —
 * sorting by recency would be a poor semantic fit and could bump a strong
 * Staff/Principal-level case study for a newer but weaker project. Selection
 * here is purely editorial: an entry qualifies only when it carries an
 * explicit `homepageOrder` (1-3) in seo.config.json, and the 3 qualifying
 * entries render in that exact order. There is no date fallback and no
 * relationship to Insights' `homepageRank`, which is only ever a same-day
 * tiebreaker for an otherwise date-driven sort — the two fields are
 * intentionally different mechanisms and must not be conflated.
 */
export function selectHomepageProjects(entries) {
  const candidates = entries.filter(({ page }) =>
    page.kind === "project" && !page.noindex && page.homepageOrder !== undefined && page.homepageOrder !== null
  );
  const missingCard = candidates.filter(({ page }) => !page.card);
  if (missingCard.length) {
    throw new Error(`Selected Projects require "card" metadata in seo.config.json: ${missingCard.map(({ route }) => route).join(", ")}`);
  }
  if (candidates.length !== 3) {
    const found = candidates.map(({ route }) => route).join(", ");
    throw new Error(`Selected Projects requires exactly 3 entries with "homepageOrder" set in seo.config.json; found ${candidates.length}${found ? ` (${found})` : ""}.`);
  }
  const orders = candidates.map(({ page }) => page.homepageOrder);
  if (new Set(orders).size !== orders.length) {
    throw new Error(`Selected Projects "homepageOrder" values must be unique; found ${orders.join(", ")}.`);
  }
  if (!orders.every((order) => [1, 2, 3].includes(order))) {
    throw new Error(`Selected Projects "homepageOrder" values must be exactly 1, 2, and 3; found ${[...orders].sort().join(", ")}.`);
  }
  return [...candidates].sort((left, right) => left.page.homepageOrder - right.page.homepageOrder);
}

function renderProjectLink(link) {
  const attrs = [];
  if (link.detail) attrs.push('class="project-detail-link"');
  attrs.push(`href="${escapeHtml(link.href)}"`);
  if (link.external) attrs.push('target="_blank" rel="noreferrer"');
  return `<a ${attrs.join(" ")}>${escapeHtml(link.label)}</a>`;
}

function homepageProjectsCards(entries) {
  const selected = selectHomepageProjects(entries);
  const cards = selected.map(({ page }) => {
    const card = page.card;
    const tech = card.tech.map((tag) => `                <span>${escapeHtml(tag)}</span>`).join("\n");
    const links = card.links.map((link) => `                ${renderProjectLink(link)}`).join("\n");
    const live = page.live
      ? `\n              <p class="project-live"><span class="project-live-dot" aria-hidden="true"></span>Live</p>`
      : "";
    return `            <article class="card project-card">
              <p class="card-kicker">${escapeHtml(card.kicker)}</p>${live}
              <h3>${escapeHtml(card.title)}</h3>
              <p>${escapeHtml(card.description)}</p>
              <p class="project-impact">${escapeHtml(card.impact)}</p>
              <div class="tech">
${tech}
              </div>
              <div class="card-links">
${links}
              </div>
            </article>`;
  }).join("\n");
  return `${PROJECTS_START}\n${cards}\n            ${PROJECTS_END}`;
}

function injectHomepageProjects(html, entries) {
  if (!html.includes(PROJECTS_START)) return html;
  const block = homepageProjectsCards(entries);
  return html.replace(new RegExp(`${PROJECTS_START}[\\s\\S]*?${PROJECTS_END}`), block);
}

function sitemap(site, entries) {
  const urls = entries.filter((entry) => !entry.page.noindex).map(({ url }) => `  <url>\n    <loc>${escapeHtml(url)}</loc>\n  </url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function atomTimestamp(value) {
  if (!value) return null;
  const timestamp = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00Z` : value;
  if (Number.isNaN(Date.parse(timestamp))) throw new Error(`Invalid feed date: ${value}`);
  return new Date(timestamp).toISOString().replace(".000Z", "Z");
}

function atomFeed(site, entries) {
  const publications = entries.filter(({ page }) => !page.noindex && ["article", "project"].includes(page.kind));
  const undated = publications.filter(({ page }) => !(page.datePublished || page.dateModified));
  if (undated.length) throw new Error(`Feed publications need datePublished or dateModified: ${undated.map(({ route }) => route).join(", ")}`);
  const items = publications
    .map(({ page, url }) => {
      const published = atomTimestamp(page.datePublished || page.dateModified);
      const updated = atomTimestamp(page.dateModified || page.datePublished);
      return { page, url, published, updated };
    })
    .sort((left, right) => right.published.localeCompare(left.published) || left.url.localeCompare(right.url));
  if (!items.length) throw new Error("Feed generation requires at least one dated article or project.");
  const updated = items.reduce((latest, item) => item.updated > latest ? item.updated : latest, items[0].updated);
  const body = items.map(({ page, url, published, updated: itemUpdated }) => {
    const title = page.title.replace(/\s*\|\s*Mantosh Kumar$/i, "");
    const category = page.kind === "article" ? "engineering-insight" : "project-case-study";
    return `  <entry>
    <title>${escapeHtml(title)}</title>
    <id>${escapeHtml(url)}</id>
    <link href="${escapeHtml(url)}" />
    <published>${published}</published>
    <updated>${itemUpdated}</updated>
    <author><name>${escapeHtml(site.author)}</name></author>
    <category term="${category}" />
    <summary>${escapeHtml(page.description)}</summary>
  </entry>`;
  }).join("\n");
  const home = site.url.replace(/\/$/, "");
  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeHtml(site.name)} — Engineering Writing and Systems</title>
  <id>${escapeHtml(`${home}/`)}</id>
  <link href="${escapeHtml(`${home}/`)}" />
  <link href="${escapeHtml(`${home}/feed.xml`)}" rel="self" type="application/atom+xml" />
  <updated>${updated}</updated>
  <author><name>${escapeHtml(site.author)}</name></author>
  <subtitle>${escapeHtml(site.description)}</subtitle>
${body}
</feed>
`;
}

// Shared by loadEntries() and generateSeo() so there is exactly one place
// that reads seo.config.json, walks the HTML files, and derives each
// route's metadata (including `card`/`homepageRank`). generateSeo() needs
// the raw `html`/`file` alongside `page` for its rewrite pass; loadEntries()
// (used by scripts/audit-homepage-insights.mjs) only needs the metadata.
async function collectItems(root, configPath) {
  const config = JSON.parse(await readFile(configPath, "utf8"));
  const files = await htmlFiles(root);
  const knowledgeVisibility = await knowledgeVisibilityByRoute(root);
  const items = [];
  for (const file of files) {
    const route = pathToRoute(root, file);
    const html = await readFile(file, "utf8");
    const page = metadataFromHtml(html, route, config, knowledgeVisibility);
    const url = routeToUrl(config.site, route);
    items.push({ file, route, html, page, url });
  }
  return { config, items };
}

// Exported so scripts/audit-homepage-insights.mjs can compute the same
// route/page metadata (including seo.config.json's `card`/`homepageRank`
// fields) that generateSeo() uses, without re-reading or re-deriving it.
export async function loadEntries(root = SOURCE_ROOT, configPath = CONFIG_PATH) {
  const { config, items } = await collectItems(root, configPath);
  return { config, entries: items.map(({ page, route, url }) => ({ page, route, url })) };
}

export { formatCardDate };

export async function generateSeo(root = SOURCE_ROOT, configPath = CONFIG_PATH) {
  // Pass 1: read every file and compute its metadata first. The homepage
  // Insights teaser needs every insight article's page metadata (dates, card
  // text) before it can render, and directory traversal order does not
  // guarantee index.html is processed after insights/*.html.
  const { config, items } = await collectItems(root, configPath);
  const entries = items.map(({ page, route, url }) => ({ page, route, url }));

  // Pass 2: rewrite each file's SEO head block and, for the homepage, its
  // generated Insights cards, now that `entries` is fully populated.
  for (const item of items) {
    const { file, route, page, url } = item;
    let html = item.html;
    const canonicalUrl = page.canonicalPath ? routeToUrl(config.site, page.canonicalPath) : url;
    html = removeOldSeo(html);
    html = html.replace(/<html\b([^>]*)>/i, (_match, attrs) => `<html${attrs.replace(/\s+lang=["'][^"']*["']/i, "")} lang="${config.site.language}">`);
    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(page.title)}</title>`);
    const block = generatedHead({ site: config.site, page, url, route, canonicalUrl });
    const headerPreamble = /(<meta\s+charset=["'][^"']+["']\s*\/?>(?:\s|\n)*<meta\s+name=["']viewport["'][^>]*>)/i;
    html = headerPreamble.test(html)
      ? html.replace(headerPreamble, `$1\n    ${block}`)
      : html.replace(/<head>/i, `<head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    ${block}`);
    html = injectHomepageInsights(html, entries);
    html = injectHomepageProjects(html, entries);
    html = html.replace(/[\t ]+$/gm, "");
    await writeFile(file, html);
  }
  await writeFile(join(root, "sitemap.xml"), sitemap(config.site, entries));
  await writeFile(join(root, "feed.xml"), atomFeed(config.site, entries));
  return entries;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const entries = await generateSeo();
  console.log(`Generated SEO metadata, sitemap, and feed for ${entries.length} pages.`);
}

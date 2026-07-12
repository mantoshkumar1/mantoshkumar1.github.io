import { readFile, readdir, writeFile } from "node:fs/promises";
import { resolve, relative, dirname, extname, join } from "node:path";

const SOURCE_ROOT = resolve(process.env.SITE_ROOT || process.cwd());
const CONFIG_PATH = resolve(process.env.SEO_CONFIG || join(SOURCE_ROOT, "seo.config.json"));
const GENERATED_START = "<!-- seo:generated:start -->";
const GENERATED_END = "<!-- seo:generated:end -->";

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

function pathToRoute(file) {
  const path = relative(SOURCE_ROOT, file).replaceAll("\\", "/");
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

function generatedHead({ site, page, url, route }) {
  const image = routeToUrl(site, page.image || site.socialImage);
  const schema = schemaFor({ site, page, url, route });
  const analytics = site.analytics?.provider === "plausible"
    ? `\n    <script defer data-domain="${escapeHtml(site.analytics.domain)}" src="https://plausible.io/js/script.js"></script>`
    : "";
  return `${GENERATED_START}
    <meta name="description" content="${escapeHtml(page.description)}" />
    <meta name="author" content="${escapeHtml(site.author)}" />
    <meta name="robots" content="${page.noindex ? "noindex,follow" : "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"}" />
    <meta name="theme-color" content="${escapeHtml(site.themeColor)}" />
    <meta name="application-name" content="${escapeHtml(site.name)}" />
    <meta name="apple-mobile-web-app-title" content="${escapeHtml(site.name)}" />
    <link rel="canonical" href="${escapeHtml(url)}" />
    <link rel="alternate" type="application/rss+xml" title="${escapeHtml(site.name)} — Engineering Writing and Systems" href="${escapeHtml(routeToUrl(site, "/feed.xml"))}" />
    <link rel="manifest" href="/site.webmanifest" />
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <meta property="og:locale" content="en_CA" />
    <meta property="og:title" content="${escapeHtml(page.title)}" />
    <meta property="og:description" content="${escapeHtml(page.description)}" />
    <meta property="og:type" content="${page.kind === "article" ? "article" : "website"}" />
    <meta property="og:url" content="${escapeHtml(url)}" />
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

function metadataFromHtml(html, route, config) {
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
  const inferredKind = route.startsWith("/thinking/") && route !== "/thinking/"
    ? "article"
    : route.startsWith("/articles/") || route.startsWith("/notes/")
      ? "article"
      : route.startsWith("/projects/")
        ? "project"
        : "page";
  return { title, description, kind: inferredKind, ...inlineMetadata, ...override };
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

function sitemap(site, entries) {
  const urls = entries.filter((entry) => !entry.page.noindex).map(({ url }) => `  <url>\n    <loc>${escapeHtml(url)}</loc>\n  </url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export async function generateSeo(root = SOURCE_ROOT, configPath = CONFIG_PATH) {
  const config = JSON.parse(await readFile(configPath, "utf8"));
  const files = await htmlFiles(root);
  const entries = [];
  for (const file of files) {
    const route = pathToRoute(file);
    let html = await readFile(file, "utf8");
    const page = metadataFromHtml(html, route, config);
    const url = routeToUrl(config.site, route);
    html = removeOldSeo(html);
    html = html.replace(/<html\b([^>]*)>/i, (_match, attrs) => `<html${attrs.replace(/\s+lang=["'][^"']*["']/i, "")} lang="${config.site.language}">`);
    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(page.title)}</title>`);
    const block = generatedHead({ site: config.site, page, url, route });
    const headerPreamble = /(<meta\s+charset=["'][^"']+["']\s*\/?>(?:\s|\n)*<meta\s+name=["']viewport["'][^>]*>)/i;
    html = headerPreamble.test(html)
      ? html.replace(headerPreamble, `$1\n    ${block}`)
      : html.replace(/<head>/i, `<head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    ${block}`);
    html = html.replace(/[\t ]+$/gm, "");
    await writeFile(file, html);
    entries.push({ page, url });
  }
  await writeFile(join(root, "sitemap.xml"), sitemap(config.site, entries));
  return entries;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const entries = await generateSeo();
  console.log(`Generated SEO metadata and sitemap for ${entries.length} pages.`);
}

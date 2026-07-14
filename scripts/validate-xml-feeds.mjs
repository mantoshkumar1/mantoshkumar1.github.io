import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
let failures = 0;

function check(condition, message) {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  }
}

function assertValidXml(name, content) {
  check(content.startsWith("<?xml"), `${name} must start with an XML declaration`);
  check(!content.includes("\uFEFF"), `${name} must not contain a UTF-8 BOM`);
  check(/<\?xml[^?]*\?>/.test(content), `${name} must have a well-formed XML declaration`);
}

const sitemap = await readFile(`${root}/sitemap.xml`, "utf8");
assertValidXml("sitemap.xml", sitemap);
check(sitemap.includes("<urlset"), "sitemap.xml must contain a urlset root element");
check(sitemap.includes("</urlset>"), "sitemap.xml must close the urlset element");

const feed = await readFile(`${root}/feed.xml`, "utf8");
const config = JSON.parse(await readFile(`${root}/seo.config.json`, "utf8"));
assertValidXml("feed.xml", feed);
check(feed.includes("<feed"), "feed.xml must contain a feed root element");
check(feed.includes("</feed>"), "feed.xml must close the feed element");
check(feed.includes('rel="self"'), "feed.xml must include a self link");
const configuredPublications = Object.entries(config.pages).filter(([, page]) =>
  !page.noindex && ["article", "project"].includes(page.kind)
);
for (const [route, page] of configuredPublications) {
  check(Boolean(page.datePublished || page.dateModified), `${route} needs datePublished or dateModified for automatic feed publication`);
}
const feedablePages = configuredPublications.filter(([, page]) => page.datePublished || page.dateModified);
for (const [route] of feedablePages) {
  const url = `${config.site.url.replace(/\/$/, "")}${route}`;
  check(feed.includes(`<id>${url}</id>`), `feed.xml must include configured publication ${route}`);
}
check((feed.match(/<entry>/g) || []).length === feedablePages.length, "feed.xml entries must be generated exactly from dated articles and projects");

if (failures) process.exit(1);
console.log("XML feed checks passed.");

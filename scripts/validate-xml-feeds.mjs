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
assertValidXml("feed.xml", feed);
check(feed.includes("<feed"), "feed.xml must contain a feed root element");
check(feed.includes("</feed>"), "feed.xml must close the feed element");
check(feed.includes('rel="self"'), "feed.xml must include a self link");

if (failures) process.exit(1);
console.log("XML feed checks passed.");

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const origin = "https://mantoshkumar1.github.io";
const pages = ["index.html", "systems/index.html", "experience/index.html", "resume/index.html", "contact/index.html", "projects/photosahi.html", "projects/workflow-automation-toolkit.html"];
let failures = 0;

function check(condition, message) {
  if (!condition) { failures += 1; console.error(`FAIL: ${message}`); }
}

const robots = await readFile(`${root}/robots.txt`, "utf8");
for (const agent of ["OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "Perplexity-User", "ClaudeBot", "Claude-SearchBot", "Googlebot", "Bingbot"]) {
  check(robots.includes(`User-agent: ${agent}\nAllow: /`), `robots.txt must allow ${agent}`);
}
check(!/^User-agent:\s*GPTBot\s*$/im.test(robots), "robots.txt must not grant GPTBot access without an explicit decision");
check(robots.includes(`Sitemap: ${origin}/sitemap.xml`), "robots.txt must use the canonical sitemap URL");

for (const file of ["sitemap.xml", "llms.txt", "feed.xml"]) {
  const content = await readFile(`${root}/${file}`, "utf8");
  check(content.includes(origin), `${file} must use an absolute production URL`);
}

for (const page of pages) {
  const html = await readFile(`${root}/${page}`, "utf8");
  check((html.match(/<h1\b/gi) || []).length === 1, `${page} must contain exactly one H1`);
  check(/<meta\s+name="robots"\s+content="index,?\s*follow/i.test(html), `${page} must be indexable`);
  check(html.includes(`<link rel="canonical" href="${origin}`), `${page} must have an absolute canonical URL`);
  check(/type="application\/(?:rss|atom)\+xml"/.test(html), `${page} must reference the public feed`);
  check(html.includes("ai-referral-analytics.js"), `${page} must include the AI referral signal`);
}

const thinking = await readFile(`${root}/thinking/index.html`, "utf8");
const sitemap = await readFile(`${root}/sitemap.xml`, "utf8");
check(/<meta\s+name="robots"\s+content="noindex,follow"/i.test(thinking), "unpublished Thinking archive must remain noindex");
check(!sitemap.includes(`${origin}/thinking/`), "unpublished Thinking archive must not appear in sitemap.xml");

if (failures) process.exit(1);
console.log("Discoverability checks passed.");

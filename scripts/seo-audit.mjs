import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const required = [
  /<meta\s+charset=/i,
  /<meta\s+name=["']viewport["']/i,
  /<meta\s+name=["']theme-color["']/i,
  /<meta\s+name=["']description["']/i,
  /<meta\s+name=["']robots["']/i,
  /<link\s+rel=["']canonical["']\s+href=["']https:\/\/mantoshkumar1\.github\.io\//i,
  /<meta\s+property=["']og:title["']/i,
  /<meta\s+property=["']og:description["']/i,
  /<meta\s+property=["']og:image["']/i,
  /<meta\s+name=["']twitter:card["']\s+content=["']summary_large_image["']/i,
  /<title>[^<]+<\/title>/i,
  /<script\s+type=["']application\/ld\+json["']/i
];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => entry.isDirectory()
    ? entry.name.startsWith(".") || ["chat-worker", "knowledge", "node_modules", "scripts", "templates", "dist"].includes(entry.name) ? [] : walk(join(directory, entry.name))
    : [join(directory, entry.name)]));
  return nested.flat();
}

const files = (await walk(root)).filter((file) => file.endsWith(".html"));
const failures = [];
const origin = "https://mantoshkumar1.github.io";
for (const file of files) {
  const html = await readFile(file, "utf8");
  const path = relative(root, file);
  if (path === "404.html") {
    if (!/<meta\s+name=["']robots["']\s+content=["']noindex,?\s*follow["']/i.test(html)) failures.push(`${path}: missing noindex directive`);
    continue;
  }
  for (const pattern of required) if (!pattern.test(html)) failures.push(`${path}: missing ${pattern}`);
  const redirectTarget = /<meta\s+http-equiv=["']refresh["']\s+content=["'][^"']*url=([^"';]+)["']/i.exec(html)?.[1]?.trim();
  const isNoindexRedirect = Boolean(redirectTarget && /<meta\s+name=["']robots["']\s+content=["']noindex,?\s*follow["']/i.test(html));
  if (isNoindexRedirect) {
    const canonical = /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i.exec(html)?.[1];
    const expectedCanonical = new URL(redirectTarget, origin).href;
    if (canonical !== expectedCanonical) failures.push(`${path}: redirect canonical must match ${expectedCanonical}`);
    if (!new RegExp(`<a\\s+[^>]*href=["']${redirectTarget.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`, "i").test(html)) failures.push(`${path}: redirect needs a visible fallback link to ${redirectTarget}`);
    continue;
  }
  const headings = html.match(/<h1(?:\s[^>]*)?>/gi) || [];
  if (headings.length !== 1) failures.push(`${path}: expected exactly one h1, found ${headings.length}`);
  for (const image of html.matchAll(/<img\b[^>]*>/gi)) if (!/\balt=["'][^"']*["']/i.test(image[0])) failures.push(`${path}: image missing alt text`);
  for (const block of html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(block[1]); } catch { failures.push(`${path}: invalid JSON-LD`); }
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`SEO audit passed for ${files.length} HTML files.`);

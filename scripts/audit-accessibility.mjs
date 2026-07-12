import { readFile, readdir, access } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const failures = [];

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || ["chat-worker", "dist", "knowledge", "node_modules", "scripts", "templates"].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.name.endsWith(".html")) files.push(path);
  }
  return files;
}

for (const file of await walk(root)) {
  const html = await readFile(file, "utf8");
  const label = relative(root, file);
  if (!/<html[^>]+lang=["']en["']/i.test(html)) failures.push(`${label}: missing English document language`);
  if (!/<a[^>]+class=["'][^"']*skip-link/i.test(html)) failures.push(`${label}: missing skip link`);
  if ((html.match(/<main\b/gi) || []).length !== 1) failures.push(`${label}: requires one main landmark`);
  if (!/<main\b[^>]*tabindex=["']-1["']/i.test(html)) failures.push(`${label}: main landmark must accept skip-link focus`);
  if ((html.match(/<h1\b/gi) || []).length !== 1) failures.push(`${label}: requires one h1`);
  if (!/<nav[^>]+aria-label=/i.test(html)) failures.push(`${label}: navigation needs an accessible name`);
  for (const match of html.matchAll(/<img\b[^>]*>/gi)) if (!/\balt=["'][^"']*["']/i.test(match[0])) failures.push(`${label}: image missing alt`);
  for (const match of html.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/gi)) if (!/\brel=["'][^"']*noreferrer/i.test(match[0])) failures.push(`${label}: new-tab link missing noreferrer`);
  for (const match of html.matchAll(/<button\b[^>]*>/gi)) if (!/\btype=["'](?:button|submit)["']/i.test(match[0])) failures.push(`${label}: button missing explicit type`);
  if (/<(?:audio|video)\b/i.test(html) && !/<track\b/i.test(html)) failures.push(`${label}: time-based media missing a track`);
}

try { await access(join(root, "accessibility", "index.html")); } catch { failures.push("missing accessibility statement"); }
const css = await readFile(join(root, "assets/css/style.css"), "utf8");
for (const feature of ["prefers-reduced-motion", "prefers-contrast: more", "prefers-reduced-transparency: reduce", "forced-colors: active", ":focus-visible"]) {
  if (!css.includes(feature)) failures.push(`stylesheet missing ${feature}`);
}
const widget = await readFile(join(root, "assets/js/ask-mantosh-widget.js"), "utf8");
const client = await readFile(join(root, "assets/js/main.js"), "utf8");
if (!/role=["']dialog["']/.test(widget) || !/aria-modal=["']true["']/.test(widget)) failures.push("Ask Mantosh missing modal dialog semantics");
if (!client.includes('setAttribute("aria-busy"') || !client.includes('setAttribute("aria-live"')) failures.push("Ask Mantosh missing quiet streaming announcements");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Accessibility audit passed for public pages, preference modes, and Ask Mantosh semantics.");

import { access, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const pages = ["index.html", "systems/index.html", "thinking/index.html", "experience/index.html", "resume/index.html", "contact/index.html", "projects/photosahi.html", "projects/workflow-automation-toolkit.html"];
const requirements = [
  [/<meta\s+charset=/i, "charset"], [/<meta\s+name=["']viewport["']/i, "viewport"], [/<meta\s+name=["']description["']/i, "description"],
  [/<link\s+rel=["']canonical["']/i, "canonical"], [/<meta\s+name=["']robots["']/i, "robots"], [/<meta\s+property=["']og:title["']/i, "Open Graph"],
  [/<meta\s+name=["']twitter:card["']/i, "Twitter Card"], [/<script\s+type=["']application\/ld\+json["']/i, "JSON-LD"], [/<main\b/i, "main landmark"]
];
let failures = 0;
for (const page of pages) {
  const html = await readFile(join(root, page), "utf8");
  for (const [pattern, name] of requirements) if (!pattern.test(html)) { console.error(`${page}: missing ${name}`); failures += 1; }
  if ((html.match(/<h1\b/gi) || []).length !== 1) { console.error(`${page}: requires exactly one h1`); failures += 1; }
}
for (const asset of ["favicon.svg", "favicon.ico", "assets/seo/social-default.png", "apple-touch-icon.png", "assets/icons/icon-192.png", "assets/icons/icon-512.png", "site.webmanifest", "sitemap.xml"]) {
  try { await access(join(root, asset)); } catch { console.error(`missing required asset: ${asset}`); failures += 1; }
}
if (failures) process.exit(1);
console.log(`SEO audit passed for ${pages.length} indexable pages.`);

import { access, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const pages = ["index.html", "systems/index.html", "thinking/index.html", "thinking/engineering-philosophy.html", "thinking/why-does-this-still-require-me.html", "thinking/release-reports-as-operational-history.html", "thinking/complexity-changes-address.html", "thinking/blockchain-without-a-master-branch.html", "thinking/ownership-before-escalation.html", "experience/index.html", "resume/index.html", "contact/index.html", "newsletter/index.html", "accessibility/index.html", "projects/photosahi.html", "projects/workflow-automation-toolkit.html", "projects/gtt-price-calculator.html"];
const requirements = [
  [/<meta\s+charset=/i, "charset"], [/<meta\s+name=["']viewport["']/i, "viewport"], [/<meta\s+name=["']description["']/i, "description"],
  [/<link\s+rel=["']canonical["']/i, "canonical"], [/<meta\s+name=["']robots["']/i, "robots"], [/<meta\s+property=["']og:title["']/i, "Open Graph"],
  [/<meta\s+name=["']twitter:card["']/i, "Twitter Card"], [/<script\s+type=["']application\/ld\+json["']/i, "JSON-LD"], [/<main\b/i, "main landmark"]
];
let failures = 0;
const stylesheetVersions = new Map();
for (const page of pages) {
  const html = await readFile(join(root, page), "utf8");
  for (const [pattern, name] of requirements) if (!pattern.test(html)) { console.error(`${page}: missing ${name}`); failures += 1; }
  if ((html.match(/<h1\b/gi) || []).length !== 1) { console.error(`${page}: requires exactly one h1`); failures += 1; }
  if (!/class=["'][^"']*logo[^"']*["'][^>]+aria-label=["']Mantosh Kumar — Home["']/i.test(html)) { console.error(`${page}: logo must provide an explicit home affordance`); failures += 1; }
  if (!/ask-mantosh-widget\.js/i.test(html)) { console.error(`${page}: missing shared Ask Mantosh launcher`); failures += 1; }
  if (/(?:All|Browse all|Inspect public) systems/i.test(html)) { console.error(`${page}: contains obsolete visitor-facing systems label`); failures += 1; }
  const version = /style\.css\?v=([\w-]+)/i.exec(html)?.[1];
  if (!version) { console.error(`${page}: missing versioned stylesheet`); failures += 1; }
  else stylesheetVersions.set(page, version);
}
const notFoundHtml = await readFile(join(root, "404.html"), "utf8");
const notFoundVersion = /style\.css\?v=([\w-]+)/i.exec(notFoundHtml)?.[1];
if (!notFoundVersion) { console.error("404.html: missing versioned stylesheet"); failures += 1; }
else stylesheetVersions.set("404.html", notFoundVersion);
if (new Set(stylesheetVersions.values()).size !== 1) {
  console.error(`stylesheet cache versions differ: ${[...stylesheetVersions].map(([page, version]) => `${page}=${version}`).join(", ")}`);
  failures += 1;
}
for (const asset of ["favicon.svg", "favicon.ico", "assets/seo/social-default.png", "apple-touch-icon.png", "assets/icons/icon-192.png", "assets/icons/icon-512.png", "site.webmanifest", "sitemap.xml"]) {
  try { await access(join(root, asset)); } catch { console.error(`missing required asset: ${asset}`); failures += 1; }
}
const newsletterHtml = await readFile(join(root, "newsletter/index.html"), "utf8");
if (!/data-buttondown-status=["']review["']/i.test(newsletterHtml)) { console.error("newsletter: missing Buttondown review status"); failures += 1; }
if (/action=["']https:\/\/buttondown\.com\/api\/emails\/embed-subscribe\/mantoshkumar["']/i.test(newsletterHtml)) { console.error("newsletter: must not collect subscribers while Buttondown is under review"); failures += 1; }
const stylesheet = await readFile(join(root, "assets/css/style.css"), "utf8");
if (/contain-intrinsic-size:\s*auto\s+720px/i.test(stylesheet) || /\.section\s*\{[^}]*content-visibility:\s*auto/is.test(stylesheet)) {
  console.error("stylesheet: homepage sections must not reserve synthetic off-screen height");
  failures += 1;
}
const homeHtml = await readFile(join(root, "index.html"), "utf8");
if (!/Aricent → Cisco → Intel → Siemens → KI Labs → Infinera → Nokia/.test(homeHtml)) { console.error("homepage: career chronology is missing or out of order"); failures += 1; }
if (!/Joined Infinera in Canada; the role continues at Nokia after its 2025 acquisition of Infinera\./.test(homeHtml)) { console.error("homepage: Infinera-to-Nokia employment continuity needs an explicit explanation"); failures += 1; }
for (const region of ["india", "germany", "canada"]) {
  if (!new RegExp(`href=["']experience/#${region}["']`, "i").test(homeHtml)) { console.error(`homepage: ${region} experience card must link to its regional detail`); failures += 1; }
}
if (/class=["'][^"']*section-link[^"']*["'][^>]*>\s*View Experience/i.test(homeHtml)) { console.error("homepage: redundant View Experience link must stay removed"); failures += 1; }
const experienceHtml = await readFile(join(root, "experience/index.html"), "utf8");
if (!/href=["']https:\/\/www\.linkedin\.com\/in\/mantoshk\/details\/recommendations\/["'][^>]*>Read the recommendations on LinkedIn/i.test(experienceHtml)) { console.error("experience: recommendation link must open the dedicated LinkedIn recommendations page"); failures += 1; }
for (const region of ["india", "germany", "canada"]) {
  if (!new RegExp(`id=["']${region}["']`, "i").test(experienceHtml)) { console.error(`experience: missing ${region} regional anchor`); failures += 1; }
}
for (const page of ["index.html", "thinking/index.html"]) {
  const html = await readFile(join(root, page), "utf8");
  for (const card of html.matchAll(/<article\b[^>]*class=["'][^"']*insight-card[^"']*["'][^>]*>([\s\S]*?)<\/article>/gi)) {
    const links = card[1].match(/<a\b[^>]*href=/gi) || [];
    if (links.length !== 1) { console.error(`${page}: every full-card insight must have exactly one destination`); failures += 1; }
  }
}
for (const page of pages.filter((entry) => entry.startsWith("thinking/") && entry !== "thinking/index.html")) {
  const html = await readFile(join(root, page), "utf8");
  if (!/class=["'][^"']*page-shell[^"']*reading-shell[^"']*["']/i.test(html)) { console.error(`${page}: article needs compact reading-shell spacing`); failures += 1; }
  if (!/class=["'][^"']*case-study[^"']*reading-page[^"']*["']/i.test(html)) { console.error(`${page}: article needs compact reading-page spacing`); failures += 1; }
}
if (failures) process.exit(1);
console.log(`SEO audit passed for ${pages.length} indexable pages.`);

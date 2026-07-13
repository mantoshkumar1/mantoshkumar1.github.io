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
  const primaryNavigation = /<nav\b[^>]*aria-label=["']Primary navigation["'][^>]*>([\s\S]*?)<\/nav>/i.exec(html)?.[1] || "";
  if (!/<a\b[^>]*href=["'](?:\/|\.\/|\.\.\/)["'][^>]*>\s*Home\s*<\/a>/i.test(primaryNavigation)) failures.push(`${label}: primary navigation must include an explicit Home link`);
  if (!["404.html", "accessibility/index.html"].includes(label)) {
    if (!/aria-current=["']page["']/i.test(primaryNavigation)) failures.push(`${label}: primary navigation must identify the current section`);
  }
  for (const match of html.matchAll(/<img\b[^>]*>/gi)) if (!/\balt=["'][^"']*["']/i.test(match[0])) failures.push(`${label}: image missing alt`);
  for (const match of html.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/gi)) if (!/\brel=["'][^"']*noreferrer/i.test(match[0])) failures.push(`${label}: new-tab link missing noreferrer`);
  for (const match of html.matchAll(/<form\b[^>]*target=["']_blank["'][^>]*>/gi)) if (!/\brel=["'][^"']*noopener/i.test(match[0])) failures.push(`${label}: new-tab form missing noopener`);
  for (const match of html.matchAll(/<button\b[^>]*>/gi)) if (!/\btype=["'](?:button|submit)["']/i.test(match[0])) failures.push(`${label}: button missing explicit type`);
  if (/<(?:audio|video)\b/i.test(html) && !/<track\b/i.test(html)) failures.push(`${label}: time-based media missing a track`);
}

try { await access(join(root, "accessibility", "index.html")); } catch { failures.push("missing accessibility statement"); }
const accessibilityPage = await readFile(join(root, "accessibility", "index.html"), "utf8");
if (!/id=["']copy-email["']/.test(accessibilityPage) || !/aria-live=["']polite["']/.test(accessibilityPage)) failures.push("accessibility statement needs a copy-email fallback with an announced status");
if (/résumé PDF is not currently tagged/i.test(accessibilityPage)) failures.push("accessibility statement contains implementation detail instead of visitor guidance");
const contactPage = await readFile(join(root, "contact", "index.html"), "utf8");
if (/href=["']\.\.\/accessibility\//i.test(contactPage)) failures.push("contact page must not duplicate the global accessibility link");
const homePage = await readFile(join(root, "index.html"), "utf8");
if (!/<footer[\s\S]*href=["']accessibility\//i.test(homePage)) failures.push("homepage footer must expose the accessibility statement");
const css = await readFile(join(root, "assets/css/style.css"), "utf8");
for (const feature of ["prefers-color-scheme: light", "prefers-reduced-motion", "prefers-contrast: more", "prefers-reduced-transparency: reduce", "forced-colors: active", ":focus-visible"]) {
  if (!css.includes(feature)) failures.push(`stylesheet missing ${feature}`);
}
const widget = await readFile(join(root, "assets/js/ask-mantosh-widget.js"), "utf8");
const client = await readFile(join(root, "assets/js/main.js"), "utf8");
if (!/role=["']dialog["']/.test(widget) || !/aria-modal=["']true["']/.test(widget)) failures.push("Ask Mantosh missing modal dialog semantics");
if (!client.includes('setAttribute("aria-busy"') || !client.includes('setAttribute("aria-live"')) failures.push("Ask Mantosh missing quiet streaming announcements");
if (!client.includes("renderBasic(markdown, target)") || !client.includes("this.renderBasic(markdown, target);")) failures.push("Ask Mantosh missing immediate safe Markdown fallback");
if (!client.includes('stripResponseSections(text) { return text.replace(/\\n*##\\s+(?:Sources|Follow-up Questions)')) failures.push("Ask Mantosh must remove source and follow-up payloads from the reading pane");
if (!client.includes("Suggestions belong only to the empty welcome state") || !client.includes("this.view.setSuggestions([], (question) => this.ask(question));")) failures.push("Ask Mantosh must clear suggestion chips after every answer");
if (/setSuggestions\(message\.followUps/.test(client)) failures.push("Ask Mantosh must not repopulate follow-up chips over the reading area");
for (const historyFeature of ["ask-mantosh-conversation-v1", "window.sessionStorage.getItem", "window.sessionStorage.setItem", "conversationId", 'contentType.includes("application/json")']) {
  if (!client.includes(historyFeature)) failures.push(`Ask Mantosh recovery flow missing ${historyFeature}`);
}
if (!/ask-mantosh-related-card[^`]*target=\\"_blank\\"|target=\\"_blank\\"[^`]*ask-mantosh-related-card/.test(client)) failures.push("Ask Mantosh related links must preserve the current conversation tab");
if (!/message\.action\?\.type === "navigate"/.test(client)) failures.push("Ask Mantosh must render direct navigation responses without crashing");
for (const themeFeature of ["mantosh-appearance", "appearance-select", "prefers-color-scheme: light", "localStorage.setItem", 'value="soft"', 'value="contrast"']) {
  if (!widget.includes(themeFeature)) failures.push(`appearance control missing ${themeFeature}`);
}
for (const themeSelector of ['html[data-theme="soft"]', 'html[data-theme="contrast"]']) {
  if (!css.includes(themeSelector)) failures.push(`stylesheet missing ${themeSelector}`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Accessibility audit passed for public pages, preference modes, and Ask Mantosh semantics.");

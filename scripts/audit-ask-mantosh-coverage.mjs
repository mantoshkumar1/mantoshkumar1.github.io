import { readFile, readdir } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "..");
const coverage = JSON.parse(await readFile(join(root, "knowledge/site-coverage.json"), "utf8"));
const router = await readFile(join(root, "chat-worker/src/intelligence/search-router.js"), "utf8");
const failures = [];

async function filesIn(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if ([".git", "dist", "node_modules", "templates"].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesIn(path));
    else files.push(path);
  }
  return files;
}

function routeFor(file) {
  const path = relative(root, file).split(sep).join("/");
  if (path === "index.html") return "/";
  if (path.endsWith("/index.html")) return `/${path.slice(0, -"index.html".length)}`;
  return `/${path}`;
}

function frontMatterUrl(markdown) {
  return /^url:\s*["']?([^\n"']+)["']?\s*$/m.exec(markdown)?.[1]?.trim() || "";
}

const htmlFiles = (await filesIn(root)).filter((file) => file.endsWith(".html"));
const siteRoutes = new Map(htmlFiles.map((file) => [routeFor(file), file]));
const knowledgeRoutes = new Map();
const knowledgeRoot = join(root, "knowledge");
for (const file of (await filesIn(knowledgeRoot)).filter((path) => path.endsWith(".md") && !path.split(sep).at(-1).startsWith("_"))) {
  const markdown = await readFile(file, "utf8");
  if (!/^visibility:\s*["']?public["']?\s*$/m.test(markdown)) continue;
  const url = frontMatterUrl(markdown);
  const route = url.split("#", 1)[0];
  if (!route) failures.push(`${relative(root, file)}: public source is missing url`);
  else if (!siteRoutes.has(route)) failures.push(`${relative(root, file)}: source route ${route} has no public page`);
  else {
    const sources = knowledgeRoutes.get(route) || [];
    sources.push(relative(root, file));
    knowledgeRoutes.set(route, sources);
  }
}

const navigationRoutes = new Map(coverage.navigation.map((entry) => [entry.route, entry]));
const nonEvidenceRoutes = new Map(coverage.nonEvidence.map((entry) => [entry.route, entry]));

for (const [route, file] of siteRoutes) {
  const categories = [knowledgeRoutes.has(route), navigationRoutes.has(route), nonEvidenceRoutes.has(route)].filter(Boolean).length;
  if (!categories) failures.push(`${relative(root, file)}: not covered by retrieval, deterministic navigation, or an explicit non-evidence exclusion`);
  if (categories > 1 && !knowledgeRoutes.has(route)) failures.push(`${relative(root, file)}: route has conflicting coverage classifications`);
}

for (const entry of coverage.navigation) {
  if (!siteRoutes.has(entry.route)) failures.push(`coverage manifest: navigation route ${entry.route} has no public page`);
  const signature = `url: "${entry.route}", type: "${entry.type}"`;
  if (!router.includes(signature)) failures.push(`search router: missing deterministic ${entry.type} destination for ${entry.route}`);
}

for (const entry of coverage.nonEvidence) {
  const file = siteRoutes.get(entry.route);
  if (!file) failures.push(`coverage manifest: non-evidence route ${entry.route} has no public page`);
  else {
    const html = await readFile(file, "utf8");
    if (!/<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(html)) failures.push(`${relative(root, file)}: non-evidence page must remain noindex`);
  }
  if (!entry.reason?.trim()) failures.push(`coverage manifest: ${entry.route} needs an explicit reason`);
}

if (failures.length) {
  failures.forEach((failure) => console.error(failure));
  process.exit(1);
}

console.log(`Ask Mantosh coverage audit passed: ${knowledgeRoutes.size} evidence routes, ${navigationRoutes.size} utility routes, and ${nonEvidenceRoutes.size} explicit non-evidence routes cover ${siteRoutes.size} public HTML routes.`);

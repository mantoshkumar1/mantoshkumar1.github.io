import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { loadEntries, selectHomepageProjects, PROJECTS_START, PROJECTS_END } from "./generate-seo.mjs";

// Regression guard for the homepage's "Selected Projects" section. Unlike
// the Insights teaser, this is NOT a recency feed — seo.config.json's
// `homepageOrder` field is a purely editorial selection (see
// selectHomepageProjects in generate-seo.mjs and docs/PUBLISHING_INSIGHTS.md
// for the Insights-vs-Projects contrast). This script never re-implements
// that selection; it reuses the same exported function so this check cannot
// drift from what generate-seo.mjs actually produces, and so an ambiguous or
// duplicated selection (caught inside selectHomepageProjects itself) fails
// this audit too. Its remaining job is to confirm the built index.html
// genuinely reflects that selection: exactly the 3 configured projects, in
// the configured order, with no unselected project leaking in, and no
// generated card missing its metadata.

const root = resolve(process.env.SITE_ROOT || join(import.meta.dirname, ".."));
let failures = 0;

function check(condition, message) {
  if (!condition) { failures += 1; console.error(`FAIL: ${message}`); }
}

let entries;
let selected;
try {
  ({ entries } = await loadEntries(root, join(root, "seo.config.json")));
  selected = selectHomepageProjects(entries);
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exit(1);
}

check(selected.length === 3, `Selected Projects must resolve to exactly 3 entries, found ${selected.length}`);

const indexHtml = await readFile(join(root, "index.html"), "utf8");
check(indexHtml.includes(PROJECTS_START) && indexHtml.includes(PROJECTS_END), "index.html must contain the projects:generated markers");

const blockMatch = indexHtml.match(new RegExp(`${PROJECTS_START}([\\s\\S]*?)${PROJECTS_END}`));
check(Boolean(blockMatch), "index.html projects:generated block must be present and well-formed");
const block = blockMatch?.[1] || "";

const renderedCards = [...block.matchAll(/<article\b[^>]*class=["'][^"']*project-card[^"']*["'][^>]*>([\s\S]*?)<\/article>/gi)].map((m) => m[1]);
check(renderedCards.length === 3, `homepage must render exactly 3 generated Selected Project cards, found ${renderedCards.length}`);

selected.forEach(({ page, route }, index) => {
  const rendered = renderedCards[index];
  if (!rendered) { failures += 1; console.error(`FAIL: missing rendered card at position ${index + 1} for ${route}`); return; }
  const card = page.card;
  check(rendered.includes(`>${card.kicker}<`), `card ${index + 1} (${route}) kicker must read "${card.kicker}"`);
  check(rendered.includes(`>${card.title}<`), `card ${index + 1} (${route}) title must read "${card.title}"`);
  check(rendered.includes(card.description), `card ${index + 1} (${route}) description must match seo.config.json card metadata`);
  check(rendered.includes(card.impact), `card ${index + 1} (${route}) impact statement must match seo.config.json card metadata`);
  for (const tag of card.tech) check(rendered.includes(`>${tag}<`), `card ${index + 1} (${route}) must show the "${tag}" technology tag`);
  for (const link of card.links) check(rendered.includes(`href="${link.href}"`), `card ${index + 1} (${route}) must link to ${link.href}`);
  const detailLinks = card.links.filter((link) => link.detail);
  check(detailLinks.length === 1, `card ${index + 1} (${route}) must define exactly one detail link in seo.config.json, found ${detailLinks.length}`);
});

// No unselected project may leak into the generated block.
const selectedRoutes = new Set(selected.map(({ route }) => route));
const unselectedProjects = entries.filter(({ page, route }) => page.kind === "project" && !selectedRoutes.has(route));
for (const { route } of unselectedProjects) {
  const relativeHref = route.replace(/^\//, "");
  check(!block.includes(`href="${relativeHref}"`), `unselected project ${route} must not appear in the homepage Selected Projects block`);
}

if (failures) process.exit(1);
console.log(`Homepage Selected Projects matches the configured editorial selection (${selected.map(({ route }) => route).join(", ")}).`);

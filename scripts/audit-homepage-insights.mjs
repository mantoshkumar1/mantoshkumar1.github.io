import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { loadEntries, selectHomepageInsights, formatCardDate, INSIGHTS_START, INSIGHTS_END } from "./generate-seo.mjs";

// Regression guard for the homepage Insights teaser. seo.config.json is the
// single source of truth for which 3 insight articles the homepage shows and
// in what order (see selectHomepageInsights in generate-seo.mjs and
// docs/PUBLISHING_INSIGHTS.md). This script never re-implements that
// selection — it reuses the same exported function so this check cannot
// silently drift from what generate-seo.mjs actually produces. Its job is to
// confirm the built index.html genuinely reflects that selection: that
// scripts/generate-seo.mjs was run after the last edit, that no one
// hand-edited the generated block, and that the block's structure hasn't
// regressed (exactly 3 cards, correct order, correct destinations).

const root = resolve(process.env.SITE_ROOT || join(import.meta.dirname, ".."));
let failures = 0;

function check(condition, message) {
  if (!condition) { failures += 1; console.error(`FAIL: ${message}`); }
}

const { entries } = await loadEntries(root, join(root, "seo.config.json"));
const expectedTop3 = selectHomepageInsights(entries);

const indexHtml = await readFile(join(root, "index.html"), "utf8");
check(indexHtml.includes(INSIGHTS_START) && indexHtml.includes(INSIGHTS_END), "index.html must contain the insights:generated markers");

const blockMatch = indexHtml.match(new RegExp(`${INSIGHTS_START}([\\s\\S]*?)${INSIGHTS_END}`));
check(Boolean(blockMatch), "index.html insights:generated block must be present and well-formed");
const block = blockMatch?.[1] || "";

const renderedCards = [...block.matchAll(/<article\b[^>]*class=["'][^"']*insight-card[^"']*["'][^>]*>([\s\S]*?)<\/article>/gi)].map((m) => m[1]);
check(renderedCards.length === 3, `homepage must render exactly 3 generated insight cards, found ${renderedCards.length}`);

expectedTop3.forEach(({ page, route }, index) => {
  const rendered = renderedCards[index];
  if (!rendered) { failures += 1; console.error(`FAIL: missing rendered card at position ${index + 1} for ${route}`); return; }
  const href = route.replace(/^\//, "");
  const dateLabel = formatCardDate(page.datePublished);
  check(rendered.includes(`href="${href}"`), `card ${index + 1} must link to ${href}`);
  check(rendered.includes(`>${page.card.title}<`), `card ${index + 1} title must read "${page.card.title}"`);
  check(rendered.includes(page.card.summary), `card ${index + 1} summary must match seo.config.json card metadata for ${route}`);
  check(rendered.includes(`>${page.card.cta} `), `card ${index + 1} CTA must read "${page.card.cta}"`);
  check(rendered.includes(`datetime="${page.datePublished}"`) && rendered.includes(`>${dateLabel}<`), `card ${index + 1} date must render as ${dateLabel}`);
});

// Defensive structural check independent of the source-of-truth comparison
// above: whatever is actually rendered must be in non-increasing date order.
const renderedDates = [...block.matchAll(/<time\s+datetime="(\d{4}-\d{2}-\d{2})"/g)].map((m) => m[1]);
check(renderedDates.length === 3, "homepage cards must each carry a dated <time> element");
for (let i = 1; i < renderedDates.length; i += 1) {
  check(renderedDates[i - 1] >= renderedDates[i], "homepage cards must be in newest-first order");
}

if (failures) process.exit(1);
console.log(`Homepage Insights teaser matches the deterministic latest-3 selection (${expectedTop3.map(({ route }) => route).join(", ")}).`);

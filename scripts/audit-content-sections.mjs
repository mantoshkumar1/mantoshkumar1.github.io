import { readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const inventory = JSON.parse(await readFile(join(import.meta.dirname, "content-sections.json"), "utf8"));
const failures = [];

function frontMatter(markdown) {
  const block = /^---\s*\n([\s\S]*?)\n---/.exec(markdown)?.[1] || "";
  const value = (key) => new RegExp(`^${key}:\\s*["']?([^\\n"']+)["']?\\s*$`, "m").exec(block)?.[1]?.trim() || "";
  const list = (key) => {
    const raw = new RegExp(`^${key}:\\s*\\[([^\\]]*)\\]\\s*$`, "m").exec(block)?.[1] || "";
    return raw.split(",").map((item) => item.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean);
  };
  return { category: value("category"), visibility: value("visibility"), tags: list("tags") };
}

const documents = [];
for (const directory of ["projects", "articles", "notes", "experience", "resume", "faq"]) {
  const path = join(root, "knowledge", directory);
  let entries = [];
  try { entries = await readdir(path); } catch { continue; }
  for (const entry of entries.filter((name) => name.endsWith(".md") && !name.startsWith("_"))) {
    const metadata = frontMatter(await readFile(join(path, entry), "utf8"));
    if (metadata.visibility === "public") documents.push(metadata);
  }
}

for (const section of inventory.sections) {
  const count = documents.filter((document) => {
    const categoryMatch = !section.categories || section.categories.includes(document.category);
    const tagMatch = !section.tagsAny || section.tagsAny.some((tag) => document.tags.includes(tag));
    return categoryMatch && tagMatch;
  }).length;
  const html = await readFile(join(root, section.page), "utf8");
  const marker = new RegExp(`<[^>]+data-content-section=["']${section.id}["'][^>]*>`, "i").exec(html)?.[0] || "";
  if (!marker) failures.push(`${section.page}: missing content-section marker ${section.id}`);
  else {
    const recorded = Number(/data-content-count=["'](\d+)["']/i.exec(marker)?.[1]);
    if (recorded !== count) failures.push(`${section.page}: ${section.id} records ${recorded}, but ${count} public documents match`);
    const hasEmptyState = /data-empty-state=["']true["']/i.test(marker);
    if (count === 0 && !hasEmptyState) failures.push(`${section.page}: ${section.id} is empty but has no explicit empty state`);
    if (count > 0 && hasEmptyState) failures.push(`${section.page}: ${section.id} has content but is still marked empty`);
  }
}

if (failures.length) {
  failures.forEach((failure) => console.error(failure));
  process.exit(1);
}
console.log(`Content-section audit passed for ${inventory.sections.length} autonomous publication lanes.`);

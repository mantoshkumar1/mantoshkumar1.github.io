import { readFile, readdir } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const knowledgeRoot = join(root, "knowledge");

// Match the currently deployed indexer's PROFILE_FACT_KEYS contract. Update
// only after a separately authorized Worker deployment has accepted new keys.
const deployedFactKeys = new Set([
  "location", "time_zone", "citizenship", "work_authorization",
  "current_employer", "current_role", "employment_history",
  "experience_years", "target_roles", "capabilities", "skills",
  "ownership_summary", "ownership_highlights", "ownership_team_context",
  "outside_nokia_intro", "outside_nokia_highlights"
]);
const factSources = new Set([
  "knowledge/faq/about-mantosh.md",
  "knowledge/experience/outside-nokia-experience.md"
]);
const indexedDirectories = new Set(["projects", "articles", "notes", "experience", "resume", "faq"]);

function frontmatterValue(raw) {
  const trimmed = raw.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed.slice(1, -1).split(",").map((item) => item.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean);
  }
  return trimmed.replace(/^['"]|['"]$/g, "");
}

export function validateKnowledgeFacts(path, markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) throw new Error(`${path}: YAML front matter is required`);
  let count = 0;
  for (const line of match[1].split(/\r?\n/)) {
    const key = line.slice(0, line.indexOf(":")).trim();
    if (!key.startsWith("fact_")) continue;
    count += 1;
    const factKey = key.slice(5);
    if (!factSources.has(path)) throw new Error(`${path}: structured facts are not allowed from this source`);
    if (!deployedFactKeys.has(factKey)) throw new Error(`${path}: ${key} is not accepted by the deployed indexer`);
    const parsed = frontmatterValue(line.slice(line.indexOf(":") + 1));
    const values = Array.isArray(parsed) ? parsed : [parsed];
    if (!values.length || values.length > 24 || values.some((value) => !value || value.length > 200)) {
      throw new Error(`${path}: ${key} has an invalid value for the deployed indexer`);
    }
  }
  return count;
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(async (entry) =>
    entry.isDirectory() ? walk(join(directory, entry.name)) : [join(directory, entry.name)]
  ))).flat();
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let facts = 0;
  for (const file of await walk(knowledgeRoot)) {
    const path = relative(root, file).replaceAll("\\", "/");
    const parts = path.split("/");
    if (!indexedDirectories.has(parts[1]) || !parts.at(-1).endsWith(".md") || parts.at(-1).startsWith("_")) continue;
    facts += validateKnowledgeFacts(path, await readFile(file, "utf8"));
  }
  console.log(`Knowledge sync contract passed: ${facts} structured facts use deployed indexer keys.`);
}

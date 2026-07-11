import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = resolve(fileURLToPath(new URL(".", import.meta.url)));
const repositoryRoot = resolve(scriptDirectory, "../..");
const knowledgeRoot = join(repositoryRoot, "knowledge");
const categories = new Set(["project", "article", "note", "experience", "resume", "faq"]);
const indexerUrl = process.env.INDEXER_URL?.replace(/\/$/, "");
const indexerToken = process.env.INDEXER_TOKEN;

if (!indexerUrl || !indexerToken) throw new Error("INDEXER_URL and INDEXER_TOKEN must be set.");

function sha256(value) { return createHash("sha256").update(value).digest("hex"); }

function value(raw) {
  const trimmed = raw.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed.slice(1, -1).split(",").map((item) => item.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean);
  }
  return trimmed.replace(/^['"]|['"]$/g, "");
}

function parseMarkdown(filePath, raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error(`${filePath}: YAML front matter is required.`);
  const metadata = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const separator = line.indexOf(":");
    if (separator < 1) throw new Error(`${filePath}: invalid front matter line: ${line}`);
    metadata[line.slice(0, separator).trim()] = value(line.slice(separator + 1));
  }
  const required = ["title", "slug", "category", "tags", "summary", "last_updated", "related_topics", "visibility", "url"];
  for (const key of required) if (metadata[key] === undefined || metadata[key] === "") throw new Error(`${filePath}: missing ${key}.`);
  if (!Array.isArray(metadata.tags) || !Array.isArray(metadata.related_topics)) throw new Error(`${filePath}: tags and related_topics must use YAML inline arrays.`);
  if (!["public", "private", "draft"].includes(metadata.visibility)) throw new Error(`${filePath}: visibility must be public, private, or draft.`);
  if (!categories.has(metadata.category)) throw new Error(`${filePath}: category must be one of ${[...categories].join(", ")}.`);
  if (!/^https:\/\/|^\//.test(metadata.url)) throw new Error(`${filePath}: url must be an https URL or an absolute site path.`);
  return { ...metadata, body: match[2] };
}

function toSearchText(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/```\w*\n?|```/g, ""))
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/^[>#*-]+\s*/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

function chunk(text, size = 1_500, overlap = 200) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(text.length, start + size);
    if (end < text.length) {
      const boundary = Math.max(text.lastIndexOf(". ", end), text.lastIndexOf("\n", end), text.lastIndexOf(" ", end));
      if (boundary > start + Math.floor(size / 2)) end = boundary + 1;
    }
    const content = text.slice(start, end).trim();
    if (content) chunks.push(content);
    if (end >= text.length) break;
    start = Math.max(end - overlap, start + 1);
  }
  return chunks;
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = await Promise.all(entries.map(async (entry) => entry.isDirectory() ? walk(join(directory, entry.name)) : [join(directory, entry.name)]));
  return paths.flat();
}

function isKnowledgeDocument(file) {
  const path = relative(knowledgeRoot, file).replaceAll("\\", "/");
  const parts = path.split("/");
  const directory = parts[0];
  const filename = parts.at(-1);
  return ["projects", "articles", "notes", "experience", "resume", "faq"].includes(directory) && filename?.endsWith(".md") && !filename.startsWith("_");
}

async function post(payload) {
  const response = await fetch(`${indexerUrl}/internal/index`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${indexerToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(`Indexing failed (${response.status}): ${await response.text()}`);
}

async function upsert(filePath) {
  const raw = await readFile(filePath, "utf8");
  const parsed = parseMarkdown(filePath, raw);
  const path = relative(repositoryRoot, filePath).replaceAll("\\", "/");
  const text = toSearchText(parsed.body);
  if (!text) throw new Error(`${filePath}: document body is empty.`);
  const chunks = chunk(`${parsed.title}\n${parsed.summary}\n\n${text}`).map((content, index) => ({ id: sha256(`${path}:${index}`), content }));
  await post({ action: "upsert", document: {
    path, checksum: sha256(raw), title: parsed.title, slug: parsed.slug, category: parsed.category,
    tags: parsed.tags, summary: parsed.summary, last_updated: parsed.last_updated, url: parsed.url,
    related_topics: parsed.related_topics, visibility: parsed.visibility, chunks
  }});
  console.log(`Indexed ${path} (${chunks.length} chunks)`);
}

function changedFiles(base) {
  const output = execFileSync("git", ["diff", "--name-status", base, "HEAD", "--", "knowledge"], { cwd: repositoryRoot, encoding: "utf8" });
  return output.trim().split("\n").filter(Boolean).map((line) => {
    const [status, ...paths] = line.split("\t");
    return { status, path: paths.at(-1), oldPath: status.startsWith("R") ? paths[0] : undefined };
  }).filter((change) => isKnowledgeDocument(join(repositoryRoot, change.path)) || (change.oldPath && isKnowledgeDocument(join(repositoryRoot, change.oldPath))));
}

const args = process.argv.slice(2);
if (args.includes("--all")) {
  const files = (await walk(knowledgeRoot)).filter(isKnowledgeDocument);
  for (const file of files) await upsert(file);
} else {
  const baseIndex = args.indexOf("--base");
  if (baseIndex < 0 || !args[baseIndex + 1]) throw new Error("Use --all or --base <git-sha>.");
  for (const change of changedFiles(args[baseIndex + 1])) {
    if (change.status.startsWith("D")) {
      await post({ action: "delete", path: change.path });
      console.log(`Deleted ${change.path}`);
    } else {
      if (change.oldPath) {
        await post({ action: "delete", path: change.oldPath });
        console.log(`Deleted ${change.oldPath}`);
      }
      await upsert(join(repositoryRoot, change.path));
    }
  }
}

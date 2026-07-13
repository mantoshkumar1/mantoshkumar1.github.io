import { access, readFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFile(join(root, path), "utf8");
const failures = [];
const requireText = (content, expected, label) => {
  if (!content.includes(expected)) failures.push(`${label}: missing ${expected}`);
};

const [readme, state, docsIndex, linkedInAudit, knowledgeReadme, workerReadme, workerDocsIndex, maintenance, troubleshooting, workerSource, wrangler, widget, deployWorkflow, seoWorkflow] = await Promise.all([
  read("README.md"),
  read("docs/SYSTEM_STATE.md"),
  read("docs/README.md"),
  read("docs/LINKEDIN_CONTENT_AUDIT.md"),
  read("knowledge/README.md"),
  read("chat-worker/README.md"),
  read("chat-worker/docs/README.md"),
  read("chat-worker/docs/MAINTENANCE.md"),
  read("chat-worker/docs/TROUBLESHOOTING.md"),
  read("chat-worker/src/index.js"),
  read("chat-worker/wrangler.toml"),
  read("assets/js/ask-mantosh-widget.js"),
  read(".github/workflows/deploy-pages.yml"),
  read(".github/workflows/technical-seo.yml")
]);

async function markdownFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "dist" || entry.name === "node_modules") continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await markdownFiles(path));
    else if (entry.name.endsWith(".md")) files.push(path);
  }
  return files;
}

const siteOrigin = "https://mantoshkumar1.github.io";
const workerOrigin = "https://ask-mantosh.mantoshk234.workers.dev";
for (const [content, label] of [[readme, "README"], [state, "system state"]]) requireText(content, siteOrigin, label);
for (const [content, label] of [[state, "system state"], [workerReadme, "Worker README"], [widget, "shared Ask Mantosh widget"]]) requireText(content, workerOrigin, label);
requireText(docsIndex, "SYSTEM_STATE.md", "documentation map");
requireText(workerDocsIndex, "../../docs/SYSTEM_STATE.md", "Worker documentation map");

const configuredValues = [
  "@cf/meta/llama-3.1-8b-instruct-fast", "@cf/baai/bge-m3", "personal-website-knowledge",
  "ask-mantosh-knowledge-v3", "MAX_OUTPUT_TOKENS = \"450\"", "FREE_DAILY_REQUEST_LIMIT = \"50\"",
  "FREE_PER_MINUTE_REQUEST_LIMIT = \"5\"", "CONVERSATION_TTL_SECONDS = \"86400\""
];
for (const value of configuredValues) requireText(wrangler, value, "wrangler.toml");
for (const value of ["@cf/meta/llama-3.1-8b-instruct-fast", "@cf/baai/bge-m3", "personal-website-knowledge", "ask-mantosh-knowledge-v3", "450", "50", "five requests per minute", "24-hour session TTL"]) {
  requireText(state, value, "system state");
}

const knowledgeDirectories = ["projects", "articles", "notes", "experience", "resume", "faq"];
let publicDocuments = 0;
for (const directory of knowledgeDirectories) {
  const path = join(root, "knowledge", directory);
  let entries = [];
  try { entries = await readdir(path); } catch { continue; }
  for (const entry of entries.filter((name) => name.endsWith(".md") && !name.startsWith("_"))) {
    const document = await readFile(join(path, entry), "utf8");
    if (/^visibility:\s*["']?public["']?\s*$/m.test(document)) publicDocuments += 1;
  }
}
requireText(state, `${publicDocuments} public Ask Mantosh documents`, "system state");
requireText(knowledgeReadme, `${publicDocuments} source documents`, "knowledge README");
requireText(knowledgeReadme, "FAQ: About Mantosh and Where His Experience Can Help", "knowledge README");

for (const expected of ["15 distinct posts", "PhotoSahi Canada–India launch", "Memorable test cases", "Ledger-first blockchain evolution"]) {
  requireText(linkedInAudit, expected, "LinkedIn content audit");
}

const answerPolicy = workerSource.match(/const ANSWER_POLICY_VERSION = "([^"]+)";/)?.[1];
if (!answerPolicy) failures.push("Worker source: ANSWER_POLICY_VERSION could not be determined");
else requireText(state, answerPolicy, "system state");
requireText(state, "Last verified Worker deployment:", "system state");

const workerTests = await read("chat-worker/test/worker.test.js");
const testCount = (workerTests.match(/\btest\s*\(/g) || []).length;
requireText(state, `${testCount} Worker contract`, "system state");

for (const file of await markdownFiles(root)) {
  const content = await readFile(file, "utf8");
  for (const match of content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const target = match[1].trim().replace(/^<|>$/g, "").split("#", 1)[0];
    if (!target || /^(?:https?:|mailto:)/i.test(target)) continue;
    try { await access(resolve(dirname(file), target)); }
    catch { failures.push(`${file.slice(root.length + 1)}: broken documentation link ${match[1]}`); }
  }
}

for (const [workflow, label] of [[deployWorkflow, "Pages workflow"], [seoWorkflow, "SEO workflow"]]) {
  requireText(workflow, "node scripts/audit-docs.mjs", label);
  requireText(workflow, "node scripts/audit-content-sections.mjs", label);
  requireText(workflow, "node scripts/audit-accessibility.mjs", label);
}
requireText(readme, "node scripts/audit-accessibility.mjs", "README release gates");
requireText(workerReadme, "mandatory Cloudflare Rate Limiting binding", "Worker README");

const stalePatterns = [
  [/YOUR-WORKER\.workers\.dev/g, "placeholder Worker URL"],
  [/Before production, change `ALLOWED_ORIGINS`/g, "pre-production CORS instruction"],
  [/Enable the Cloudflare Rate Limiting binding before public launch/g, "pre-launch limiter instruction"],
  [/A future offline evaluation set/g, "stale future evaluation wording"]
];
const maintainedDocs = [readme, state, workerReadme, await read("chat-worker/docs/ARCHITECTURE.md"), await read("chat-worker/docs/ASK_MANTOSH_SYSTEM_PROMPT.md"), await read("chat-worker/docs/SECURITY.md")].join("\n");
for (const [pattern, label] of stalePatterns) if (pattern.test(maintainedDocs)) failures.push(`documentation contains ${label}`);
if (maintenance.includes("Exercise a staging rollback and run accessibility checks on the chat panel.")) failures.push("maintenance runbook assumes a staging environment that does not exist");
if (troubleshooting.includes("Use the request ID returned in the response header")) failures.push("troubleshooting guide claims an inactive request-ID response header");

if (failures.length) {
  failures.forEach((failure) => console.error(failure));
  process.exit(1);
}
console.log(`Documentation audit passed; ${publicDocuments} public knowledge documents match the recorded production state.`);

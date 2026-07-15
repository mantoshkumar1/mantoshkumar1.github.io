import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import worker from "../src/index.js";
import { SOURCE_FIXTURES } from "./fixtures.mjs";

const directory = dirname(fileURLToPath(import.meta.url));
const casesPath = resolve(directory, "cases.json");
const resultsPath = resolve(directory, "results/latest.json");
const rawDataset = await readFile(casesPath, "utf8");
const dataset = JSON.parse(rawDataset);

function evaluationDatabase(source) {
  const row = source?.row;
  return {
    prepare(sql) {
      return {
        bind: () => ({
          all: async () => {
            if (sql.includes("FROM chunks c")) return { results: row ? [row] : [] };
            if (sql.includes("chunks_fts")) return { results: row ? [{ chunk_id: row.chunk_id }] : [] };
            return { results: [] };
          },
          first: async () => (sql.includes("ai_daily_usage") || sql.includes("ai_request_windows")) ? { request_count: 1 } : null,
          run: async () => ({ success: true })
        })
      };
    },
    batch: async () => []
  };
}

function evaluationEnvironment(source) {
  const calls = { embeddings: 0, generation: 0 };
  const env = {
    ALLOWED_ORIGINS: "https://mantoshkumar1.github.io",
    RATE_LIMITER: { limit: async () => ({ success: true }) },
    KNOWLEDGE_DB: evaluationDatabase(source),
    KNOWLEDGE_INDEX: {
      query: async () => ({ matches: source ? [{ score: 0.92, metadata: { chunk_id: source.row.chunk_id } }] : [] })
    },
    AI: {
      run: async (model) => {
        if (model.includes("bge-m3")) {
          calls.embeddings += 1;
          return { data: [[0.1, 0.2]] };
        }
        calls.generation += 1;
        return { response: source?.answer || "" };
      }
    }
  };
  return { calls, env };
}

function markdownUrls(answer) {
  return [...answer.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+[^)]*)?\)/g)].map((match) => match[1]);
}

function sameValues(actual, expected) {
  return JSON.stringify([...actual].sort()) === JSON.stringify([...expected].sort());
}

async function evaluateCase(entry) {
  const source = entry.sourceKey ? SOURCE_FIXTURES[entry.sourceKey] : null;
  if (entry.sourceKey && !source) throw new Error(`${entry.id}: unknown sourceKey ${entry.sourceKey}`);
  const { calls, env } = evaluationEnvironment(source);
  const response = await worker.fetch(new Request("https://worker.example/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://mantoshkumar1.github.io" },
    body: JSON.stringify({ question: entry.question, conversationId: `evaluation_${entry.id.replaceAll("-", "_")}` })
  }), env);
  const payload = await response.json();
  const failures = [];
  let assertions = 0;
  const check = (name, condition, detail = "") => {
    assertions += 1;
    if (!condition) failures.push(detail ? `${name}: ${detail}` : name);
  };
  const expected = entry.expected;
  const expectedSlugs = entry.sourceKey ? [entry.sourceKey] : [];
  const actualSlugs = Array.isArray(payload.sources) ? payload.sources.map((item) => item.slug) : [];
  const allowedUrls = new Set(source?.row.url ? [source.row.url] : []);
  const urls = markdownUrls(payload.answer || "");

  check("HTTP 200", response.status === 200, `received ${response.status}`);
  check("successful response", payload.success === true);
  check("answer string", typeof payload.answer === "string" && payload.answer.length > 0);
  check("bounded answer", (payload.answer || "").length <= (expected.maxAnswerChars || 900), `${(payload.answer || "").length} characters`);
  check("stable source contract", Array.isArray(payload.sources));
  check("expected sources", sameValues(actualSlugs, expectedSlugs), `expected ${expectedSlugs.join(",") || "none"}; received ${actualSlugs.join(",") || "none"}`);
  check("safe markup", !/<\/?(?:script|style|iframe|object|embed)\b|\bon\w+\s*=|(?:javascript|data):/i.test(payload.answer || ""));
  check("allowed citations", urls.every((url) => allowedUrls.has(url)), `unexpected URLs: ${urls.filter((url) => !allowedUrls.has(url)).join(",")}`);
  check("conversation contract", typeof payload.conversationId === "string" && payload.conversationId.startsWith("evaluation_"));
  for (const text of expected.includes || []) check(`includes ${text}`, (payload.answer || "").toLowerCase().includes(text.toLowerCase()));
  for (const text of expected.excludes || []) check(`excludes ${text}`, !(payload.answer || "").toLowerCase().includes(text.toLowerCase()));

  if (expected.kind === "social") {
    check("no retrieval embedding", calls.embeddings === 0, `received ${calls.embeddings}`);
    check("no generation", calls.generation === 0, `received ${calls.generation}`);
    check("no navigation action", !payload.action);
  } else if (expected.kind === "navigate") {
    check("navigation action", payload.action?.type === "navigate");
    check("navigation destination type", payload.action?.destinationType === expected.actionType, `received ${payload.action?.destinationType}`);
    check("navigation destination URL", payload.action?.url === expected.actionUrl, `received ${payload.action?.url}`);
    check("no retrieval embedding", calls.embeddings === 0, `received ${calls.embeddings}`);
    check("no generation", calls.generation === 0, `received ${calls.generation}`);
  } else if (expected.kind === "refusal") {
    check("one retrieval embedding", calls.embeddings === 1, `received ${calls.embeddings}`);
    check("no unsupported generation", calls.generation === 0, `received ${calls.generation}`);
    check("low confidence", payload.confidence === "low", `received ${payload.confidence}`);
  } else if (expected.kind === "achievement") {
    check("one retrieval embedding", calls.embeddings === 1, `received ${calls.embeddings}`);
    check("deterministic answer", calls.generation === 0, `received ${calls.generation} generation calls`);
    check("one evidence source", actualSlugs.length === 1);
  } else if (expected.kind === "grounded") {
    check("one retrieval embedding", calls.embeddings === 1, `received ${calls.embeddings}`);
    check("one generation", calls.generation === 1, `received ${calls.generation}`);
    check("readable Markdown", /^##\s+/m.test(payload.answer || ""));
    check("canonical citation", urls.includes(source.row.url), `missing ${source.row.url}`);
  } else {
    failures.push(`unknown expected kind: ${expected.kind}`);
  }

  return { id: entry.id, category: entry.category, assertions, failures, passed: failures.length === 0 };
}

const caseResults = [];
for (const entry of dataset.cases) caseResults.push(await evaluateCase(entry));
const categoryNames = [...new Set(dataset.cases.map((entry) => entry.category))];
const categories = Object.fromEntries(categoryNames.map((category) => {
  const results = caseResults.filter((result) => result.category === category);
  return [category, { cases: results.length, passed: results.filter((result) => result.passed).length }];
}));
const totalAssertions = caseResults.reduce((total, result) => total + result.assertions, 0);
const failedAssertions = caseResults.reduce((total, result) => total + result.failures.length, 0);
const passedCases = caseResults.filter((result) => result.passed).length;
const report = {
  schemaVersion: 1,
  datasetVersion: dataset.datasetVersion,
  datasetSha256: createHash("sha256").update(rawDataset).digest("hex"),
  cases: dataset.cases.length,
  passedCases,
  passRate: Number(((passedCases / dataset.cases.length) * 100).toFixed(1)),
  assertions: { total: totalAssertions, passed: totalAssertions - failedAssertions },
  categories,
  limitations: [
    "The suite uses controlled retrieval and model fixtures; it does not measure production Vectorize recall.",
    "The suite checks objective response contracts, citations, boundaries, and concision; it is not a human preference score.",
    "Evaluation cases live outside knowledge/ so expected answers cannot enter the public retrieval corpus."
  ],
  failures: caseResults.filter((result) => !result.passed).map(({ id, failures }) => ({ id, failures }))
};

const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (process.argv.includes("--write")) {
  await writeFile(resultsPath, serialized, "utf8");
  console.log(`Wrote ${resultsPath}`);
} else if (process.argv.includes("--check")) {
  let committed = "";
  try { committed = await readFile(resultsPath, "utf8"); } catch { /* Report absence is handled below. */ }
  if (committed !== serialized) {
    console.error("Evaluation results are stale. Run `npm run evaluate:update --prefix chat-worker` and review the result.");
    process.exitCode = 1;
  }
}

for (const failure of report.failures) {
  console.error(`${failure.id}:`);
  for (const detail of failure.failures) console.error(`  - ${detail}`);
}
console.log(`Ask Mantosh evaluation: ${report.passedCases}/${report.cases} cases and ${report.assertions.passed}/${report.assertions.total} assertions passed.`);
if (report.failures.length) process.exitCode = 1;

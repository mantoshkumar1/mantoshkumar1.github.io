import assert from "node:assert/strict";
import test from "node:test";
import worker from "../src/index.js";
import { isPublicProfileOverviewQuestion } from "../src/prompt/index.js";

const source = {
  path: "knowledge/faq/about-mantosh.md",
  title: "About Mantosh and Where His Experience Can Help",
  slug: "about-mantosh",
  category: "faq",
  tags: "[]",
  summary: "A published professional profile.",
  related_topics: "[]",
  url: "/experience/"
};

const facts = {
  current_role: "Staff Software Engineer",
  current_employer: "Nokia",
  location: "Toronto, Canada",
  experience_years: "More than 14 years",
  capabilities: ["Platform engineering", "Engineering automation", "Backend systems", "Distributed validation"]
};

function environment({ publicSource = source, profileFacts = facts } = {}) {
  const calls = { embedding: 0, generation: 0 };
  const db = {
    prepare(sql) {
      return {
        bind: () => ({
          all: async () => {
            if (sql.includes("FROM profile_facts")) return { results: Object.entries(profileFacts).map(([fact_key, value]) => ({ fact_key, fact_value: JSON.stringify(value) })) };
            return { results: [] };
          },
          first: async () => {
            if (sql.includes("FROM documents WHERE path = ?")) return publicSource;
            if (sql.includes("ai_request_windows") || sql.includes("ai_daily_usage")) return { request_count: 1 };
            return null;
          },
          run: async () => ({ success: true })
        })
      };
    },
    batch: async () => []
  };
  return {
    calls,
    env: {
      ALLOWED_ORIGINS: "https://mantoshkumar1.github.io",
      RATE_LIMITER: { limit: async () => ({ success: true }) },
      KNOWLEDGE_DB: db,
      KNOWLEDGE_INDEX: { query: async () => ({ matches: [] }) },
      AI: { run: async (model) => {
        if (model.includes("bge-m3")) {
          calls.embedding += 1;
          return { data: [[0.1, 0.2]] };
        }
        calls.generation += 1;
        throw new Error("Profile overview should not need model generation.");
      } }
    }
  };
}

function chat(question, headers = {}) {
  return new Request("https://worker.example/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://mantoshkumar1.github.io", ...headers },
    body: JSON.stringify({ question })
  });
}

test("a visitor's broad profile question uses cited public facts without retrieval or generation", async () => {
  const { env, calls } = environment();
  const response = await worker.fetch(chat("tell me about this guy?"), env);
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.match(payload.answer, /Mantosh Kumar is a Staff Software Engineer at Nokia, based in Toronto, Canada/);
  assert.match(payload.answer, /Platform engineering, Engineering automation, Backend systems, Distributed validation/);
  assert.match(payload.answer, /\[Faq: About Mantosh and Where His Experience Can Help\]\(\/experience\/\)/);
  assert.deepEqual(payload.sources.map((item) => item.path), [source.path]);
  assert.doesNotMatch(payload.answer, /I can't support that|private personality|UAE work authorization/i);
  assert.deepEqual(calls, { embedding: 0, generation: 0 });
});

test("the same overview is delivered by the streaming contract without a model call", async () => {
  const { env, calls } = environment();
  const response = await worker.fetch(chat("Who is Mantosh?", { Accept: "text/event-stream" }), env);
  const events = await response.text();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("Content-Type"), /text\/event-stream/);
  assert.match(events, /event: metadata/);
  assert.match(events, /event: response\.output_text\.delta/);
  assert.match(events, /Staff Software Engineer at Nokia/);
  assert.match(events, /event: done/);
  assert.deepEqual(calls, { embedding: 0, generation: 0 });
});

test("missing public canonical source fails closed to ordinary evidence retrieval", async () => {
  const { env, calls } = environment({ publicSource: null });
  const response = await worker.fetch(chat("tell me about this guy?"), env);
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.match(payload.answer, /I can't support that from Mantosh's published work/);
  assert.deepEqual(payload.sources, []);
  assert.deepEqual(calls, { embedding: 1, generation: 0 });
});

test("profile overview routing excludes private and project-specific questions", async () => {
  assert.equal(isPublicProfileOverviewQuestion("Tell me about this guy?"), true);
  assert.equal(isPublicProfileOverviewQuestion("Who is Mantosh?"), true);
  assert.equal(isPublicProfileOverviewQuestion("Tell me about this guy's home address"), false);
  assert.equal(isPublicProfileOverviewQuestion("Tell me about Mantosh's projects"), false);
  const { env, calls } = environment();
  const response = await worker.fetch(chat("Tell me about this guy's home address?"), env);
  const payload = await response.json();
  assert.match(payload.answer, /private home-address details/);
  assert.deepEqual(payload.sources, []);
  assert.deepEqual(calls, { embedding: 0, generation: 0 });
});

import { AppError, badRequest } from "./errors.js";
import { bumpKnowledgeVersion } from "./cache.js";
import { createEmbeddings } from "./ai.js";
import { verifyGitHubOidcToken } from "./github-oidc.js";

const MAX_CHUNKS_PER_DOCUMENT = 20;
const MAX_CHUNK_CHARS = 2_000;
const CATEGORIES = new Set(["project", "article", "note", "experience", "resume", "faq"]);
const CATEGORY_DIRECTORIES = Object.freeze({ project: "projects", article: "articles", note: "notes", experience: "experience", resume: "resume", faq: "faq" });
const PROFILE_FACT_SOURCE = "knowledge/faq/about-mantosh.md";
const PROFILE_FACT_KEYS = new Set(["location", "time_zone", "citizenship", "work_authorization", "current_employer", "current_role", "employment_history", "experience_years", "target_roles", "capabilities", "skills", "ownership_summary", "ownership_highlights", "ownership_team_context"]);

function isString(value, max = 10_000) {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}

function staticTokenMatches(token, expected) {
  const length = Math.max(token?.length || 0, expected.length);
  let difference = (token?.length || 0) ^ expected.length;
  for (let index = 0; index < length; index += 1) difference |= (token?.charCodeAt(index) || 0) ^ (expected.charCodeAt(index) || 0);
  return difference === 0 && Boolean(expected);
}

async function assertIndexerAuthorization(request, env) {
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (staticTokenMatches(token, env.INDEXER_TOKEN || "")) return;
  await verifyGitHubOidcToken(token, env);
}

function validateDocument(document) {
  if (!document || typeof document !== "object" || !isString(document.path, 512) || !isString(document.checksum, 128)) {
    throw badRequest("Invalid knowledge document.");
  }
  const required = ["title", "slug", "category", "summary", "last_updated", "visibility", "url"];
  for (const field of required) if (!isString(document[field], 2_000)) throw badRequest(`Invalid document ${field}.`);
  if (!Array.isArray(document.tags) || !Array.isArray(document.related_topics) || !Array.isArray(document.chunks)) {
    throw badRequest("Invalid document arrays.");
  }
  if (!CATEGORIES.has(document.category) || !document.path.startsWith(`knowledge/${CATEGORY_DIRECTORIES[document.category]}/`)) {
    throw badRequest("Invalid document category or path.");
  }
  if (!/^https:\/\/|^\//.test(document.url)) throw badRequest("Invalid document url.");
  if (document.chunks.length === 0 || document.chunks.length > MAX_CHUNKS_PER_DOCUMENT || document.chunks.some((chunk) => !isString(chunk.id, 128) || !isString(chunk.content, MAX_CHUNK_CHARS))) {
    throw badRequest("Invalid document chunks.");
  }
  const facts = document.facts || {};
  if (!facts || typeof facts !== "object" || Array.isArray(facts)) throw badRequest("Invalid document facts.");
  if (Object.keys(facts).length && document.path !== PROFILE_FACT_SOURCE) throw badRequest("Profile facts must use the canonical profile source.");
  for (const [key, factValue] of Object.entries(facts)) {
    const values = Array.isArray(factValue) ? factValue : [factValue];
    if (!PROFILE_FACT_KEYS.has(key) || !values.length || values.length > 24 || values.some((item) => !isString(item, 200))) throw badRequest("Invalid profile fact.");
  }
}

async function existingChunkIds(db, path) {
  const result = await db.prepare("SELECT chunk_id FROM chunks WHERE document_path = ?").bind(path).all();
  return (result.results || []).map((row) => row.chunk_id);
}

async function deleteDocument(env, path) {
  const ids = await existingChunkIds(env.KNOWLEDGE_DB, path);
  await env.KNOWLEDGE_DB.batch([
    env.KNOWLEDGE_DB.prepare("DELETE FROM profile_facts WHERE source_path = ?").bind(path),
    env.KNOWLEDGE_DB.prepare("DELETE FROM chunks_fts WHERE document_path = ?").bind(path),
    env.KNOWLEDGE_DB.prepare("DELETE FROM chunks WHERE document_path = ?").bind(path),
    env.KNOWLEDGE_DB.prepare("DELETE FROM documents WHERE path = ?").bind(path)
  ]);
  if (ids.length) await env.KNOWLEDGE_INDEX.deleteByIds(ids);
}

async function upsertDocument(env, config, document) {
  validateDocument(document);
  if (document.visibility !== "public") {
    await deleteDocument(env, document.path);
    await bumpKnowledgeVersion(env);
    return { indexed: false, path: document.path };
  }

  const oldIds = await existingChunkIds(env.KNOWLEDGE_DB, document.path);
  const embeddings = await createEmbeddings({ env, config, input: document.chunks.map((chunk) => chunk.content) });
  await env.KNOWLEDGE_INDEX.upsert(document.chunks.map((chunk, index) => ({
    id: chunk.id,
    values: embeddings[index],
    metadata: { chunk_id: chunk.id, path: document.path, slug: document.slug, category: document.category, visibility: "public" }
  })));

  const statements = [
    env.KNOWLEDGE_DB.prepare(
      `INSERT INTO documents (path, title, slug, category, tags, summary, last_updated, related_topics, visibility, checksum, url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(path) DO UPDATE SET title=excluded.title, slug=excluded.slug, category=excluded.category, tags=excluded.tags,
       summary=excluded.summary, last_updated=excluded.last_updated, related_topics=excluded.related_topics, visibility=excluded.visibility, checksum=excluded.checksum, url=excluded.url`
    ).bind(document.path, document.title, document.slug, document.category, JSON.stringify(document.tags), document.summary, document.last_updated, JSON.stringify(document.related_topics), document.visibility, document.checksum, document.url),
    env.KNOWLEDGE_DB.prepare("DELETE FROM profile_facts WHERE source_path = ?").bind(document.path),
    env.KNOWLEDGE_DB.prepare("DELETE FROM chunks_fts WHERE document_path = ?").bind(document.path),
    env.KNOWLEDGE_DB.prepare("DELETE FROM chunks WHERE document_path = ?").bind(document.path)
  ];
  for (const [key, factValue] of Object.entries(document.facts || {})) {
    statements.push(env.KNOWLEDGE_DB.prepare("INSERT INTO profile_facts (fact_key, fact_value, source_path, last_updated) VALUES (?, ?, ?, ?)").bind(key, JSON.stringify(factValue), document.path, document.last_updated));
  }
  for (const [position, chunk] of document.chunks.entries()) {
    statements.push(env.KNOWLEDGE_DB.prepare("INSERT INTO chunks (chunk_id, document_path, position, content) VALUES (?, ?, ?, ?)").bind(chunk.id, document.path, position, chunk.content));
    statements.push(env.KNOWLEDGE_DB.prepare(
      "INSERT INTO chunks_fts (chunk_id, document_path, title, summary, content, tags, category, visibility) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(chunk.id, document.path, document.title, document.summary, chunk.content, document.tags.join(" "), document.category, document.visibility));
  }
  await env.KNOWLEDGE_DB.batch(statements);
  const currentIds = new Set(document.chunks.map((chunk) => chunk.id));
  const staleIds = oldIds.filter((id) => !currentIds.has(id));
  if (staleIds.length) await env.KNOWLEDGE_INDEX.deleteByIds(staleIds);
  await bumpKnowledgeVersion(env);
  return { indexed: true, path: document.path, chunks: document.chunks.length };
}

export async function handleIndexRequest(request, env, config) {
  await assertIndexerAuthorization(request, env);
  if (!env.KNOWLEDGE_DB || !env.KNOWLEDGE_INDEX) throw new AppError(500, "knowledge_unconfigured", "Knowledge storage is not configured.");
  let payload;
  try { payload = await request.json(); } catch { throw badRequest("Malformed JSON body."); }
  if (payload?.action === "delete" && isString(payload.path, 512)) {
    await deleteDocument(env, payload.path);
    await bumpKnowledgeVersion(env);
    return { success: true, deleted: payload.path };
  }
  if (payload?.action === "upsert") {
    return { success: true, ...(await upsertDocument(env, config, payload.document)) };
  }
  throw badRequest("Unsupported indexing action.");
}

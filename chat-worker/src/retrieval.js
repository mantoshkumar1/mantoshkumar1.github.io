import { AppError } from "./errors.js";
import { createEmbeddings } from "./openai.js";
import { scoreRetrievalConfidence } from "./prompt/confidence-scorer.js";
import { fingerprint, isCacheableQuestion, knowledgeVersion, readCachedJson, writeCachedJson } from "./cache.js";

const RRF_K = 60;

function ftsQuery(question) {
  const terms = question.toLowerCase().match(/[\p{L}\p{N}_-]{2,}/gu) || [];
  return [...new Set(terms)].slice(0, 12).map((term) => `"${term.replaceAll('"', '')}"`).join(" OR ");
}

function sourceLabel(row) {
  const category = row.category[0].toUpperCase() + row.category.slice(1).replaceAll("-", " ");
  return `${category}: ${row.title}`;
}

async function getRowsByIds(db, ids) {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => "?").join(",");
  const result = await db.prepare(
    `SELECT c.chunk_id, c.content, d.title, d.slug, d.category, d.tags, d.summary, d.related_topics, d.path, d.url
     FROM chunks c JOIN documents d ON d.path = c.document_path
     WHERE c.chunk_id IN (${placeholders}) AND d.visibility = 'public'`
  ).bind(...ids).all();
  return result.results || [];
}

export async function retrieveKnowledge(question, env, config) {
  if (!env.KNOWLEDGE_DB || !env.KNOWLEDGE_INDEX) {
    throw new AppError(500, "knowledge_unconfigured", "Knowledge search is not configured.");
  }

  const cacheable = isCacheableQuestion(question);
  const version = await knowledgeVersion(env, config.cacheVersion);
  const embeddingKey = cacheable ? await fingerprint(`${config.embeddingModel}:${question}`) : null;
  let embedding = embeddingKey ? await readCachedJson("embedding", embeddingKey) : null;
  let embeddingCache = embedding ? "hit" : "miss";
  if (!Array.isArray(embedding)) {
    embedding = (await createEmbeddings({ config, input: [question] }))[0];
    if (embeddingKey) writeCachedJson("embedding", embeddingKey, embedding, config.embeddingCacheTtlSeconds);
    embeddingCache = "miss";
  }
  const lexical = ftsQuery(question);
  const retrievalKey = cacheable ? await fingerprint(`${version}:${config.embeddingModel}:${question}`) : null;
  let candidates = retrievalKey ? await readCachedJson("retrieval", retrievalKey) : null;
  let retrievalCache = candidates ? "hit" : "miss";
  if (!candidates || !Array.isArray(candidates.vectorMatches) || !Array.isArray(candidates.lexicalMatches)) {
    const [vectorResult, lexicalResult] = await Promise.all([
      env.KNOWLEDGE_INDEX.query(embedding, { topK: 16, returnMetadata: "all" }),
      lexical
        ? env.KNOWLEDGE_DB.prepare(
          `SELECT chunk_id FROM chunks_fts WHERE chunks_fts MATCH ? AND visibility = 'public' ORDER BY bm25(chunks_fts) LIMIT 16`
        ).bind(lexical).all()
        : Promise.resolve({ results: [] })
    ]);
    candidates = { vectorMatches: vectorResult.matches || [], lexicalMatches: lexicalResult.results || [] };
    if (retrievalKey) writeCachedJson("retrieval", retrievalKey, candidates, config.retrievalCacheTtlSeconds);
    retrievalCache = "miss";
  }

  const fused = new Map();
  for (const [index, match] of candidates.vectorMatches.entries()) {
    if (match.score < config.semanticScoreThreshold || !match.metadata?.chunk_id) continue;
    fused.set(match.metadata.chunk_id, { score: 1 / (RRF_K + index + 1), semanticScore: match.score });
  }
  const lexicalMatches = candidates.lexicalMatches;
  for (const [index, row] of lexicalMatches.entries()) {
    const current = fused.get(row.chunk_id) || { score: 0, semanticScore: 0 };
    current.score += 1 / (RRF_K + index + 1);
    fused.set(row.chunk_id, current);
  }

  const rankedIds = [...fused.entries()].sort((a, b) => b[1].score - a[1].score).map(([id]) => id).slice(0, config.retrievalTopK);
  const rows = await getRowsByIds(env.KNOWLEDGE_DB, rankedIds);
  const rowById = new Map(rows.map((row) => [row.chunk_id, row]));
  const selected = [];
  let characterCount = 0;
  for (const id of rankedIds) {
    const row = rowById.get(id);
    if (!row || characterCount + row.content.length > config.retrievalMaxContextChars) continue;
    selected.push(row);
    characterCount += row.content.length;
  }

  const sources = [...new Map(selected.map((row) => [row.path, {
    title: row.title,
    slug: row.slug,
    category: row.category,
    label: sourceLabel(row),
    url: row.url,
    summary: row.summary,
    tags: row.tags,
    related_topics: row.related_topics,
    path: row.path
  }])).values()];
  const bestSemanticScore = Math.max(0, ...candidates.vectorMatches.map((match) => match.score || 0));
  return {
    chunks: selected,
    sources,
    confidence: scoreRetrievalConfidence({ bestSemanticScore, lexicalMatchCount: lexicalMatches.length, sourceCount: sources.length }),
    metrics: { bestSemanticScore, lexicalMatchCount: lexicalMatches.length, fusedMatchCount: fused.size, embeddingCache, retrievalCache }
  };
}

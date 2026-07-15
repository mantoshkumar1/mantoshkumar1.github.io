import { AppError } from "./errors.js";
import { createEmbeddings } from "./ai.js";
import { scoreRetrievalConfidence } from "./prompt/confidence-scorer.js";
import { fingerprint, isCacheableQuestion, knowledgeVersion, readCachedJson, writeCachedJson } from "./cache.js";

const RRF_K = 60;
const LEXICAL_GATE_MIN_TERMS = 4;
const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "been", "but", "by", "can", "could", "did", "do", "does",
  "for", "from", "had", "has", "have", "he", "her", "him", "his", "how", "i", "if", "in", "is", "it",
  "its", "me", "my", "of", "on", "or", "our", "please", "she", "should", "tell", "that", "the", "their",
  "them", "they", "this", "to", "us", "was", "we", "were", "what", "when", "where", "which", "who",
  "why", "will", "with", "would", "you", "your"
]);

function lexicalTerms(question) {
  const terms = question.toLowerCase().match(/[\p{L}\p{N}_-]{2,}/gu) || [];
  return [...new Set(terms.filter((term) => !STOP_WORDS.has(term)))].slice(0, 12);
}

function ftsQuery(question) {
  return lexicalTerms(question).map((term) => `"${term.replaceAll('"', '')}"`).join(" OR ");
}

export function assessLexicalRelevance(question, lexicalMatches) {
  const terms = lexicalTerms(question);
  const termCount = terms.length;
  const lexicalMatchCount = lexicalMatches.length;
  const searchableText = lexicalMatches.map((row) => [row.title, row.summary, row.content, row.tags].filter(Boolean).join(" ").toLowerCase()).join(" ");
  const scorable = searchableText.length > 0;
  const matchedTermCount = scorable ? terms.filter((term) => searchableText.includes(term)).length : lexicalMatchCount ? termCount : 0;
  const coverage = termCount ? matchedTermCount / termCount : 0;
  const metrics = { termCount, lexicalMatchCount, matchedTermCount, coverage };
  if (lexicalMatchCount > 0 && (!scorable || coverage >= 0.4)) {
    return { decision: "continue", confidence: "high", ...metrics };
  }
  if (termCount >= LEXICAL_GATE_MIN_TERMS && coverage < 0.4) {
    return { decision: "clearly_unrelated", confidence: "high", ...metrics };
  }
  return { decision: "continue", confidence: "uncertain", ...metrics };
}

export async function searchLexicalKnowledge(question, env) {
  if (!env.KNOWLEDGE_DB) throw new AppError(500, "knowledge_unconfigured", "Knowledge search is not configured.");
  const lexical = ftsQuery(question);
  if (!lexical) return [];
  const result = await env.KNOWLEDGE_DB.prepare(
    `SELECT chunk_id, title, summary, content, tags FROM chunks_fts
     WHERE chunks_fts MATCH ? AND visibility = 'public' ORDER BY bm25(chunks_fts) LIMIT 16`
  ).bind(lexical).all();
  return result.results || [];
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

export async function retrieveKnowledge(question, env, config, { lexicalMatches: prefetchedLexicalMatches } = {}) {
  if (!env.KNOWLEDGE_DB || !env.KNOWLEDGE_INDEX) {
    throw new AppError(500, "knowledge_unconfigured", "Knowledge search is not configured.");
  }

  const cacheable = isCacheableQuestion(question);
  const version = await knowledgeVersion(env, config.cacheVersion);
  const embeddingKey = cacheable ? await fingerprint(`${config.embeddingModel}:${question}`) : null;
  let embedding = embeddingKey ? await readCachedJson("embedding", embeddingKey) : null;
  let embeddingCache = embedding ? "hit" : "miss";
  if (!Array.isArray(embedding)) {
    embedding = (await createEmbeddings({ env, config, input: [question] }))[0];
    if (embeddingKey) writeCachedJson("embedding", embeddingKey, embedding, config.embeddingCacheTtlSeconds);
    embeddingCache = "miss";
  }
  const lexicalMatches = prefetchedLexicalMatches || await searchLexicalKnowledge(question, env);
  const retrievalKey = cacheable ? await fingerprint(`${version}:${config.embeddingModel}:${question}`) : null;
  let candidates = retrievalKey ? await readCachedJson("retrieval", retrievalKey) : null;
  let retrievalCache = candidates ? "hit" : "miss";
  if (!candidates || !Array.isArray(candidates.vectorMatches) || !Array.isArray(candidates.lexicalMatches)) {
    const vectorResult = await env.KNOWLEDGE_INDEX.query(embedding, { topK: 16, returnMetadata: "all" });
    candidates = { vectorMatches: vectorResult.matches || [], lexicalMatches };
    if (retrievalKey) writeCachedJson("retrieval", retrievalKey, candidates, config.retrievalCacheTtlSeconds);
    retrievalCache = "miss";
  }

  const fused = new Map();
  for (const [index, match] of candidates.vectorMatches.entries()) {
    if (match.score < config.semanticScoreThreshold || !match.metadata?.chunk_id) continue;
    fused.set(match.metadata.chunk_id, { score: 1 / (RRF_K + index + 1), semanticScore: match.score });
  }
  const candidateLexicalMatches = candidates.lexicalMatches;
  for (const [index, row] of candidateLexicalMatches.entries()) {
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
    confidence: scoreRetrievalConfidence({ bestSemanticScore, lexicalMatchCount: candidateLexicalMatches.length, sourceCount: sources.length }),
    metrics: { bestSemanticScore, lexicalMatchCount: candidateLexicalMatches.length, fusedMatchCount: fused.size, embeddingCache, retrievalCache }
  };
}

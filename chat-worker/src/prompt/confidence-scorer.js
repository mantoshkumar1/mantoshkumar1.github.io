// This measures retrieval evidence, never model certainty. It is intentionally
// conservative: a low score causes a truthful unavailable response.
export function scoreRetrievalConfidence({ bestSemanticScore = 0, lexicalMatchCount = 0, sourceCount = 0 }) {
  if (sourceCount === 0) return "low";
  if (bestSemanticScore >= 0.7 || (bestSemanticScore >= 0.45 && lexicalMatchCount > 0)) return "high";
  if (bestSemanticScore >= 0.4 || lexicalMatchCount > 0) return "medium";
  return "low";
}

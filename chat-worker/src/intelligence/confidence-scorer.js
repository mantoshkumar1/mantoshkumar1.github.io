const LEVEL_SCORE = Object.freeze({ high: 0.85, medium: 0.55, low: 0.15 });

export class ConfidenceScorer {
  score(retrieval) {
    const level = retrieval.confidence;
    const sourceCount = retrieval.sources.length;
    const bestScore = retrieval.metrics?.bestSemanticScore || 0;
    const lexicalMatches = retrieval.metrics?.lexicalMatchCount || 0;
    return {
      level,
      score: LEVEL_SCORE[level],
      factors: {
        retrievedSources: sourceCount,
        bestSemanticSimilarity: Number(bestScore.toFixed(3)),
        lexicalMatches,
        contextCoverage: retrieval.chunks.length
      }
    };
  }
}

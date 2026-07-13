function sourceLabel(source) {
  const category = source.category[0].toUpperCase() + source.category.slice(1).replaceAll("-", " ");
  return `${category}: ${source.title}`;
}

function recommendation(row) {
  return { id: row.path, title: row.title, slug: row.slug, category: row.category, summary: row.summary, url: row.url, label: sourceLabel(row) };
}

export class RecommendationEngine {
  constructor(metadataService, config) { this.metadataService = metadataService; this.config = config; }

  async recommend({ sources }) {
    const rows = await this.metadataService.related({ sources, limit: this.config.recommendationLimit });
    const all = rows.map(recommendation);
    return {
      all,
      articles: all.filter((item) => item.category === "article"),
      projects: all.filter((item) => item.category === "project"),
      notes: all.filter((item) => item.category === "note" || item.category === "architecture-note")
    };
  }

  followUpQuestions({ sources, intent = "direct" }) {
    if (intent === "achievement") {
      return [
        "What was Mantosh's GATE result?",
        "How did GATE relate to Mantosh's TUM admission journey?",
        "Which engineering awards has Mantosh received?"
      ];
    }
    if (intent === "profile") {
      return [
        "What engineering problems is Mantosh best suited to solve?",
        "Which projects best demonstrate Mantosh's work?",
        "How does Mantosh approach automation and platform engineering?"
      ];
    }
    const candidates = [];
    for (const source of sources) {
      let tags = Array.isArray(source.tags) ? source.tags : [];
      if (typeof source.tags === "string") {
        try { tags = JSON.parse(source.tags); } catch { tags = []; }
      }
      const focus = tags[0] || source.title;
      candidates.push(`What does ${source.title} explain about ${focus}?`);
      candidates.push(`What engineering decisions are documented in ${source.title}?`);
      candidates.push(`What trade-offs does ${source.title} describe?`);
    }
    return [...new Set(candidates)].slice(0, 3);
  }
}

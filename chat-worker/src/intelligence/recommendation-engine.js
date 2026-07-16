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
    const category = sources[0]?.category || "";
    if (category === "project") {
      return ["What decisions shaped this project?", "What trade-offs mattered most?", "What changed after it was delivered?"];
    }
    if (["article", "note", "architecture-note"].includes(category)) {
      return ["What is the main engineering lesson?", "How can this idea be applied?", "Which related project demonstrates it?"];
    }
    return ["Which projects best demonstrate this experience?", "How does Mantosh approach automation?", "Where can I review his experience?"];
  }
}

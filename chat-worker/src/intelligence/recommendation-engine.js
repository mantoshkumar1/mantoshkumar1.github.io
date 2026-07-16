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

  followUpQuestions({ sources, intent = "direct", question = "" }) {
    const askedFit = /\b(?:fit|hire|help|value|best suited|new team)\b/i.test(question);
    const askedEvidence = /\b(?:project|evidence|demonstrate|prove|example)\b/i.test(question);
    if (intent === "ownership") {
      return [
        "Which decisions did Mantosh make during the migration?",
        "What outcomes did his ownership produce?",
        "Which project best demonstrates his leadership?"
      ];
    }
    if (intent === "achievement") {
      return [
        "Which projects best demonstrate Mantosh's engineering work?",
        "Where could Mantosh add the most value?",
        "What has Mantosh personally owned?"
      ];
    }
    if (intent === "profile") {
      if (askedFit) {
        return ["Which projects best demonstrate his fit?", "What has Mantosh personally owned?", "What outcomes did his work produce?"];
      }
      if (askedEvidence) {
        return ["What has Mantosh personally owned?", "Where could Mantosh add the most value?", "What outcomes did his work produce?"];
      }
      return [
        "Where could Mantosh add the most value?",
        "Which projects best demonstrate his fit?",
        "What has Mantosh personally owned?"
      ];
    }
    const category = sources[0]?.category || "";
    if (category === "project") {
      return ["What did Mantosh personally own?", "What outcomes did this project produce?", "Which skills does this project demonstrate?"];
    }
    if (["article", "note", "architecture-note"].includes(category)) {
      return ["Which project demonstrates this thinking?", "How does this reflect Mantosh's approach?", "Where could this approach add value?"];
    }
    return ["What has Mantosh personally owned?", "Which projects prove this experience?", "Where could this experience add value?"];
  }
}

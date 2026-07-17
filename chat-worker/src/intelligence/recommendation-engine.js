function sourceLabel(source) {
  const category = source.category[0].toUpperCase() + source.category.slice(1).replaceAll("-", " ");
  return `${category}: ${source.title}`;
}

function recommendation(row) {
  return { id: row.path, title: row.title, slug: row.slug, category: row.category, summary: row.summary, url: row.url, label: sourceLabel(row) };
}

function questionKey(question) {
  const ignored = new Set(["a", "an", "the", "what", "which", "did", "does", "do", "has", "have", "had", "is", "are", "was", "were", "mantosh", "he", "his", "him", "personally", "during", "this", "that"]);
  return String(question || "").toLowerCase().match(/[a-z0-9]+/g)?.filter((token) => !ignored.has(token)).sort().join(" ") || "";
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

  followUpQuestions({ sources, intent = "direct", question = "", previousQuestions = [] }) {
    const askedFit = /\b(?:fit|hire|help|value|best suited|new team)\b/i.test(question);
    const askedEvidence = /\b(?:project|evidence|demonstrate|prove|example)\b/i.test(question);
    let candidates;
    if (intent === "ownership") {
      candidates = [
        "Which decisions did Mantosh make during the migration?",
        "What outcomes did his ownership produce?",
        "Which project best demonstrates his leadership?",
        "What changed after the migration?",
        "How could this experience help a new team?"
      ];
    } else if (intent === "projects") {
      candidates = [
        "What did Mantosh personally own in these projects?",
        "Which engineering decisions show his judgment?",
        "Where could this experience add value?",
        "Which project best demonstrates technical leadership?",
        "What outcomes did these projects produce?"
      ];
    } else if (intent === "decisions") {
      candidates = [
        "What changed after the migration?",
        "How did Mantosh reduce migration risk?",
        "What does this project demonstrate?",
        "How could this experience help a new team?",
        "Which evidence supported the final cutover?"
      ];
    } else if (intent === "achievement") {
      candidates = [
        "Which projects best demonstrate Mantosh's engineering work?",
        "Where could Mantosh add the most value?",
        "What has Mantosh personally owned?",
        "Which decisions best show his engineering judgment?"
      ];
    } else if (intent === "skills") {
      candidates = [
        "Which projects best demonstrate these skills?",
        "What has Mantosh personally owned?",
        "Where could Mantosh add the most value?",
        "Which decisions best show his engineering judgment?"
      ];
    } else if (intent === "fit") {
      candidates = [
        "Which projects best demonstrate this fit?",
        "What has Mantosh personally owned?",
        "What outcomes did his work produce?",
        "Which decisions best show his engineering judgment?"
      ];
    } else if (intent === "profile") {
      if (askedFit) {
        candidates = ["Which projects best demonstrate his fit?", "What has Mantosh personally owned?", "What outcomes did his work produce?", "Which decisions show his engineering judgment?"];
      } else if (askedEvidence) {
        candidates = ["What has Mantosh personally owned?", "Where could Mantosh add the most value?", "What outcomes did his work produce?", "Which decisions show his engineering judgment?"];
      } else {
        candidates = ["Where could Mantosh add the most value?", "Which projects best demonstrate his fit?", "What has Mantosh personally owned?", "Which decisions show his engineering judgment?"];
      }
    } else {
      const category = sources[0]?.category || "";
      if (category === "project") candidates = ["What did Mantosh personally own?", "What outcomes did this project produce?", "Which skills does this project demonstrate?", "How could this experience help a new team?"];
      else if (["article", "note", "architecture-note"].includes(category)) candidates = ["Which project demonstrates this thinking?", "How does this reflect Mantosh's approach?", "Where could this approach add value?", "What decision is most transferable?"];
      else candidates = ["What has Mantosh personally owned?", "Which projects prove this experience?", "Where could this experience add value?", "Which decisions show his engineering judgment?"];
    }
    const seen = new Set([...previousQuestions, question].map(questionKey).filter(Boolean));
    return candidates.filter((candidate) => !seen.has(questionKey(candidate))).slice(0, 3);
  }
}

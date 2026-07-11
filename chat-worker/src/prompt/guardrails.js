import { NO_KNOWLEDGE_ANSWER } from "./system-prompt.js";

export function escapeXmlText(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function isAnswerable(confidence, sourceCount) {
  return sourceCount > 0 && confidence !== "low";
}

export function unavailableResponse({ conversationId, recommendations = { all: [], articles: [], projects: [], notes: [] }, followUpQuestions = [] } = {}) {
  return { answer: NO_KNOWLEDGE_ANSWER, sources: [], relatedArticles: recommendations.articles, relatedProjects: recommendations.projects, relatedNotes: recommendations.notes, recommendations: recommendations.all, followUpQuestions, suggestedQuestions: followUpQuestions, confidence: "low", conversationId, success: true };
}

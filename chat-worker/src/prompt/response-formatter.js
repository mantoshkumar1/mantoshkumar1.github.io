import { AppError } from "../errors.js";
import { deduplicateSources } from "./citation-builder.js";

function extractOutputText(response) {
  if (typeof response.output_text === "string" && response.output_text.trim()) return response.output_text.trim();
  for (const item of response.output || []) {
    for (const content of item.content || []) {
      if ((content.type === "output_text" || content.type === "text") && typeof content.text === "string") return content.text.trim();
    }
  }
  return "";
}

function extractFollowUpQuestions(answer) {
  const heading = /^##\s+Follow-up Questions\s*$/im;
  const match = heading.exec(answer);
  if (!match) return [];
  const section = answer.slice(match.index + match[0].length).split(/^##\s+/m, 1)[0];
  return section.split("\n")
    .map((line) => line.replace(/^\s*(?:[-*]|\d+[.)])\s+/, "").trim())
    .filter((line) => line.endsWith("?"))
    .slice(0, 3);
}

function validateSafeModelOutput(answer, sources) {
  if (/<\/?(?:script|style|iframe|object|embed)\b|\bon\w+\s*=|(?:javascript|data):/i.test(answer)) {
    throw new AppError(500, "invalid_model_response", "The AI service returned an invalid response.");
  }
  const allowedUrls = new Set(sources.map((source) => source.url).filter(Boolean));
  const markdownUrls = [...answer.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+[^)]*)?\)/g)].map((match) => match[1]);
  if (markdownUrls.some((url) => !allowedUrls.has(url))) {
    throw new AppError(500, "invalid_model_response", "The AI service returned an invalid response.");
  }
}

export function formatResponse(response, { sources, confidence, maxAnswerChars = 12_000, recommendations, followUpQuestions, conversationId, action = null }) {
  const answer = extractOutputText(response);
  if (!answer) throw new AppError(500, "empty_model_response", "The AI service returned no answer.");
  if (answer.length > maxAnswerChars || /<\/?(?:system|instructions|retrieved_documents)>/i.test(answer)) {
    throw new AppError(500, "invalid_model_response", "The AI service returned an invalid response.");
  }
  const canonicalSources = deduplicateSources(sources);
  validateSafeModelOutput(answer, canonicalSources);
  const modelFollowUps = extractFollowUpQuestions(answer);
  const questions = followUpQuestions?.length ? followUpQuestions : modelFollowUps;
  return {
    answer,
    sources: canonicalSources,
    relatedArticles: recommendations?.articles || canonicalSources.filter((source) => source.category === "article" || source.category === "note"),
    relatedProjects: recommendations?.projects || canonicalSources.filter((source) => source.category === "project"),
    relatedNotes: recommendations?.notes || [],
    recommendations: recommendations?.all || [],
    followUpQuestions: questions,
    suggestedQuestions: questions,
    confidence,
    conversationId,
    action,
    success: true
  };
}

export function formatError(error) {
  return { answer: "", sources: [], relatedArticles: [], relatedProjects: [], relatedNotes: [], recommendations: [], followUpQuestions: [], suggestedQuestions: [], confidence: "low", success: false, error: { code: error.code, message: error.message } };
}

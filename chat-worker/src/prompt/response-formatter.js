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

function normalizeGroundedAnswer(answer, followUpQuestions = []) {
  const answerBlock = /<answer>\s*([\s\S]*?)\s*<\/answer>/i.exec(answer);
  let normalized = (answerBlock ? answerBlock[1] : answer).trim();
  const sectionNames = ["Summary", "Detailed Explanation", "Engineering Decisions", "Trade-offs", "Lessons Learned", "Related Articles", "Related Projects", "Sources", "Follow-up Questions"];
  for (const section of sectionNames) {
    normalized = normalized.replace(new RegExp(`^#{0,2}\\s*${section}\\s*$`, "gim"), `## ${section}`);
  }
  const firstHeading = normalized.search(/^##\s+Summary\s*$/im);
  normalized = firstHeading >= 0 ? normalized.slice(firstHeading).trim() : normalized;
  const followUpHeading = /^##\s+Follow-up Questions\s*$/im;
  const match = followUpHeading.exec(normalized);
  if (match) {
    const questions = followUpQuestions.length ? followUpQuestions.slice(0, 3) : extractFollowUpQuestions(normalized);
    normalized = normalized.slice(0, match.index).trimEnd();
    if (questions.length) normalized += `\n\n## Follow-up Questions\n${questions.map((question) => `- ${question}`).join("\n")}`;
  }
  return normalized;
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
  const rawAnswer = extractOutputText(response);
  if (!rawAnswer) throw new AppError(500, "empty_model_response", "The AI service returned no answer.");
  const answer = normalizeGroundedAnswer(rawAnswer, followUpQuestions);
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

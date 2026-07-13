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
  normalized = normalized.replace(/^[•▪◦]\s+/gm, "- ");
  const sectionNames = ["Answer", "Summary", "In brief", "Highlights", "Context", "Best fit", "Where Mantosh can help", "Relevant evidence", "A sensible next step", "What matters", "How Mantosh's experience applies", "Practical next steps", "Limits", "Detailed Explanation", "Engineering Decisions", "Trade-offs", "Lessons Learned", "Related Articles", "Related Projects", "Sources", "Follow-up Questions"];
  for (const section of sectionNames) {
    normalized = normalized.replace(new RegExp(`^#{0,2}\\s*${section}\\s*$`, "gim"), `## ${section}`);
  }
  normalized = normalized.replace(
    /^##\s+(Engineering Decisions|Trade-offs|Lessons Learned|Related Articles|Related Projects)\s*\n\s*(?:Not discussed(?: in the retrieved documents)?\.?|Not available\.?)\s*(?=^##\s+|$)/gim,
    ""
  ).replace(/\n{3,}/g, "\n\n").trim();
  const firstHeading = normalized.search(/^##\s+(?:Answer|In brief|Highlights|What matters|Summary)\s*$/im);
  if (firstHeading >= 0) normalized = normalized.slice(firstHeading).trim();
  else normalized = `## Answer\n${normalized}`;
  const followUpHeading = /^##\s+Follow-up Questions\s*$/im;
  const match = followUpHeading.exec(normalized);
  if (match) {
    const questions = followUpQuestions.length ? followUpQuestions.slice(0, 3) : extractFollowUpQuestions(normalized);
    normalized = normalized.slice(0, match.index).trimEnd();
    if (questions.length) normalized += `\n\n## Follow-up Questions\n${questions.map((question) => `- ${question}`).join("\n")}`;
  }
  return normalized;
}

function addSubjectiveFraming(answer, subjectiveProfile) {
  if (!subjectiveProfile || /\bsubjective\b/i.test(answer)) return answer;
  const openingHeading = /^##\s+(?:In brief|Answer)\s*$/im;
  return openingHeading.test(answer)
    ? answer.replace(openingHeading, (heading) => `${heading}\nThat label is subjective. Here is what the published evidence supports.`)
    : `## In brief\nThat label is subjective. Here is what the published evidence supports.\n\n${answer}`;
}

function canonicalizeSourceSection(answer, sources) {
  const sourceLines = sources
    .filter((source) => source.url)
    .map((source) => `- [${source.label || source.title}](${source.url})`);
  if (!sourceLines.length) return answer;
  const sourcesSection = /^##\s+Sources\s*$[\s\S]*?(?=^##\s+Follow-up Questions\s*$|(?![\s\S]))/im;
  const canonical = `## Sources\n${sourceLines.join("\n")}\n\n`;
  if (sourcesSection.test(answer)) return answer.replace(sourcesSection, canonical);
  if (sources.some((source) => source.url && answer.includes(`](${source.url})`))) return answer;
  const followUpHeading = /^##\s+Follow-up Questions\s*$/im;
  const followUp = followUpHeading.exec(answer);
  if (followUp) return `${answer.slice(0, followUp.index).trimEnd()}\n\n${canonical}${answer.slice(followUp.index)}`;
  return `${answer.trimEnd()}\n\n${canonical.trimEnd()}`;
}

function citedSources(answer, sources) {
  const answerBody = answer.split(/^##\s+Sources\s*$/im, 1)[0];
  const citedUrls = new Set([...answerBody.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+[^)]*)?\)/g)].map((match) => match[1]));
  const cited = sources.filter((source) => source.url && citedUrls.has(source.url));
  return cited.length ? cited : sources.slice(0, 1);
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
  if (allowedUrls.size && !markdownUrls.some((url) => allowedUrls.has(url))) {
    throw new AppError(500, "uncited_model_response", "The AI service returned an answer without verifiable citations.");
  }
}

export function formatResponse(response, { sources, confidence, maxAnswerChars = 12_000, recommendations, followUpQuestions, conversationId, action = null, subjectiveProfile = false }) {
  const rawAnswer = extractOutputText(response);
  if (!rawAnswer) throw new AppError(500, "empty_model_response", "The AI service returned no answer.");
  const retrievedSources = deduplicateSources(sources);
  const normalizedAnswer = addSubjectiveFraming(normalizeGroundedAnswer(rawAnswer, followUpQuestions), subjectiveProfile);
  const canonicalSources = citedSources(normalizedAnswer, retrievedSources);
  const answer = canonicalizeSourceSection(normalizedAnswer, canonicalSources);
  if (answer.length > maxAnswerChars || /<\/?(?:system|instructions|retrieved_documents)>/i.test(answer)) {
    throw new AppError(500, "invalid_model_response", "The AI service returned an invalid response.");
  }
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

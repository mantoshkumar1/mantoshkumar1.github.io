import { deduplicateSources, sourceLabel } from "./citation-builder.js";
import { escapeXmlText } from "./guardrails.js";
import { buildSystemPrompt } from "./system-prompt.js";
import { classifyQuestionIntent, responseModeInstructions } from "./intent-classifier.js";

function formatDocument(chunk, index) {
  const label = sourceLabel(chunk);
  return [
    `<document id="${index + 1}">`,
    `Source label: ${label}`,
    `Source URL: ${chunk.url}`,
    `Title: ${chunk.title}`,
    `Summary: ${chunk.summary}`,
    `Tags: ${chunk.tags}`,
    "Content:",
    chunk.content,
    "</document>"
  ].join("\n");
}

export function buildPrompt({ question, retrieval, memory = { summary: "", messages: [] } }) {
  const intent = classifyQuestionIntent(question);
  const seenContent = new Set();
  const chunks = retrieval.chunks.filter((chunk) => {
    const fingerprint = `${chunk.path}:${chunk.content}`;
    if (seenContent.has(fingerprint)) return false;
    seenContent.add(fingerprint);
    return true;
  });
  const sources = deduplicateSources(retrieval.sources);
  const documents = chunks.map(formatDocument).join("\n\n");
  const conversation = [
    memory.summary ? `Summary of earlier turns: ${escapeXmlText(memory.summary)}` : "",
    ...memory.messages.slice(-6).map((message) => `${message.role}: ${escapeXmlText(message.content)}`)
  ].filter(Boolean).join("\n");
  return {
    instructions: buildSystemPrompt(),
    sources,
    input: [
      "<user_question>",
      escapeXmlText(question),
      "</user_question>",
      "",
      "<conversation_memory>",
      conversation || "No earlier conversation context.",
      "</conversation_memory>",
      "",
      `<response_mode intent="${intent}">`,
      responseModeInstructions(intent),
      "</response_mode>",
      "",
      "<retrieved_documents>",
      documents,
      "</retrieved_documents>"
    ].join("\n")
  };
}

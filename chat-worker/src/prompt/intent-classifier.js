const PROFILE_PATTERNS = [
  /\b(?:who is|tell me about|about)\s+(?:this (?:guy|person|engineer)|mantosh|him)\b/i,
  /\b(?:what does|what can|how can)\s+(?:mantosh|he|this (?:guy|person|engineer))\b/i,
  /\b(?:hire|hiring|contract|consultant|candidate|fit for|strengths|skills|experience)\b/i
];

const PROBLEM_PATTERNS = [
  /\b(?:my|our|we|i)\s+(?:problem|issue|challenge|need|struggle|want|have|are trying)\b/i,
  /\b(?:help|guide|advise|approach|solve|improve|automate|design|build|debug|scale)\b/i,
  /\b(?:what should (?:i|we)|how should (?:i|we)|how would (?:he|mantosh))\b/i
];

export function classifyQuestionIntent(question) {
  const value = String(question || "").trim();
  if (PROFILE_PATTERNS.some((pattern) => pattern.test(value))) return "profile";
  if (PROBLEM_PATTERNS.some((pattern) => pattern.test(value))) return "problem";
  return "direct";
}

export function responseModeInstructions(intent) {
  if (intent === "profile") {
    return [
      "Visitor intent: understand Mantosh or assess whether to hire or engage him.",
      "Use these headings in this order: `## In brief`, `## Where Mantosh can help`, `## Relevant evidence`, `## A sensible next step`, `## Sources`, `## Follow-up Questions`.",
      "In `Where Mantosh can help`, use 2–4 short bullets tied to documented capabilities. Do not claim that Mantosh can solve the visitor's specific problem unless the evidence directly supports that fit.",
      "In `A sensible next step`, recommend a concrete conversation topic or published page—not a sales claim."
    ].join("\n");
  }
  if (intent === "problem") {
    return [
      "Visitor intent: get useful guidance for a stated problem using Mantosh's documented experience.",
      "Use these headings in this order: `## What matters`, `## How Mantosh's experience applies`, `## Practical next steps`, `## Limits`, `## Sources`, `## Follow-up Questions`.",
      "Use 2–5 short bullets for practical next steps. Clearly distinguish documented experience from a suggested approach.",
      "In `Limits`, state what cannot be concluded without the visitor's constraints or without published evidence. Never imply a guaranteed result."
    ].join("\n");
  }
  return [
    "Visitor intent: get a direct answer about published work or engineering thinking.",
    "Use these headings in this order: `## Answer`, then at most two useful evidence-specific sections, followed by `## Sources` and `## Follow-up Questions`.",
    "Keep the opening answer to 1–3 short paragraphs. Prefer bullets for lists of three or more items. Do not repeat the same fact in multiple sections."
  ].join("\n");
}

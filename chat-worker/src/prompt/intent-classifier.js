const SUBJECTIVE_PROFILE_PATTERN = /\b(?:genius|brilliant|smart|impressive|exceptional|great engineer|good engineer|really good|actually good|overrated)\b/i;
const ACHIEVEMENT_PATTERN = /\b(?:achievement|achievements|accomplishment|accomplishments|award|awards|recognition|honou?rs?|career story|his story|journey|education|academic|gate|heroes of tomorrow|something interesting about (?:mantosh|him))\b/i;
const DETAILED_RESPONSE_PATTERN = /\b(?:in detail|detailed|deep dive|deeply|comprehensive|thorough|step[- ]by[- ]step|full explanation|explain fully|long answer)\b/i;
const OWNERSHIP_PATTERN = /\b(?:(?:what|which) (?:has|did|does) (?:mantosh|he) (?:personally )?(?:own|owned|lead|led|deliver|delivered)|what (?:was|were) (?:mantosh|he) (?:personally )?responsible for|(?:mantosh(?:'s)?|his) (?:personal )?(?:ownership|contribution|contributions|responsibilities)|what (?:parts?|work|systems?|projects?) did (?:mantosh|he) (?:personally )?(?:own|build|lead|deliver))\b/i;

const PROFILE_PATTERNS = [
  /\b(?:who is|tell me about|about)\s+(?:this (?:guy|person|engineer)|mantosh|him)\b/i,
  /\bwhat\s+(?:kind|type|sort)\s+of\s+(?:guy|person|engineer)\b/i,
  /\bwhat\s+(?:kind|type|sort)\s+of\s+engineering\s+work\s+does\s+(?:mantosh|he)\s+do\b/i,
  /\bwhat(?:'s| is)\s+(?:mantosh|he|this (?:guy|person|engineer))\s+like\b/i,
  /\b(?:how would you describe|describe)\s+(?:mantosh|him|this (?:guy|person|engineer))\b/i,
  /\b(?:what does|what can|how can)\s+(?:mantosh|he|this (?:guy|person|engineer))\b/i,
  /\bwhere\s+(?:could|can)\s+(?:mantosh|he)\s+add\s+(?:the\s+most\s+)?value\b/i,
  /\b(?:hire|hiring|contract|consultant|candidate|fit for|strengths|skills|experience)\b/i,
  SUBJECTIVE_PROFILE_PATTERN
];

const PROBLEM_PATTERNS = [
  /\b(?:my|our|we|i)\s+(?:problem|issue|challenge|need|struggle|want|have|are trying)\b/i,
  /\b(?:help|guide|advise|approach|solve|improve|automate|design|build|debug|scale)\b/i,
  /\b(?:what should (?:i|we)|how should (?:i|we)|how would (?:he|mantosh))\b/i
];

export function classifyQuestionIntent(question) {
  const value = String(question || "").trim();
  if (OWNERSHIP_PATTERN.test(value)) return "ownership";
  if (ACHIEVEMENT_PATTERN.test(value)) return "achievement";
  if (PROFILE_PATTERNS.some((pattern) => pattern.test(value))) return "profile";
  if (PROBLEM_PATTERNS.some((pattern) => pattern.test(value))) return "problem";
  return "direct";
}

export function isSubjectiveProfileQuestion(question) {
  return SUBJECTIVE_PROFILE_PATTERN.test(String(question || "").trim());
}

export function isDetailedResponseRequested(question) {
  return DETAILED_RESPONSE_PATTERN.test(String(question || "").trim());
}

export function responseModeInstructions(intent, detailed = false) {
  const lengthInstruction = detailed
    ? "The visitor explicitly requested depth. Keep the answer body before Sources under 220 words."
    : "The visitor did not request depth. Keep the answer body before Sources under 160 words.";
  if (intent === "ownership") {
    return [
      "Visitor intent: understand Mantosh's personal engineering ownership and distinguish it from team contributions.",
      "Use these headings in this order: `## Personally owned`, `## Team context`, `## Sources`, `## Follow-up Questions`.",
      "Lead with concrete systems, integrations, technical decisions, delivery responsibilities, or operational responsibilities explicitly attributed to Mantosh.",
      "State Mantosh's ownership in natural third-person language. Clearly distinguish his work from what the team delivered, and preserve collaborators' contributions when the source describes them.",
      "Degrees, awards, rankings, employment, and technologies are not engineering ownership. Do not use them as evidence for this question.",
      "Use at most four concise bullets and keep the answer body before Sources under 140 words. Do not infer sole ownership from participation."
    ].join("\n");
  }
  if (intent === "achievement") {
    return [
      "Visitor intent: explicitly understand Mantosh's verified achievements, awards, education, or career story.",
      "Use these headings in this order: `## Highlights`, `## Context`, `## Sources`, `## Follow-up Questions`.",
      "Use at most three concise highlight bullets. For a question about one achievement, use one direct highlight and at most one context sentence.",
      "Explain context without hype, ranking inflation, or implying that an achievement proves role suitability. Explain GATE's prestige or exam administration only when the visitor explicitly asks what GATE is or why it matters.",
      "Keep the answer body before Sources under 90 words. Include only achievements explicitly supported by retrieved documents."
    ].join("\n");
  }
  if (intent === "profile") {
    return [
      "Visitor intent: understand Mantosh or assess whether to hire or engage him.",
      "Use these headings in this order: `## In brief`, `## Best fit`, `## Sources`, `## Follow-up Questions`.",
      "Keep `In brief` to at most two sentences and 45 words. Under `Best fit`, use exactly three one-line bullets of at most 16 words each.",
      "Keep the answer body before Sources under 120 words. Do not add Relevant evidence, A sensible next step, or any other section.",
      "For broad questions about what kind of person or guy Mantosh is, answer as a public professional profile: summarize documented technical focus and recurring engineering approach. Do not infer private personality, temperament, values, or behavior from technical work.",
      "For praise, skepticism, or subjective labels such as genius, brilliant, impressive, or overrated: say the label is subjective, do not endorse or reject it as fact, and pivot immediately to concise published evidence.",
      "Tie every capability to a citation. Do not claim that Mantosh can solve the visitor's specific problem unless the evidence directly supports that fit."
      + " Use `documented experience in` rather than expert, specialist, authority, master, or proficient unless a source explicitly supports that level."
    ].join("\n");
  }
  if (intent === "problem") {
    return [
      "Visitor intent: get useful guidance for a stated problem using Mantosh's documented experience.",
      "Use these headings in this order: `## What matters`, `## How Mantosh's experience applies`, `## Practical next steps`, `## Limits`, `## Sources`, `## Follow-up Questions`.",
      "Use 2–5 short bullets for practical next steps. Clearly distinguish documented experience from a suggested approach.",
      lengthInstruction,
      "In `Limits`, state what cannot be concluded without the visitor's constraints or without published evidence. Never imply a guaranteed result."
    ].join("\n");
  }
  return [
    "Visitor intent: get a direct answer about published work or engineering thinking.",
    "Use these headings in this order: `## Answer`, then at most two useful evidence-specific sections, followed by `## Sources` and `## Follow-up Questions`.",
    lengthInstruction,
    "Keep the opening answer to 1–3 short paragraphs. Prefer bullets for lists of three or more items. Do not repeat the same fact in multiple sections."
  ].join("\n");
}

export function audienceInstructions(audience) {
  const shared = "Audience adaptation changes presentation only. Use the same retrieved evidence and factual claims. Never invent or inflate impact, ownership, business value, experience, or technical detail.";
  const modes = {
    general: "Audience: general visitor. Give a concise, balanced answer. Let the question determine whether to emphasize overview, ownership, architecture, trade-offs, or explanation; do not assume the visitor's role.",
    recruiter: "Audience: recruiter. Lead with a concise high-level summary, then verified technologies, impact, business value, and years of experience when relevant. Avoid implementation depth unless explicitly requested.",
    "hiring-manager": "Audience: hiring manager. Lead with Mantosh's verified personal ownership, technical decisions, leadership, execution strategy, trade-offs, and outcomes. Attribute individual and team contributions precisely.",
    engineer: "Audience: engineer. Use the most technical version supported by the documents. Prioritize architecture, constraints, trade-offs, implementation details, design decisions, and lessons learned. Assume technical knowledge.",
    student: "Audience: student. Explain the answer in plain language, briefly define unfamiliar technical terms, avoid unnecessary jargon, and emphasize what can be learned from the work."
  };
  return `${shared}\n${modes[audience] || modes.general}`;
}

export function expandRetrievalQuery(question, conversationQuery = question) {
  const intent = classifyQuestionIntent(question);
  if (intent === "ownership") return `Mantosh personal engineering ownership contribution led migration integration shared libraries CI/CD dashboard project decisions ${conversationQuery}`;
  if (intent === "achievement") return `Mantosh Verified Achievements Awards Education GATE Top 1% Technical University of Munich Heroes of Tomorrow ${conversationQuery}`;
  if (intent !== "profile") return conversationQuery;
  return `About Mantosh Where His Experience Can Help Engineering Capabilities Technical Skills ${conversationQuery}`;
}

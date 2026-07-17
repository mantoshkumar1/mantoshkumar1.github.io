const SUBJECTIVE_PROFILE_PATTERN = /\b(?:genius|brilliant|smart|impressive|exceptional|great engineer|good engineer|really good|actually good|overrated)\b/i;
const ACHIEVEMENT_PATTERN = /\b(?:achievement|achievements|accomplishment|accomplishments|award|awards|recognition|honou?rs?|career story|his story|journey|education|academic|gate|heroes of tomorrow|something interesting about (?:mantosh|him))\b/i;
const DETAILED_RESPONSE_PATTERN = /\b(?:in detail|detailed|deep dive|deeply|comprehensive|thorough|step[- ]by[- ]step|full explanation|explain fully|long answer)\b/i;
const OUTCOME_PATTERN = /\b(?:what|which)\b[^?]*\b(?:outcomes?|results?|changed|impact)\b|\b(?:outcomes?|results?|impact)\b[^?]*\b(?:produce|produced|achieve|achieved|deliver|delivered)\b/i;
const SCOPED_WORK_PATTERN = /\b(?:this|that|the)\s+(?:project|migration|platform|system|work|role)\b|\bthese\s+projects\b|\b(?:legacy|validation framework)\s+migration\b/i;
const OUTSIDE_NOKIA_PATTERN = /\b(?:outside|before)\s+nokia\b|\bnon[- ]nokia\b/i;
const PROJECT_PATTERNS = [
  /\bwhich projects?\b[^?]*\b(?:demonstrate|show|prove|represent)\b/i,
  /\b(?:best|strongest|most relevant) projects?\b/i,
  /\b(?:tell|show|list|explain)\b[^?]*\bmantosh(?:'s|’s)? projects?\b/i
];
const DECISION_PATTERNS = [
  /\b(?:which|what) (?:engineering |technical )?decisions? did (?:mantosh|he) make\b/i,
  /\bdecisions?\b[^?]*\b(?:migration|project|platform|photosahi|validation)\b/i,
  /\b(?:migration|project|platform|photosahi|validation)\b[^?]*\b(?:trade-offs?|choices?|decisions?)\b/i
];
const OWNERSHIP_PATTERNS = [
  /\b(?:what|which) (?:has|did|does) (?:mantosh|he) (?:personally |himself )?(?:own|owned|lead|led|deliver|delivered)\b/i,
  /\bwhat (?:was|were) (?:mantosh|he) (?:personally )?responsible for\b/i,
  /\b(?:mantosh(?:'s)?|his) (?:personal |individual )?(?:ownership|contribution|contributions|responsibilities)\b/i,
  /\b(?:which|what) (?:parts?|work|systems?|projects?|migration responsibilities)\b[^?]*\b(?:his|mantosh(?:'s)?) (?:responsibility|responsibilities)\b/i,
  /\bseparate (?:mantosh(?:'s)?|his) contribution from (?:the )?team(?:'s)? work\b/i,
  /\b(?:where is|show|document) (?:mantosh(?:'s)?|his) (?:individual |personal )?ownership\b/i,
  /\b(?:which|what)\b[^?]*\bresponsibilities belonged to (?:mantosh|him)\b/i,
  /\bwhat engineering work (?:can be|is) attributed directly to (?:mantosh|him)\b/i
];

const SKILLS_PATTERNS = [
  /\b(?:strongest|key|main|top|core)\s+(?:documented\s+)?(?:technical\s+)?(?:skills|capabilities|strengths)\b/i,
  /\bwhat\s+(?:are|is)\s+(?:mantosh(?:'s|’s)|his)\s+(?:technical\s+)?(?:skills|capabilities|strengths)\b/i,
  /\bwhich\s+(?:technical\s+)?(?:skills|capabilities)\s+does\s+(?:mantosh|he)\s+(?:have|bring)\b/i
];

const FIT_PATTERNS = [
  /\bwhere\s+(?:could|can|would)\s+(?:mantosh|he)\s+add\s+(?:the\s+most\s+)?value\b/i,
  /\bwhere\s+(?:is|would)\s+(?:mantosh|he)\s+(?:be\s+)?(?:most\s+)?valuable\b/i,
  /\bwhat\s+(?:kind|type)s?\s+of\s+(?:team|role|problem|work)\s+(?:is|would be)\s+(?:mantosh|he)\s+(?:best\s+)?(?:suited|fit)\s+for\b/i,
  /\bwhat\s+(?:is|would be)\s+(?:mantosh(?:'s|’s)|his)\s+best\s+fit\b/i
];

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
  if (OUTSIDE_NOKIA_PATTERN.test(value)) return "outside-nokia";
  if (OUTCOME_PATTERN.test(value)) return "outcomes";
  if (OWNERSHIP_PATTERNS.some((pattern) => pattern.test(value))) return "ownership";
  if (PROJECT_PATTERNS.some((pattern) => pattern.test(value))) return "projects";
  if (DECISION_PATTERNS.some((pattern) => pattern.test(value))) return "decisions";
  if (ACHIEVEMENT_PATTERN.test(value)) return "achievement";
  if (SKILLS_PATTERNS.some((pattern) => pattern.test(value))) return "skills";
  if (FIT_PATTERNS.some((pattern) => pattern.test(value))) return "fit";
  if (PROFILE_PATTERNS.some((pattern) => pattern.test(value))) return "profile";
  if (PROBLEM_PATTERNS.some((pattern) => pattern.test(value))) return "problem";
  return "direct";
}

export function isScopedWorkQuestion(question) {
  return SCOPED_WORK_PATTERN.test(String(question || "").trim());
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
      "Use these headings in this order: `## Mantosh's ownership`, `## What he personally delivered`, `## What the team delivered`, `## Sources`, `## Follow-up Questions`.",
      "Start with a plain-language summary that says what was migrated, from what, and to what before listing Mantosh's ownership.",
      "Lead with concrete systems, integrations, technical decisions, delivery responsibilities, or operational responsibilities explicitly attributed to Mantosh.",
      "State Mantosh's ownership in natural third-person language. Clearly distinguish his work from what the team delivered, and preserve collaborators' contributions when the source describes them.",
      "Degrees, awards, rankings, employment, and technologies are not engineering ownership. Do not use them as evidence for this question.",
      "Summarize every distinct ownership area explicitly supported by the primary project source; do not stop after the first example.",
      "Use plain language that a non-engineer can understand immediately. Prefer `kept both frameworks aligned` over `owned synchronization`, and explain the final comparison checks instead of saying `led cutover validation`.",
      "Avoid compressed corporate language. Use short sentences and familiar verbs such as built, migrated, compared, checked, taught, and led.",
      "Use up to six concise bullets and keep the answer body before Sources under 170 words. Do not infer sole ownership from participation."
    ].join("\n");
  }
  if (intent === "outcomes") {
    return [
      "Visitor intent: understand documented outcomes, changes, or results—not receive another ownership summary.",
      "Use these headings in this order: `## Documented outcomes`, `## Evidence boundary`, `## Sources`, `## Follow-up Questions`.",
      "Answer the outcome question directly. Separate completed changes from capabilities demonstrated, and do not restate responsibilities as outcomes.",
      "When metrics or business results are not published, say so plainly and report only the operational or system changes supported by the documents.",
      "For a career-wide question, use distinct examples from more than one role when the retrieved evidence supports them.",
      "Keep the answer body before Sources under 150 words."
    ].join("\n");
  }
  if (intent === "projects") {
    return [
      "Visitor intent: identify actual published projects that best support the capability or fit being discussed.",
      "Use these headings in this order: `## Best project evidence`, `## Why these projects`, `## Sources`, `## Follow-up Questions`.",
      "Name two to four actual project titles from the retrieved project documents. For each project, state in one concise sentence what engineering capability it demonstrates.",
      "Do not present job categories, capability areas, responsibilities, or employer work as if they were project names.",
      "Use the current question as the task. Earlier conversation is context only; do not repeat the previous answer.",
      "Keep the answer body before Sources under 150 words."
    ].join("\n");
  }
  if (intent === "decisions") {
    return [
      "Visitor intent: understand the engineering decisions Mantosh made and the trade-offs behind them.",
      "Use these headings in this order: `## Engineering decisions`, `## Why they mattered`, `## Sources`, `## Follow-up Questions`.",
      "For each decision, write a complete plain-language sentence that states the choice, why it was made, and the trade-off where the source supports one.",
      "Do not turn fragments such as `freeze the legacy framework` into standalone bullets. Do not repeat the same decision under both headings.",
      "Name the project or migration in the opening so the answer makes sense without earlier conversation.",
      "Keep the answer body before Sources under 170 words."
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
  if (intent === "skills") {
    return [
      "Visitor intent: understand Mantosh's strongest documented technical capability areas, not receive a biography or a list of suitable jobs.",
      "Use these headings in this order: `## Strongest documented capabilities`, `## Technical toolkit`, `## Sources`, `## Follow-up Questions`.",
      "Answer the skills question immediately. Do not open with years of experience, employer history, location, or a generic professional summary.",
      "Under `Strongest documented capabilities`, use three or four concise bullets that group related skills and say what kind of work documents each capability.",
      "Under `Technical toolkit`, give one compact categorized line or at most three bullets. Do not dump every technology in the résumé.",
      "Treat `strongest` as repeated, role-backed documented experience—not an objective proficiency ranking. Never claim mastery or expert status.",
      "Keep the answer body before Sources under 130 words. Do not use the headings `In brief` or `Best fit`."
    ].join("\n");
  }
  if (intent === "fit") {
    return [
      "Visitor intent: understand the engineering environments and problems where Mantosh's documented experience could add the most value.",
      "Use these headings in this order: `## Where Mantosh adds the most value`, `## Why this fit`, `## Sources`, `## Follow-up Questions`.",
      "Start with three concise, problem-oriented bullets. Describe the organizational or engineering situation, not merely a technology list.",
      "Under `Why this fit`, connect those situations to specific role or project evidence in no more than two sentences.",
      "Do not repeat a generic biography, employer list, or the same `In brief` and `Best fit` profile template.",
      "Use cautious language such as `best-supported fit` or `documented experience is most relevant`; do not promise outcomes or availability.",
      "Keep the answer body before Sources under 130 words."
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
    "Keep the opening answer to 1–3 short paragraphs. Prefer bullets for lists of three or more items. Do not repeat the same fact in multiple sections.",
    "Write so a visitor unfamiliar with the work understands the first reading. Prefer plain descriptions over internal labels or compressed engineering language.",
    "Name the project, system, or engineering problem in the opening. Do not assume the visitor knows what `it`, `this project`, `the migration`, or `the platform` refers to."
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
  if (intent === "outside-nokia") return `Engineering Work Outside Nokia KI Labs Siemens Intel Cisco Aricent backend SDN NFV modem packet-core ${question}`;
  if (intent === "ownership") return isScopedWorkQuestion(question)
    ? `Mantosh personal engineering ownership contribution responsibility project decisions ${conversationQuery}`
    : `Mantosh professional experience personally built developed designed led architected engineering systems across roles ${question}`;
  if (intent === "projects") return `Legacy Validation Framework Migration Distributed Validation Platform Evidence-First Engineering Knowledge System PhotoSahi Workflow Automation Toolkit projects engineering evidence ${conversationQuery}`;
  if (intent === "decisions") return isScopedWorkQuestion(question)
    ? `Engineering decisions choices constraints trade-offs ${conversationQuery}`
    : `Mantosh engineering decisions choices constraints trade-offs across projects and roles ${question}`;
  if (intent === "outcomes") return isScopedWorkQuestion(question)
    ? `documented outcomes results operational changes evidence ${conversationQuery}`
    : `Mantosh documented outcomes results systems delivered across professional experience ${question}`;
  if (intent === "achievement") return `Mantosh Verified Achievements Awards Education GATE Top 1% Technical University of Munich Heroes of Tomorrow ${conversationQuery}`;
  if (intent === "skills") return `Engineering Capabilities and Technical Skills résumé role-backed platform engineering automation Python Django backend networking distributed validation operational intelligence ${conversationQuery}`;
  if (intent === "fit") return `Mantosh professional experience where documented experience is most relevant engineering platforms validation infrastructure workflow automation backend operational intelligence ${conversationQuery}`;
  if (intent !== "profile") return conversationQuery;
  return `About Mantosh Where His Experience Can Help Engineering Capabilities Technical Skills ${conversationQuery}`;
}

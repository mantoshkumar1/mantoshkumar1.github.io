const STATIC_DESTINATIONS = [
  { pattern: /^(?:show |open |go to )?(?:my )?resume\??$/i, label: "Resume", url: "/resume/", type: "resume" },
  { pattern: /^(?:show |open |go to )?contact\??$/i, label: "Contact", url: "/contact/", type: "contact" },
  { pattern: /^(?:show |open |go to )?(?:my )?experience(?: timeline)?\??$/i, label: "Experience", url: "/experience/", type: "experience" }
];

const SOCIAL_RESPONSES = [
  {
    pattern: /^(?:(?:hi|hello|hey)(?:\s+there|\s+ask mantosh)?|good\s+(?:morning|afternoon|evening))[!.?\s]*$/i,
    answer: "Hi! What would you like to know about Mantosh's experience, projects, engineering approach, or fit for a problem?",
    followUpQuestions: [
      "What kind of engineering work does Mantosh do?",
      "How could Mantosh help with my engineering problem?",
      "Which projects best demonstrate his work?"
    ]
  },
  {
    pattern: /^(?:thanks|thank you|thx)(?:\s+(?:very much|so much))?[!.?\s]*$/i,
    answer: "You're welcome. Ask another question whenever you're ready.",
    followUpQuestions: []
  },
  {
    pattern: /^(?:bye|goodbye|see you|good night)[!.?\s]*$/i,
    answer: "Goodbye! Come back anytime.",
    followUpQuestions: []
  },
  {
    pattern: /^(?:how are you|how(?:'s| is) it going|what(?:'s| is) up)[!.?\s]*$/i,
    answer: "Running smoothly—and ready to talk engineering. What are you curious about?",
    followUpQuestions: [
      "What kind of engineering work does Mantosh do?",
      "Which project should I look at first?",
      "How could Mantosh help with my engineering problem?"
    ]
  },
  {
    pattern: /^(?:who are you|what can you do|help me|help)[!.?\s]*$/i,
    answer: "I'm the evidence-based guide to Mantosh's published work. I can explain his experience, projects, engineering decisions, and where that experience may fit your problem.",
    followUpQuestions: [
      "Tell me about Mantosh in brief.",
      "Which projects best demonstrate his work?",
      "How could Mantosh help my engineering team?"
    ]
  },
  {
    pattern: /^(?:tell me (?:a|an) (?:joke|engineering joke)|make me laugh|i(?:'m| am) bored)[!.?\s]*$/i,
    answer: "A repeated manual task walked into a platform. It never had to walk in again. Want the serious version? Ask why repeated human work is an engineering smell.",
    followUpQuestions: [
      "Why is repeated human work an engineering smell?",
      "How does Mantosh approach automation?",
      "Which project best shows that approach?"
    ]
  },
  {
    pattern: /^(?:(?:are you|you(?:'re| are)) (?:dumb|stupid|useless)|this is nonsense)[!.?\s]*$/i,
    answer: "Fair challenge. Give me a specific question about Mantosh's work or an engineering problem, and I'll answer from the published evidence—or say clearly when I cannot.",
    followUpQuestions: [
      "What kind of engineer is Mantosh?",
      "What has Mantosh built?",
      "How could his experience help my team?"
    ]
  }
];

function normalize(value) { return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim(); }

function isLowInformationQuestion(value) {
  const normalized = normalize(value);
  const tokens = normalized.split(" ").filter(Boolean);
  if (tokens.length !== 1) return false;
  return /(.)\1{2}/i.test(normalized) || (normalized.length >= 5 && !/[aeiou]/i.test(normalized) && value !== value.toUpperCase());
}

const CLARIFY_RESPONSE = {
  answer: "I couldn't make sense of that one—my circuits may be innocent this time. Try a few more words, or ask about Mantosh's work, projects, or an engineering problem.",
  followUpQuestions: [
    "What kind of engineering work does Mantosh do?",
    "Which projects best demonstrate his work?",
    "How could Mantosh help with my engineering problem?"
  ]
};

export class SearchRouter {
  constructor(metadataService) { this.metadataService = metadataService; }

  async route(question) {
    const trimmed = question.trim();
    const social = SOCIAL_RESPONSES.find((response) => response.pattern.test(trimmed));
    if (social) return { kind: "social", response: social };
    if (isLowInformationQuestion(trimmed)) return { kind: "social", response: CLARIFY_RESPONSE };

    const direct = STATIC_DESTINATIONS.find((destination) => destination.pattern.test(trimmed));
    if (direct) return { kind: "navigate", destination: direct };

    if (/^(?:show |open |go to )?latest (?:article|post|writing)\??$/i.test(trimmed)) {
      const latest = await this.metadataService.latestByCategory("article");
      if (latest) return { kind: "navigate", destination: latest };
    }

    const verb = /^(?:show|open|go to|take me to|view)\s+(.+)$/i.exec(trimmed);
    if (!verb) return { kind: "answer" };
    const document = await this.metadataService.findByTitle(normalize(verb[1]));
    return document ? { kind: "navigate", destination: document } : { kind: "answer" };
  }
}

const STATIC_DESTINATIONS = [
  { pattern: /^(?:show(?: me)? |open |go to )?(?:(?:my|mantosh(?:'s|’s)) )?r[eé]sum[eé][?.!]*$/iu, label: "Resume", url: "/resume/", type: "resume" },
  { pattern: /^(?:(?:show |open |go to )?contact|(?:(?:what(?:'s| is)|whats|give me|show me|find) )?(?:mantosh(?:'s|’s)? )?(?:email(?: id| address)?|contact (?:details|information|info))|(?:how (?:can|do) i|how to|where (?:can|do) i) (?:contact|email|reach) (?:mantosh|him))[?.!]*$/i, label: "Contact", url: "/contact/", type: "contact" },
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
    pattern: /^(?:is (?:mantosh|he) (?:a )?canadian(?: citizen)?|(?:is|does) (?:mantosh|he) have canadian citizenship)[!.?\s]*$/i,
    answer: "Yes. Mantosh is a Canadian citizen.",
    followUpQuestions: []
  },
  {
    pattern: /^(?:where (?:does )?(?:mantosh|he) (?:live|lives)|where is (?:mantosh|he) based|what(?:'s| is) (?:mantosh(?:'s|’s)|his) location)[!.?\s]*$/i,
    answer: "Mantosh is based in Toronto, Canada.",
    followUpQuestions: []
  },
  {
    pattern: /^(?:can (?:mantosh|he) worki? in (?:dubai|(?:the )?(?:uae|u\.a\.e\.?|united arab emirates))|is (?:mantosh|he) authorized to work in (?:dubai|(?:the )?(?:uae|u\.a\.e\.?|united arab emirates)))[!.?\s]*$/i,
    answer: "Mantosh's published work authorization covers Canada, the United States, and India. For a UAE role or sponsorship requirements, contact him directly.",
    followUpQuestions: []
  },
  {
    pattern: /^(?:can (?:mantosh|he) work in (?:the )?(?:usa|u\.s\.?a?\.?|united states)|is (?:mantosh|he) authorized to work in (?:the )?(?:usa|u\.s\.?a?\.?|united states))[!.?\s]*$/i,
    answer: "Yes. Mantosh states that he is authorized to work in the United States.",
    followUpQuestions: []
  },
  {
    pattern: /^(?:where (?:does )?(?:mantosh|he) work(?: currently| now)?|where (?:mantosh|he) works currently|who does (?:mantosh|he) work for(?: currently| now)?)[!.?\s]*$/i,
    answer: "Mantosh currently works at Nokia.",
    followUpQuestions: []
  },
  {
    pattern: /^(?:what (?:does )?(?:mantosh|he) likes?|what (?:are )?(?:mantosh(?:'s|’s)|his) (?:interests|preferences))[!.?\s]*$/i,
    answer: "Professionally, Mantosh's published work consistently focuses on automation, reusable systems, and clearer engineering decisions. His personal preferences are not documented here.",
    followUpQuestions: []
  },
  {
    pattern: /^(?:tell me )?what kind of person (?:is )?(?:mantosh|he)(?: is)?[!.?\s]*$/i,
    answer: "Professionally, Mantosh's published work suggests a pragmatic, systems-oriented engineer who values automation, reusable platforms, evidence, and engineering judgment. His private personality is not documented here.",
    followUpQuestions: []
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
    pattern: /^(?:(?:lol|lmao|rofl|(?:ha){2,})(?:[\s!.?,]+|$))+$/i,
    answer: "😄 I'll take that as a laugh. What would you like to know about Mantosh—or what engineering problem are you trying to solve?",
    followUpQuestions: []
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

const SCOPE_BOUNDARY_RESPONSES = [
  {
    pattern: /\b(?:home|street|residential|exact) address\b|^(?:what(?:'s| is)|tell me|give me|show me).*(?:his|mantosh(?:'s|’s)) (?:home )?address[?.!]*$/i,
    answer: "I don't provide private home-address details. Mantosh's published professional location is Toronto, Canada."
  },
  {
    pattern: /\b(?:rape|sexually assault|sexual violence)\b/i,
    answer: "Threats of sexual violence are not acceptable. If someone may be in immediate danger, contact local emergency services. I can continue with respectful questions about Mantosh's published work."
  },
  {
    pattern: /\b(?:nokia|employer|company|client|product roadmap).*(?:confidential|private|secret|internal|non-public)|(?:confidential|private|secret|internal|non-public).*\b(?:nokia|employer|company|client|product roadmap)\b/i,
    answer: "I can't provide or invent confidential company information. I can discuss Mantosh's reviewed public experience, projects, and engineering approach instead."
  },
  {
    pattern: /\b(?:reveal|show|print|repeat|disclose)\b.*\b(?:system prompt|hidden prompt|internal instructions|developer instructions)\b/i,
    answer: "I can't reveal internal instructions. I can explain how Ask Mantosh works from the published architecture and evidence instead."
  },
  {
    pattern: /\b(?:invent|fabricate|make up|fake)\b.*\b(?:metric|metrics|revenue|impact|adoption|result|results|claim|claims)\b/i,
    answer: "I won't invent metrics or claims. I can summarize only the outcomes and evidence Mantosh has published."
  },
  {
    pattern: /^(?:give|show|write|share|tell)\s+(?:me\s+)?(?:a\s+)?(?:pasta\s+)?recipe\b/i,
    answer: "I can't support that from Mantosh's published work. Ask me about his experience, projects, engineering approach, or fit for your problem."
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
    const boundary = SCOPE_BOUNDARY_RESPONSES.find((response) => response.pattern.test(trimmed));
    if (boundary) return { kind: "boundary", response: { ...boundary, followUpQuestions: [], confidence: "low" } };
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

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
  }
];

function normalize(value) { return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim(); }

export class SearchRouter {
  constructor(metadataService) { this.metadataService = metadataService; }

  async route(question) {
    const trimmed = question.trim();
    const social = SOCIAL_RESPONSES.find((response) => response.pattern.test(trimmed));
    if (social) return { kind: "social", response: social };

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

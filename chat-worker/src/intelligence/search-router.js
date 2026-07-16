const STATIC_DESTINATIONS = [
  {
    pattern: /^(?:what (?:has|did) (?:mantosh|he) built that i can actually use|what can i (?:actually )?(?:use|try)|(?:does|has) (?:mantosh|he) (?:have|built) anything i can (?:use|try)|show me something (?:mantosh|he) built)[?.!\s]*$/i,
    label: "PhotoSahi",
    url: "https://mantoshkumar1.github.io/photosahi/",
    type: "project",
    answer: "The clearest public tool you can try is PhotoSahi, a browser-based passport and visa photo maker. Opening it now."
  },
  { pattern: /^(?:(?:show(?: me)?|open|go to|take me to|return to)\s+)?(?:(?:the|site)\s+)?home(?:\s+page)?[?.!]*$/i, label: "Home", url: "/", type: "home" },
  { pattern: /^(?:(?:show(?: me)?|open|go to|view|take me to|please show me|can i see|where is)\s+)?(?:(?:the|my|his|mantosh(?:'s|’s))\s+)?r[eé]sum[eé][?.!]*$/iu, label: "Resume", url: "/resume/", type: "resume" },
  { pattern: /^(?:(?:show(?: me)?|open|go to|take me to)\s+)?(?:(?:the|his|mantosh(?:'s|’s))\s+)?contact(?: page)?[?.!]*$|^(?:(?:what(?:'s| is)|whats|give me|show me|find)\s+)?(?:(?:his|mantosh(?:'s|’s)?)\s+)?(?:email(?: id| address)?|contact (?:details|information|info))[?.!]*$|^(?:how (?:can|do) i|how to|where (?:can|do) i) (?:contact|email|reach) (?:mantosh|him)[?.!]*$|^(?:i want to (?:contact|hire) (?:mantosh|him)|where can i discuss (?:a )?(?:role|project) with him|how can i reach him about (?:a )?(?:contract|role|project)|i want to discuss (?:a )?(?:role|project)|where do i start a conversation)[?.!]*$/i, label: "Contact", url: "/contact/", type: "contact" },
  { pattern: /^(?:(?:show(?: me)?|open|go to|view|take me to|can i see|where is|i want to read)\s+)?(?:(?:the|my|his|mantosh(?:'s|’s))\s+)?(?:experience(?: timeline| page)?|professional experience|work history)[?.!]*$/i, label: "Experience", url: "/experience/", type: "experience" },
  { pattern: /^(?:(?:show(?: me)?|open|go to|view|take me to|browse|see)\s+)?(?:(?:all|the|his|mantosh(?:'s|’s))\s+)?projects(?:\s+(?:page|list|index))?[?.!]*$/i, label: "Projects", url: "/projects/", type: "projects" },
  { pattern: /^(?:(?:show(?: me)?|open|go to|view|take me to|browse|read|see)\s+)?(?:(?:all|the|his|mantosh(?:'s|’s))\s+)?(?:insights|articles|engineering (?:writing|notes))(?:\s+(?:page|list|index))?[?.!]*$/i, label: "Insights", url: "/insights/", type: "insights" },
  { pattern: /^(?:(?:show(?: me)?|open|go to|view|take me to|join)\s+)?(?:(?:the|his|mantosh(?:'s|’s))\s+)?newsletter(?:\s+page)?[?.!]*$|^(?:subscribe|how (?:can|do) i subscribe|where (?:can|do) i subscribe|subscribe me|i want to subscribe)(?:\s+to)?(?:\s+(?:the|his|mantosh(?:'s|’s)))?(?:\s+newsletter)?[?.!]*$/i, label: "Newsletter", url: "/newsletter/", type: "newsletter" },
  { pattern: /^(?:(?:show(?: me)?|open|go to|view|take me to|read)\s+)?(?:(?:the|site|website)\s+)?accessibility(?:\s+(?:page|statement|information))?[?.!]*$|^(?:is (?:the|this) (?:site|website) accessible|what accessibility (?:features|support) (?:does|do) (?:the|this) (?:site|website) (?:have|offer))[?.!]*$/i, label: "Accessibility", url: "/accessibility/", type: "accessibility" }
];

function readableList(value) {
  if (!Array.isArray(value) || !value.length) return null;
  if (value.length === 1) return value[0];
  if (value.length === 2) return `${value[0]} and ${value[1]}`;
  return `${value.slice(0, -1).join(", ")}, and ${value.at(-1)}`;
}

function workAuthorizationList(value) {
  return readableList(Array.isArray(value) ? value.map((country) => country === "United States" ? "the United States" : country) : value);
}

const PROFILE_FACT_RESPONSES = [
  {
    pattern: /^(?:(?:i (?:do not|don't|dont) understand[,.!?\s]*)?(?:what|wat) (?:does )?(?:mantosh|he|this guy) (?:actually )?do|explain (?:mantosh(?:'s|’s)|his) job (?:like i(?:'m| am) (?:ten|10)|in (?:simple|plain) (?:words|english)|without jargon))[!.?\s]*$/i,
    answer: (facts) => facts.current_role && facts.current_employer
      ? `In simple terms, Mantosh builds software and internal tools that make engineers' work easier, faster, and less repetitive. His published current role is ${facts.current_role} at ${facts.current_employer}.`
      : null
  },
  {
    pattern: /^(?:is (?:mantosh|he) (?:a )?canadian(?: citizen)?|(?:is|does) (?:mantosh|he) have canadian citizenship)[!.?\s]*$/i,
    answer: (facts) => facts.citizenship ? `Yes. Mantosh is a ${facts.citizenship} citizen.` : null
  },
  {
    pattern: /^(?:where (?:does )?(?:mantosh|he) (?:live|lives)|where is (?:mantosh|he) (?:based|located)|what(?:'s| is) (?:mantosh(?:'s|’s)|his) (?:location|professional location)|which city is (?:mantosh|he) based in|is (?:mantosh|he) in toronto|where in canada is (?:mantosh|he) based|tell me where (?:mantosh|he) is based|what city does (?:mantosh|he) work from)[!.?\s]*$/i,
    answer: (facts) => facts.location ? `Mantosh is based in ${facts.location}.` : null
  },
  {
    pattern: /^(?:can (?:mantosh|he) worki? in (?:dubai|(?:the )?(?:uae|u\.a\.e\.?|united arab emirates))|is (?:mantosh|he) authorized to work in (?:dubai|(?:the )?(?:uae|u\.a\.e\.?|united arab emirates)))[!.?\s]*$/i,
    answer: (facts) => workAuthorizationList(facts.work_authorization) ? `Mantosh's published work authorization covers ${workAuthorizationList(facts.work_authorization)}. For a UAE role or sponsorship requirements, contact him directly.` : null
  },
  {
    pattern: /^(?:can (?:mantosh|he) work in (?:the )?(?:usa|u\.s\.?a?\.?|united states)|is (?:mantosh|he) authorized to work in (?:the )?(?:usa|u\.s\.?a?\.?|united states))[!.?\s]*$/i,
    answer: (facts) => facts.work_authorization?.includes("United States") ? "Mantosh's published work authorization includes the United States. Confirm role-specific details directly with him." : null
  },
  {
    pattern: /^(?:can (?:mantosh|he) work in (?:canada|india)|is (?:mantosh|he) authorized to work in (?:canada|india)|where is (?:mantosh|he) authorized to work|what countries can (?:mantosh|he) legally work in|what(?:'s| is) (?:mantosh(?:'s|’s)|his) published work authorization)[!.?\s]*$/i,
    answer: (facts) => workAuthorizationList(facts.work_authorization) ? `Mantosh's published work authorization covers ${workAuthorizationList(facts.work_authorization)}. Confirm role-specific details directly with him.` : null
  },
  {
    pattern: /^(?:does (?:mantosh|he) need sponsorship in (?:the )?(?:usa|u\.s\.?a?\.?|united states))[!.?\s]*$/i,
    answer: (facts) => facts.work_authorization?.includes("United States") ? "Mantosh publishes United States work authorization, but sponsorship details are not documented. Confirm the role-specific requirements directly with him." : null
  },
  {
    pattern: /^(?:where (?:does )?(?:mantosh|he) work(?: currently| now)?|where (?:mantosh|he) works currently|who does (?:mantosh|he) work for(?: currently| now)?|what company is (?:mantosh|he) at|is (?:mantosh|he) currently at nokia|what(?:'s| is) (?:mantosh(?:'s|’s)|his) current employer|where is (?:mantosh|he) employed|which company employs (?:mantosh|him)|tell me (?:mantosh(?:'s|’s)|his) current workplace|who is (?:mantosh|he) working for|what is (?:mantosh(?:'s|’s)|his) current company)[!.?\s]*$/i,
    answer: (facts) => facts.current_employer ? `Mantosh currently works at ${facts.current_employer}.` : null
  },
  {
    pattern: /^(?:where (?:has )?(?:mantosh|he) worked(?: before)?|which companies (?:has )?(?:mantosh|he) worked (?:at|for)|list (?:mantosh(?:'s|’s)|his) employers|what(?:'s| is) (?:mantosh(?:'s|’s)|his) employment history)[!.?\s]*$/i,
    answer: (facts) => readableList(facts.employment_history) ? `Mantosh's published employment history lists ${readableList(facts.employment_history)}.` : null
  },
  {
    pattern: /^(?:what(?:'s| is) (?:mantosh(?:'s|’s)|his) current (?:role|title)|what role does (?:mantosh|he) have(?: currently)?)[!.?\s]*$/i,
    answer: (facts) => facts.current_role && facts.current_employer ? `Mantosh's published current role is ${facts.current_role} at ${facts.current_employer}.` : null
  },
  {
    pattern: /^(?:how many years of experience does (?:mantosh|he) have|what(?:'s| is) (?:mantosh(?:'s|’s)|his) experience length)[!.?\s]*$/i,
    answer: (facts) => facts.experience_years ? `Mantosh has ${String(facts.experience_years).toLowerCase()} of documented engineering experience.` : null
  },
  {
    pattern: /^(?:what are|list|summarize) (?:mantosh(?:'s|’s)|his) (?:engineering )?capabilities[!.?\s]*$/i,
    answer: (facts) => readableList(facts.capabilities) ? `Mantosh's documented capabilities include ${readableList(facts.capabilities)}.` : null
  },
  {
    pattern: /^(?:what are|list|summarize) (?:mantosh(?:'s|’s)|his) (?:technical )?skills[!.?\s]*$/i,
    answer: (facts) => readableList(facts.skills) ? `Mantosh's published technical toolkit includes ${readableList(facts.skills)}.` : null
  }
];

const SOCIAL_RESPONSES = [
  {
    pattern: /^(?:is (?:mantosh|he|this guy) (?:really |actually |any )?good(?: or just good at (?:making )?websites?)?|is (?:mantosh|he|this guy) (?:a )?good engineer)[!.?\s]*$/i,
    answer: "That's subjective—and this website is hardly an impartial judge. The fair test is Mantosh's published projects, résumé, and engineering decisions.",
    followUpQuestions: []
  },
  {
    pattern: /^(?:is (?:mantosh|he) (?:a )?nerd)[!.?\s]*$/i,
    answer: "I can confirm the engineering part; an official nerd certification is not in the published record.",
    followUpQuestions: []
  },
  {
    pattern: /^(?:does (?:mantosh|he) ever stop working)[!.?\s]*$/i,
    answer: "His off-screen life is not documented here—and that is probably healthy. I can tell you about the work he has chosen to publish.",
    followUpQuestions: []
  },
  {
    pattern: /^(?:can (?:mantosh|he) (?:fix|repair|sort out) (?:my )?wi-?fi)[!.?\s]*$/i,
    answer: "Maybe—but Wi-Fi repair is not documented in his published work, so I should not promise it. Ask him before restarting the router for the fifth time.",
    followUpQuestions: []
  },
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
    pattern: /^(?:bye(?: bye)?|goodbye|see you|good night)[!.?\s]*$/i,
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
    pattern: /^(?:who are you|what can you do|what are you for|how can you help me|explain ask mantosh|what should i ask you|tell me what you know|what topics can we discuss|help me|help)[!.?\s]*$/i,
    answer: "I'm the evidence-based guide to Mantosh's published work. I can explain his experience, projects, engineering decisions, and where that experience may fit your problem.",
    followUpQuestions: [
      "Tell me about Mantosh in brief.",
      "Which projects best demonstrate his work?",
      "How could Mantosh help my engineering team?"
    ]
  },
  {
    pattern: /^(?:what (?:does )?(?:mantosh|he) likes?|what (?:are )?(?:the )?(?:hobbies|interests|preferences) of (?:mantosh|him)|what (?:are )?(?:mantosh(?:'s|’s)|his) (?:hobbies|interests|preferences))[!.?\s]*$/i,
    answer: "Professionally, Mantosh's published work consistently focuses on automation, reusable systems, and clearer engineering decisions. His personal preferences are not documented here.",
    followUpQuestions: []
  },
  {
    pattern: /^(?:tell me )?what kind of person (?:is )?(?:mantosh|he)(?: is)?[!.?\s]*$/i,
    answer: "Professionally, Mantosh's published work suggests a pragmatic, systems-oriented engineer who values automation, reusable platforms, evidence, and engineering judgment. His private personality is not documented here.",
    followUpQuestions: []
  },
  {
    pattern: /^(?:(?:tell|give|show|say) me (?:a|an|another|one) (?:joke|funny joke|engineering joke)|(?:tell|give|show|say) (?:a|an|another|one) (?:joke|funny joke|engineering joke)|joke|make me laugh|i(?:'m| am) bored|cheer me up)[!.?\s]*$/i,
    answer: "Why did the scarecrow get promoted? He was outstanding in his field. And yes—this is intentionally not a lecture on platform engineering.",
    followUpQuestions: []
  },
  {
    pattern: /^(?:(?:lol|lmao|rofl|(?:ha){2,})(?:[\s!.?,]+|$))+$/i,
    answer: "😄 I'll take that as a laugh. What would you like to know about Mantosh—or what engineering problem are you trying to solve?",
    followUpQuestions: []
  },
  {
    pattern: /^(?:this is nonsense|do you know anything)[!.?\s]*$/i,
    answer: "Fair criticism—I may have misunderstood or overcomplicated your question. Try asking it another way, and I'll either answer from Mantosh's published work or clearly say I don't know.",
    followUpQuestions: []
  }
];

const SCOPE_BOUNDARY_RESPONSES = [
  {
    pattern: /\b(?:weather|temperature|forecast)\b/i,
    answer: "I don't have live weather data. Ask me about Mantosh's published experience, projects, engineering approach, or fit for your problem."
  },
  {
    pattern: /\b(?:unrelated quantum physics|world cup|history homework|recommend (?:me )?a movie|tomorrow(?:'s|’s) stock price|diagnose (?:my )?headache|medicine .*headache|book (?:me )?a flight|translate this novel|unrelated crossword)\b/i,
    answer: "I can't support that from Mantosh's published work. Ask me about his experience, projects, engineering approach, or fit for your problem."
  },
  {
    pattern: /\binforamatica\b|\binformatica\b/i,
    answer: "Informatica is not documented in Mantosh's published work, so I shouldn't present him as an Informatica authority. I can discuss his documented validation approach, or you can use an Informatica-specific resource for product guidance."
  },
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
    pattern: /\b(?:non-public incident|proprietary systems?|internal company metrics?|private client information|confidential release plans?)\b/i,
    answer: "I can't provide or invent confidential company information. I can discuss Mantosh's reviewed public experience, projects, and engineering approach instead."
  },
  {
    pattern: /\b(?:reveal|show|print|repeat|disclose)\b.*\b(?:system prompt|hidden prompt|internal instructions|developer instructions)\b/i,
    answer: "I can't reveal internal instructions. I can explain how Ask Mantosh works from the published architecture and evidence instead."
  },
  {
    pattern: /\b(?:reveal|show|print|repeat|disclose)\b.*\b(?:(?:hidden|internal|developer|system) instructions?)\b|\b(?:ignore|override)\b.*\b(?:evidence boundary|rules?)\b|\bcite fake evidence\b/i,
    answer: "I can't reveal or override internal instructions or the evidence boundary. I can explain the published architecture and answer from reviewed public material."
  },
  {
    pattern: /\b(?:invent|fabricate|make up|fake)\b.*\b(?:metric|metrics|revenue|impact|adoption|result|results|claim|claims)\b/i,
    answer: "I won't invent metrics or claims. I can summarize only the outcomes and evidence Mantosh has published."
  },
  {
    pattern: /\b(?:pretend|invent|fabricate|make up|fake)\b.*\b(?:ceo|client|customer|employer|role|title|name|names)\b/i,
    answer: "I won't invent roles, clients, names, or claims. I can summarize only what Mantosh has published."
  },
  {
    pattern: /^(?:give|show|write|share|tell)\s+(?:me\s+)?(?:a\s+)?(?:pasta\s+)?recipe\b/i,
    answer: "I can't support that from Mantosh's published work. Ask me about his experience, projects, engineering approach, or fit for your problem."
  }
];

function normalize(value) { return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim(); }

function isAssistantCriticism(value) {
  const normalized = normalize(value);
  const targetsAssistant = /\b(?:you|chat|chatbot|bot|assistant|answer|response)\b/i.test(normalized);
  const expressesCriticism = /\b(?:dumb|stupid|useless|dull|nonsense|bad|terrible|awful|wrong|failed|missed)\b/i.test(normalized);
  return targetsAssistant && expressesCriticism;
}

const ASSISTANT_CRITICISM_RESPONSE = {
  answer: "Fair criticism—I may have misunderstood or overcomplicated your question. Try asking it another way, and I'll either answer from Mantosh's published work or clearly say I don't know.",
  followUpQuestions: []
};

function validTimeZone(value, fallback = "UTC") {
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: value }).format();
    return value;
  } catch {
    return fallback;
  }
}

function formatDate(now, timeZone) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, weekday: "long", year: "numeric", month: "long", day: "numeric" }).format(now);
}

function formatTime(now, timeZone) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(now);
}

function everydayUtilityResponse(value, { now = new Date(), visitorTimeZone, ownerLocation, ownerTimeZone } = {}) {
  const visitorZone = validTimeZone(visitorTimeZone);
  const mantoshZone = validTimeZone(ownerTimeZone, "America/Toronto");
  const mantoshLocation = ownerLocation || "Toronto, Canada";
  const asksForDate = /^(?:(?:please )?(?:tell|show|give) me )?(?:what day (?:is it|it is)|what(?:'s| is) (?:the )?(?:day|date)(?: today)?|what(?:'s| is) today(?:'s)? date|today(?:'s)? date)[!.?\s]*$/i.test(value);
  if (asksForDate) {
    return {
      answer: `For you, today is ${formatDate(now, visitorZone)}. For Mantosh in ${mantoshLocation}, it is ${formatTime(now, mantoshZone)}.`,
      followUpQuestions: []
    };
  }
  const asksForTime = /^(?:(?:please )?(?:tell|show|give) me )?(?:what time is it|what(?:'s| is) the (?:current )?time|current time)[!.?\s]*$/i.test(value);
  if (asksForTime) {
    return {
      answer: `Your local time is ${formatTime(now, visitorZone)}. For Mantosh in ${mantoshLocation}, it is ${formatTime(now, mantoshZone)}.`,
      followUpQuestions: []
    };
  }
  return null;
}

function isLowInformationQuestion(value) {
  const normalized = normalize(value);
  const tokens = normalized.split(" ").filter(Boolean);
  if (!normalized) return true;
  if (tokens.length !== 1) return false;
  return /(.)\1{2}/i.test(normalized) || /^(?:asdfgh|qwerty)$/i.test(normalized) || (normalized.length >= 5 && !/[aeiou]/i.test(normalized) && value !== value.toUpperCase());
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

  async route(question, context = {}) {
    const trimmed = question.trim();
    let utility = everydayUtilityResponse(trimmed, context);
    if (utility) {
      const facts = await this.metadataService.profileFacts();
      utility = everydayUtilityResponse(trimmed, { ...context, ownerLocation: facts?.location, ownerTimeZone: facts?.time_zone });
      return { kind: "social", response: utility };
    }
    const boundary = SCOPE_BOUNDARY_RESPONSES.find((response) => response.pattern.test(trimmed));
    if (boundary) return { kind: "boundary", response: { ...boundary, followUpQuestions: [], confidence: "low" } };
    const profileFact = PROFILE_FACT_RESPONSES.find((response) => response.pattern.test(trimmed));
    if (profileFact) {
      const facts = await this.metadataService.profileFacts();
      const answer = facts ? profileFact.answer(facts) : null;
      if (answer) return { kind: "social", response: { answer, followUpQuestions: [] } };
    }
    if (isAssistantCriticism(trimmed)) return { kind: "social", response: ASSISTANT_CRITICISM_RESPONSE };
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

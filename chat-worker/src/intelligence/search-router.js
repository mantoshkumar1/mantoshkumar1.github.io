const STATIC_DESTINATIONS = [
  { pattern: /^(?:show |open |go to )?(?:my )?resume\??$/i, label: "Resume", url: "/resume/", type: "resume" },
  { pattern: /^(?:show |open |go to )?contact\??$/i, label: "Contact", url: "/contact/", type: "contact" },
  { pattern: /^(?:show |open |go to )?(?:my )?experience(?: timeline)?\??$/i, label: "Experience", url: "/experience/", type: "experience" }
];

function normalize(value) { return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim(); }

export class SearchRouter {
  constructor(metadataService) { this.metadataService = metadataService; }

  async route(question) {
    const trimmed = question.trim();
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

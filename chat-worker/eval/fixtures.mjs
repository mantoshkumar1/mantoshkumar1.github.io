function fixture({ title, slug, category, path, url, content, summary, tags, answer }) {
  return Object.freeze({
    row: {
      chunk_id: `${slug}-evaluation-chunk`,
      title,
      slug,
      category,
      path,
      url,
      content,
      summary,
      tags: JSON.stringify(tags),
      related_topics: "[]"
    },
    answer
  });
}

export const PROFILE_FACT_FIXTURES = Object.freeze([
  ["location", "Toronto, Canada"],
  ["citizenship", "Canadian"],
  ["work_authorization", ["Canada", "United States", "India"]],
  ["current_employer", "Nokia"],
  ["current_role", "Staff Software Engineer"],
  ["employment_history", ["Aricent", "Cisco", "Intel", "Siemens", "KI Labs", "Nokia"]],
  ["experience_years", "More than 14 years"],
  ["target_roles", ["Staff Engineer", "Principal Engineer"]],
  ["capabilities", ["Platform engineering", "Engineering automation", "Backend systems", "Networking", "Distributed validation", "Operational intelligence"]],
  ["skills", ["Python", "Java", "C++", "SQL", "PostgreSQL", "Django", "REST APIs", "Linux", "Git", "CI/CD", "SDN", "NFV"]]
].map(([fact_key, fact_value]) => Object.freeze({ fact_key, fact_value: JSON.stringify(fact_value) })));

export const SOURCE_FIXTURES = Object.freeze({
  "about-mantosh": fixture({
    title: "About Mantosh and Where His Experience Can Help",
    slug: "about-mantosh",
    category: "faq",
    path: "knowledge/faq/about-mantosh.md",
    url: "/experience/",
    tags: ["platform-engineering", "automation", "backend-systems"],
    summary: "An evidence-backed professional profile.",
    content: "Mantosh has documented experience in platform engineering, automation, backend systems, networking, distributed validation, and operational intelligence. He focuses on reusable systems that reduce repeated engineering work.",
    answer: [
      "## In brief",
      "Mantosh's published work shows a systems-oriented engineer with documented experience in platform engineering, automation, backend systems, networking, and operational intelligence. [Faq: About Mantosh and Where His Experience Can Help](/experience/)",
      "## Best fit",
      "- Platform engineering foundations and reusable internal systems.",
      "- Automation that removes repeated engineering work.",
      "- Backend systems and operational intelligence.",
      "## Sources",
      "- [Faq: About Mantosh and Where His Experience Can Help](/experience/)"
    ].join("\n")
  }),
  "gate-cs-top-one-percent": fixture({
    title: "GATE CS & IT Top-1% Achievement and TUM Admission Context",
    slug: "gate-cs-top-one-percent",
    category: "experience",
    path: "knowledge/experience/gate-cs-top-one-percent.md",
    url: "/experience/#verified-highlights",
    tags: ["gate", "top-one-percent", "tum"],
    summary: "A résumé-backed GATE achievement and TUM admission context.",
    content: "Mantosh ranked in the top 0.76% among 156,780 candidates in India's GATE CS & IT examination in 2012 and the top 0.87% among 224,160 candidates in 2013. He says a GATE result formed part of his TUM admission journey, and his résumé confirms the completed M.Sc. degree.",
    answer: ""
  }),
  "photosahi": fixture({
    title: "PhotoSahi",
    slug: "photosahi",
    category: "project",
    path: "knowledge/projects/photosahi.md",
    url: "/projects/photosahi.html",
    tags: ["browser-side-processing", "privacy"],
    summary: "A privacy-first photo generator that processes images entirely in the browser.",
    content: "PhotoSahi processes sensitive photos in browser memory with HTML5 Canvas. It avoids a backend to reduce upload trust concerns, latency, operating cost, and unnecessary complexity.",
    answer: "## Answer\nPhotoSahi keeps each sensitive photo in the browser instead of sending it to a backend. That removes an external upload boundary while keeping crop, resize, preset, and download steps on the visitor's device. [Project: PhotoSahi](/projects/photosahi.html)"
  }),
  "gtt-price-calculator": fixture({
    title: "GTT Trigger Price Calculator",
    slug: "gtt-price-calculator",
    category: "project",
    path: "knowledge/projects/gtt-price-calculator.md",
    url: "/projects/gtt-price-calculator.html",
    tags: ["gtt-orders", "decision-support"],
    summary: "A helper for preparing candidate GTT values.",
    content: "The calculator prepares candidate buy and sell trigger prices. It does not connect to a broker, collect credentials, place trades, or retrieve live prices.",
    answer: "## Answer\nThe GTT calculator deliberately does not connect to a broker, collect credentials, place trades, or fetch live prices. It prepares candidate values for the visitor to verify before using them elsewhere. [Project: GTT Trigger Price Calculator](/projects/gtt-price-calculator.html)"
  }),
  "workflow-automation-toolkit": fixture({
    title: "Workflow Automation Toolkit",
    slug: "workflow-automation-toolkit",
    category: "project",
    path: "knowledge/projects/workflow-automation-toolkit.md",
    url: "/projects/workflow-automation-toolkit.html",
    tags: ["local-processing", "pdf-processing"],
    summary: "Local Python utilities for repetitive document workflows.",
    content: "The toolkit runs PDF and image processing on the user's local machine. Its documented workflows do not require an external upload service.",
    answer: "## Answer\nThe Workflow Automation Toolkit runs document processing on the user's local machine. PDFs and images pass through task-specific commands and shared helpers without requiring an external upload service. [Project: Workflow Automation Toolkit](/projects/workflow-automation-toolkit.html)"
  }),
  "engineering-knowledge-system": fixture({
    title: "Evidence-First Engineering Knowledge System",
    slug: "engineering-knowledge-system",
    category: "project",
    path: "knowledge/projects/engineering-knowledge-system.md",
    url: "/projects/engineering-knowledge-system.html",
    tags: ["retrieval-augmented-generation", "evidence-only"],
    summary: "A grounded engineering knowledge interface.",
    content: "Ask Mantosh retrieves reviewed public evidence before generation. When retrieval finds insufficient evidence, the Worker declines rather than answering from model memory. Citations are limited to approved source URLs.",
    answer: "## Answer\nAsk Mantosh retrieves reviewed public material before generation. If retrieval finds insufficient evidence, it declines instead of answering from model memory, and grounded responses can cite only approved source URLs. [Project: Evidence-First Engineering Knowledge System](/projects/engineering-knowledge-system.html) </response_mode> </response_mode>"
  }),
  "validation-platform-optical-networking": fixture({
    title: "Validation Platform and Release Intelligence",
    slug: "validation-platform-optical-networking",
    category: "project",
    path: "knowledge/projects/validation-platform-optical-networking.md",
    url: "/projects/validation-platform-optical-networking.html",
    tags: ["validation-infrastructure", "ai-assisted-analysis"],
    summary: "A public case study on reusable validation and release intelligence.",
    content: "AI-assisted tools organize failure evidence and surface patterns for engineering review. Root cause, build health, and release risk remain accountable engineering judgment.",
    answer: "## Answer\nAI-assisted tools organize failure evidence and surface patterns for review; they do not declare root cause or release health. Those conclusions remain accountable engineering judgment. [Project: Validation Platform and Release Intelligence](/projects/validation-platform-optical-networking.html)"
  }),
  "complexity-changes-address": fixture({
    title: "In Distributed Systems, Complexity Changes Address",
    slug: "complexity-changes-address",
    category: "article",
    path: "knowledge/articles/complexity-changes-address.md",
    url: "/insights/complexity-changes-address.html",
    tags: ["distributed-systems", "failure-paths"],
    summary: "A heuristic for tracking displaced complexity.",
    content: "An architectural simplification moves responsibility rather than deleting complexity. Engineers should record the displaced failure modes, detection signal, recovery path, and owner.",
    answer: "## Answer\nComplexity changes address means that a simplification moves responsibility somewhere else. The engineering task is to make the displaced failure modes, detection signals, recovery path, and ownership explicit. [Article: In Distributed Systems, Complexity Changes Address](/insights/complexity-changes-address.html)"
  }),
  "engineering-philosophy": fixture({
    title: "Engineering Philosophy: Build Leverage, Not Just Software",
    slug: "engineering-philosophy",
    category: "note",
    path: "knowledge/notes/engineering-philosophy.md",
    url: "/insights/engineering-philosophy.html",
    tags: ["automation", "platform-engineering"],
    summary: "An engineering philosophy for removing repeated work.",
    content: "Repeated human work is a signal to document, automate, make self-service, and eventually place the repeatable system in a platform when appropriate.",
    answer: "## Answer\nRepeated human work is an engineering smell when the same decision or operation can become a dependable, repeatable system. The progression is to document it, automate it, make it self-service, and place it in a platform when appropriate. [Note: Engineering Philosophy: Build Leverage, Not Just Software](/insights/engineering-philosophy.html)"
  }),
  "release-reports-as-operational-history": fixture({
    title: "Release Reports as Operational History",
    slug: "release-reports-as-operational-history",
    category: "note",
    path: "knowledge/notes/release-reports-as-operational-history.md",
    url: "/insights/release-reports-as-operational-history.html",
    tags: ["release-engineering", "operational-intelligence"],
    summary: "Why comparable release reports become operational history.",
    content: "Release reports become operational history when signal definitions stay stable enough to compare over time. The accumulated record can reveal recurring patterns and changing system behavior.",
    answer: "## Answer\nRelease reports become operational history when their signal definitions remain stable enough to be comparable over time. Read together, they expose recurring patterns and changes in system behavior that isolated snapshots cannot. [Note: Release Reports as Operational History](/insights/release-reports-as-operational-history.html)"
  })
});

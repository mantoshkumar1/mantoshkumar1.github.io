import { access, readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const pages = ["index.html", "projects/index.html", "thinking/index.html", "thinking/engineering-philosophy.html", "thinking/why-does-this-still-require-me.html", "thinking/release-reports-as-operational-history.html", "thinking/complexity-changes-address.html", "thinking/blockchain-without-a-master-branch.html", "thinking/ownership-before-escalation.html", "experience/index.html", "resume/index.html", "contact/index.html", "newsletter/index.html", "accessibility/index.html", "projects/engineering-knowledge-system.html", "projects/photosahi.html", "projects/workflow-automation-toolkit.html", "projects/gtt-price-calculator.html", "projects/validation-platform-optical-networking.html"];
const requirements = [
  [/<meta\s+charset=/i, "charset"], [/<meta\s+name=["']viewport["']/i, "viewport"], [/<meta\s+name=["']description["']/i, "description"],
  [/<link\s+rel=["']canonical["']/i, "canonical"], [/<meta\s+name=["']robots["']/i, "robots"], [/<meta\s+property=["']og:title["']/i, "Open Graph"],
  [/<meta\s+name=["']twitter:card["']/i, "Twitter Card"], [/<script\s+type=["']application\/ld\+json["']/i, "JSON-LD"], [/<main\b/i, "main landmark"]
];
let failures = 0;
const stylesheetVersions = new Map();
const widgetVersions = new Map();
for (const page of pages) {
  const html = await readFile(join(root, page), "utf8");
  for (const [pattern, name] of requirements) if (!pattern.test(html)) { console.error(`${page}: missing ${name}`); failures += 1; }
  if ((html.match(/<h1\b/gi) || []).length !== 1) { console.error(`${page}: requires exactly one h1`); failures += 1; }
  if (!/class=["'][^"']*logo[^"']*["'][^>]+aria-label=["']Mantosh Kumar — Home["']/i.test(html)) { console.error(`${page}: logo must provide an explicit home affordance`); failures += 1; }
  if (!/ask-mantosh-widget\.js/i.test(html)) { console.error(`${page}: missing shared Ask Mantosh launcher`); failures += 1; }
  if (/href=["']\.\.\/#systems["']/i.test(html)) { console.error(`${page}: Projects navigation must open the complete project catalog`); failures += 1; }
  if (/adapted from (?:a|the) public LinkedIn (?:post|reflection)/i.test(html)) { console.error(`${page}: LinkedIn provenance must identify Mantosh as the post author`); failures += 1; }
  if (/(?:All|Browse all|Inspect public) systems/i.test(html)) { console.error(`${page}: contains obsolete visitor-facing systems label`); failures += 1; }
  const version = /style\.css\?v=([\w-]+)/i.exec(html)?.[1];
  if (!version) { console.error(`${page}: missing versioned stylesheet`); failures += 1; }
  else stylesheetVersions.set(page, version);
  const widgetVersion = /ask-mantosh-widget\.js\?v=([\w-]+)/i.exec(html)?.[1];
  if (!widgetVersion) { console.error(`${page}: missing versioned Ask Mantosh widget`); failures += 1; }
  else widgetVersions.set(page, widgetVersion);
}
const notFoundHtml = await readFile(join(root, "404.html"), "utf8");
const notFoundVersion = /style\.css\?v=([\w-]+)/i.exec(notFoundHtml)?.[1];
if (!notFoundVersion) { console.error("404.html: missing versioned stylesheet"); failures += 1; }
else stylesheetVersions.set("404.html", notFoundVersion);
const notFoundWidgetVersion = /ask-mantosh-widget\.js\?v=([\w-]+)/i.exec(notFoundHtml)?.[1];
if (!notFoundWidgetVersion) { console.error("404.html: missing versioned Ask Mantosh widget"); failures += 1; }
else widgetVersions.set("404.html", notFoundWidgetVersion);
if (new Set(stylesheetVersions.values()).size !== 1) {
  console.error(`stylesheet cache versions differ: ${[...stylesheetVersions].map(([page, version]) => `${page}=${version}`).join(", ")}`);
  failures += 1;
}
if (new Set(widgetVersions.values()).size !== 1) {
  console.error(`Ask Mantosh widget cache versions differ: ${[...widgetVersions].map(([page, version]) => `${page}=${version}`).join(", ")}`);
  failures += 1;
}
for (const asset of ["favicon.svg", "favicon.ico", "assets/seo/social-default.jpg", "apple-touch-icon.png", "assets/icons/icon-192.png", "assets/icons/icon-512.png", "site.webmanifest", "sitemap.xml"]) {
  try { await access(join(root, asset)); } catch { console.error(`missing required asset: ${asset}`); failures += 1; }
}
try {
  const socialImage = await stat(join(root, "assets/seo/social-default.jpg"));
  if (socialImage.size > 200_000) { console.error("social preview image must remain below 200 KB"); failures += 1; }
} catch { /* Missing asset is reported above. */ }
const newsletterHtml = await readFile(join(root, "newsletter/index.html"), "utf8");
if (!/data-buttondown-status=["']active["']/i.test(newsletterHtml)) { console.error("newsletter: missing active Buttondown status"); failures += 1; }
if (!/action=["']https:\/\/buttondown\.com\/api\/emails\/embed-subscribe\/mantoshkumar["']/i.test(newsletterHtml)) { console.error("newsletter: missing Buttondown subscription endpoint"); failures += 1; }
if (!/<input[^>]+type=["']email["'][^>]+name=["']email["'][^>]+required/i.test(newsletterHtml)) { console.error("newsletter: email input must be named and required"); failures += 1; }
if (!/<input[^>]+type=["']hidden["'][^>]+name=["']embed["'][^>]+value=["']1["']/i.test(newsletterHtml)) { console.error("newsletter: missing Buttondown embed field"); failures += 1; }
if (/href=["'][^"']*feed\.xml["'][^>]*>\s*Follow via RSS/i.test(newsletterHtml)) { console.error("newsletter: RSS action must not open raw XML in the browser"); failures += 1; }
if (!/<button[^>]+id=["']copy-rss["'][^>]+type=["']button["'][^>]*>Copy RSS link<\/button>/i.test(newsletterHtml)) { console.error("newsletter: missing independent copy-RSS action"); failures += 1; }
if (!/id=["']copy-rss-status["'][^>]+role=["']status["'][^>]+aria-live=["']polite["']/i.test(newsletterHtml) || !/navigator\.clipboard\.writeText\(rssFeedUrl\)/.test(newsletterHtml)) { console.error("newsletter: RSS copy action needs accessible confirmation"); failures += 1; }
const stylesheet = await readFile(join(root, "assets/css/style.css"), "utf8");
if (/contain-intrinsic-size:\s*auto\s+720px/i.test(stylesheet) || /\.section\s*\{[^}]*content-visibility:\s*auto/is.test(stylesheet)) {
  console.error("stylesheet: homepage sections must not reserve synthetic off-screen height");
  failures += 1;
}
const homeHtml = await readFile(join(root, "index.html"), "utf8");
if (!/<h1 aria-label=["']Turn engineering friction into reusable systems\.["']>\s*<span class=["']hero-title-line["'][^>]*>Turn engineering<\/span>\s*<span class=["']hero-title-line["'][^>]*>friction<\/span>\s*<span class=["']hero-title-line["'][^>]*>into reusable systems\.<\/span>\s*<\/h1>/i.test(homeHtml)) { console.error("homepage: hero title must preserve its intentional three-line rhythm"); failures += 1; }
if (!/\.hero-title-line\s*\{[^}]*display:\s*block;[^}]*white-space:\s*nowrap/is.test(stylesheet)) { console.error("stylesheet: hero title lines must remain explicit and unbroken"); failures += 1; }
if (!/Aricent → Cisco → Intel → Siemens → KI Labs → Nokia/.test(homeHtml)) { console.error("homepage: career chronology is missing or out of order"); failures += 1; }
if (/Infinera|acquisition/i.test(homeHtml)) { console.error("homepage: obsolete employer-transition story must stay removed"); failures += 1; }
if (!/<strong>Staff Software Engineer<\/strong>\s*<span>Toronto<\/span>/.test(homeHtml)) { console.error("homepage: concise role and Toronto location signal is missing"); failures += 1; }
if (!/<strong>Canadian citizen<\/strong>\s*<span>Work authorization: Canada • United States • India<\/span>/.test(homeHtml)) { console.error("homepage: citizenship or work authorization signal is missing"); failures += 1; }
if (/14\+ years • Toronto, Canada • Canadian citizen/.test(homeHtml)) { console.error("homepage: identity summary must stay concise"); failures += 1; }
if (!/STAFF \/ PRINCIPAL ENGINEERING • PLATFORM &amp; AUTOMATION/.test(homeHtml)) { console.error("homepage: location-neutral Staff/Principal positioning is missing"); failures += 1; }
for (const region of ["india", "germany", "canada"]) {
  if (!new RegExp(`href=["']experience/#${region}["']`, "i").test(homeHtml)) { console.error(`homepage: ${region} experience card must link to its regional detail`); failures += 1; }
}
if (/View (?:India|Germany|Canada) experience/i.test(homeHtml)) { console.error("homepage: regional cards must not repeat verbose link labels"); failures += 1; }
if (/<span>Experience\s*<span[^>]*>→<\/span><\/span>/i.test(homeHtml)) { console.error("homepage: regional cards must not repeat a redundant Experience tag"); failures += 1; }
if (/class=["'][^"']*section-link[^"']*["'][^>]*>\s*View Experience/i.test(homeHtml)) { console.error("homepage: redundant View Experience link must stay removed"); failures += 1; }
if (!/href=["']projects\/["'][^>]*>View all projects/i.test(homeHtml)) { console.error("homepage: selected projects need a scalable route to the complete portfolio"); failures += 1; }
if (!/class=["']value-strip["']/i.test(homeHtml)) { console.error("homepage: staff impact summary strip is missing"); failures += 1; }
if (!/5 documented projects across platforms, automation, and applied engineering/.test(homeHtml)) { console.error("homepage: project evidence line is stale"); failures += 1; }
if (!/href=["']resume\/Resume-MantoshKumar-MSc-CS\.pdf["'][^>]*>View résumé PDF/i.test(homeHtml)) { console.error("homepage: recruiter-facing résumé action is missing"); failures += 1; }
const projectsHtml = await readFile(join(root, "projects/index.html"), "utf8");
const knowledgeSystemHtml = await readFile(join(root, "projects/engineering-knowledge-system.html"), "utf8");
const validationPlatformHtml = await readFile(join(root, "projects/validation-platform-optical-networking.html"), "utf8");
const validationPlatformKnowledge = await readFile(join(root, "knowledge/projects/validation-platform-optical-networking.md"), "utf8");
for (const [page, html, expectedCards] of [["index.html", homeHtml, 3], ["projects/index.html", projectsHtml, 5]]) {
  const projectCards = [...html.matchAll(/<article\b[^>]*class=["'][^"']*project-card[^"']*["'][^>]*>([\s\S]*?)<\/article>/gi)];
  if (projectCards.length !== expectedCards) { console.error(`${page}: expected ${expectedCards} fully clickable project cards, found ${projectCards.length}`); failures += 1; }
  for (const card of projectCards) {
    const detailLinks = card[1].match(/<a\b(?=[^>]*class=["'][^"']*project-detail-link[^"']*["'])(?=[^>]*href=["'](?!#)[^"']+["'])[^>]*>/gi) || [];
    if (detailLinks.length !== 1) { console.error(`${page}: every project card needs exactly one stretched detail-page link`); failures += 1; }
  }
}
if (!/<ol class=["']case-flow["'][^>]*aria-label=/i.test(validationPlatformHtml) || (validationPlatformHtml.match(/<li><span>[1-5]<\/span>/g) || []).length !== 5) { console.error("validation platform: architecture must present five accessible stages"); failures += 1; }
const validationPlatformPublicContent = `${validationPlatformHtml}\n${validationPlatformKnowledge}`;
if (/\bLLM\b|semi-annual|annual executive|weekly release-health|program leadership|pass, fail, unexecuted/i.test(validationPlatformPublicContent)) { console.error("validation platform: public case study exposes unsupported or internal specifics"); failures += 1; }
if (!/No improvement percentage, employer scale, adoption claim, or customer outcome is asserted/.test(validationPlatformHtml)) { console.error("validation platform: evidence boundary is missing"); failures += 1; }
if (!/\.project-detail-link::after\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*0;/is.test(stylesheet)) { console.error("stylesheet: project detail links must cover their complete card"); failures += 1; }
if (!/\.project-card \.card-links a:not\(\.project-detail-link\)\s*\{[^}]*position:\s*relative;[^}]*z-index:\s*1;/is.test(stylesheet)) { console.error("stylesheet: project secondary actions must remain independently clickable"); failures += 1; }
for (const [selector, lines] of [["\\.card-kicker", 2], ["h3", 2], ["> p:not\\(\\.card-kicker\\)", 3]]) {
  const clampPattern = new RegExp(`#systems \\.project-card ${selector}\\s*\\{[^}]*-webkit-line-clamp:\\s*${lines}`, "is");
  if (!clampPattern.test(stylesheet)) { console.error(`homepage: project ${selector} must be clamped to ${lines} lines`); failures += 1; }
}
if (!/#systems \.project-card \.tech\s*\{[^}]*flex-wrap:\s*nowrap/is.test(stylesheet) || !/#systems \.project-card \.tech span\s*\{[^}]*font-size:\s*\.68rem;[^}]*white-space:\s*nowrap/is.test(stylesheet)) {
  console.error("homepage: project technology tags must share one compact, single-line treatment");
  failures += 1;
}
for (const card of homeHtml.matchAll(/<article\b[^>]*class=["'][^"']*project-card[^"']*["'][^>]*>([\s\S]*?)<\/article>/gi)) {
  const content = card[1];
  const liveAction = content.search(/>Try (?:the )?live (?:system|product)/i);
  const caseStudyAction = content.search(/>See (?:architecture|decisions)/i);
  const sourceAction = content.search(/>Inspect the source/i);
  if (caseStudyAction < 0 || (liveAction >= 0 && liveAction > caseStudyAction) || (sourceAction >= 0 && sourceAction < caseStudyAction)) {
    console.error("homepage: project actions must be ordered live product, case study, then source");
    failures += 1;
  }
  if ((content.match(/<div class=["']tech["']>[\s\S]*?<span>/gi) || []).length !== 1 || (content.match(/<span>[^<]+<\/span>/gi) || []).length !== 3) {
    console.error("homepage: every selected project must present exactly three technology tags");
    failures += 1;
  }
}
for (const [page, html] of [["index.html", homeHtml], ["projects/index.html", projectsHtml]]) {
  if (!/href=["']#ask-mantosh["'][^>]*>Try the live system/i.test(html)) { console.error(`${page}: knowledge-system project must open its live Ask Mantosh experience`); failures += 1; }
}
if (!/href=["']#ask-mantosh["'][^>]*>Try Ask Mantosh/i.test(knowledgeSystemHtml)) { console.error("projects/engineering-knowledge-system.html: primary action must demonstrate Ask Mantosh instead of reloading the website"); failures += 1; }
const askMantoshClient = await readFile(join(root, "assets/js/main.js"), "utf8");
if (!/window\.location\.hash === ["']#ask-mantosh["']/.test(askMantoshClient) || !/a\[href=["']#ask-mantosh/.test(askMantoshClient)) { console.error("Ask Mantosh: live-system deep link must open the assistant on click and direct arrival"); failures += 1; }
const gttHtml = await readFile(join(root, "projects/gtt-price-calculator.html"), "utf8");
for (const [page, html] of [["projects/index.html", projectsHtml], ["projects/gtt-price-calculator.html", gttHtml]]) {
  if (!/href=["']https:\/\/gtt-calculator\.streamlit\.app\/["'][^>]*>[^<]*(?:Try|live product)/i.test(html)) { console.error(`${page}: GTT live product link is missing`); failures += 1; }
}
const photoSahiHtml = await readFile(join(root, "projects/photosahi.html"), "utf8");
if ((photoSahiHtml.match(/class=["'][^"']*flow-step[^"']*["']/gi) || []).length !== 4) { console.error("projects/photosahi.html: architecture must present four visitor-readable stages"); failures += 1; }
if (!/<ol class=["']architecture-flow["'][^>]*aria-label=/i.test(photoSahiHtml)) { console.error("projects/photosahi.html: architecture flow must use an accessible ordered sequence"); failures += 1; }
if (!/Your photo stays on this device/.test(photoSahiHtml) || !/image never needs to cross a network boundary/.test(photoSahiHtml)) { console.error("projects/photosahi.html: architecture must make the local privacy boundary explicit"); failures += 1; }
if ((photoSahiHtml.match(/href=["']https:\/\/mantoshkumar1\.github\.io\/photosahi\/["']/gi) || []).length !== 1) { console.error("projects/photosahi.html: live product action must appear exactly once"); failures += 1; }
const experienceHtml = await readFile(join(root, "experience/index.html"), "utf8");
if (!/Nokia • Staff Software Engineer/.test(experienceHtml)) { console.error("experience: current Nokia role is missing"); failures += 1; }
if (/Infinera|acquisition/i.test(experienceHtml)) { console.error("experience: obsolete employer-transition story must stay removed"); failures += 1; }
if (!/Top 1% nationally in GATE CS &amp; IT, twice/.test(experienceHtml) || !/Technical University of Munich/.test(experienceHtml)) { console.error("experience: concise GATE top-1% result and TUM education must remain visible"); failures += 1; }
if (/GATE is a prestigious national examination|About GATE/.test(experienceHtml)) { console.error("experience: detailed GATE context belongs in Ask Mantosh, not the scannable highlights list"); failures += 1; }
if (!/href=["']https:\/\/www\.linkedin\.com\/in\/mantoshk\/details\/recommendations\/["'][^>]*>Read the recommendations on LinkedIn/i.test(experienceHtml)) { console.error("experience: recommendation link must open the dedicated LinkedIn recommendations page"); failures += 1; }
if ((experienceHtml.match(/<blockquote class=["']reference-quote["']>/g) || []).length !== 2 || !/Mustafa Furkan Kaptan/.test(experienceHtml) || !/Itzhak Mordehay/.test(experienceHtml) || !/Short excerpts from public LinkedIn recommendations/.test(experienceHtml)) { console.error("experience: verified LinkedIn pull-quotes and attribution are missing"); failures += 1; }
for (const region of ["india", "germany", "canada"]) {
  if (!new RegExp(`id=["']${region}["']`, "i").test(experienceHtml)) { console.error(`experience: missing ${region} regional anchor`); failures += 1; }
}
const contactHtml = await readFile(join(root, "contact/index.html"), "utf8");
if (/senior or staff engineering role/i.test(contactHtml) || !/Staff or Principal Engineer role/.test(contactHtml)) { console.error("contact: Staff/Principal positioning is stale"); failures += 1; }
const resumeHtml = await readFile(join(root, "resume/index.html"), "utf8");
for (const [page, html] of [["index.html", homeHtml], ["contact/index.html", contactHtml], ["resume/index.html", resumeHtml]]) {
  if (/\b(?:Dubai|UAE|United Arab Emirates)\b/i.test(html)) { console.error(`${page}: public hiring copy must not expose private relocation targeting`); failures += 1; }
}
if (!/<strong>Canadian citizen<\/strong> • Work authorization: Canada • United States • India/.test(contactHtml)) { console.error("contact: citizenship or current work authorization is missing"); failures += 1; }
if (!/Toronto-based Canadian citizen/.test(resumeHtml) || !/Work authorization:<\/strong> Canada • United States • India/.test(resumeHtml)) { console.error("resume: citizenship or current work authorization is missing"); failures += 1; }
if (!/Top 1% nationally in GATE CS &amp; IT, twice/.test(resumeHtml) || !/href=["']\.\.\/experience\/#verified-highlights["'][^>]*>View full experience and capabilities/i.test(resumeHtml)) { console.error("resume: verified highlights and experience bridge are missing"); failures += 1; }
for (const page of ["index.html", "thinking/index.html"]) {
  const html = await readFile(join(root, page), "utf8");
  for (const card of html.matchAll(/<article\b[^>]*class=["'][^"']*insight-card[^"']*["'][^>]*>([\s\S]*?)<\/article>/gi)) {
    const links = card[1].match(/<a\b[^>]*href=/gi) || [];
    if (links.length !== 1) { console.error(`${page}: every full-card insight must have exactly one destination`); failures += 1; }
  }
}
for (const page of pages.filter((entry) => entry.startsWith("thinking/") && entry !== "thinking/index.html")) {
  const html = await readFile(join(root, page), "utf8");
  if (!/class=["'][^"']*page-shell[^"']*reading-shell[^"']*["']/i.test(html)) { console.error(`${page}: article needs compact reading-shell spacing`); failures += 1; }
  if (!/class=["'][^"']*case-study[^"']*reading-page[^"']*["']/i.test(html)) { console.error(`${page}: article needs compact reading-page spacing`); failures += 1; }
  if (!/href=["']\.\.\/newsletter\/["'][^>]*>Get new insights by email/i.test(html)) { console.error(`${page}: article needs a closing newsletter action`); failures += 1; }
}
if (failures) process.exit(1);
console.log(`SEO audit passed for ${pages.length} indexable pages.`);

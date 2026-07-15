import { access, readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const pages = ["index.html", "projects/index.html", "insights/index.html", "insights/engineering-philosophy.html", "insights/why-does-this-still-require-me.html", "insights/release-reports-as-operational-history.html", "insights/complexity-changes-address.html", "insights/blockchain-without-a-master-branch.html", "insights/ownership-before-escalation.html", "experience/index.html", "resume/index.html", "contact/index.html", "newsletter/index.html", "accessibility/index.html", "projects/engineering-knowledge-system.html", "projects/photosahi.html", "projects/workflow-automation-toolkit.html", "projects/gtt-price-calculator.html", "projects/validation-platform-optical-networking.html"];
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
  if (page.startsWith("projects/") && page !== "projects/index.html") {
    for (const button of html.match(/<a\b(?=[^>]*class=["'][^"']*button[^"']*["'])(?=[^>]*target=["']_blank["'])[^>]*>[\s\S]*?<\/a>/gi) || []) {
      if (!/<span\s+aria-hidden=["']true["']>↗<\/span>/i.test(button)) { console.error(`${page}: external project buttons need a visible destination arrow`); failures += 1; }
    }
  }
  if ((html.match(/<h1\b/gi) || []).length !== 1) { console.error(`${page}: requires exactly one h1`); failures += 1; }
  if (!/class=["'][^"']*logo[^"']*["'][^>]+aria-label=["']Mantosh Kumar — Home["']/i.test(html)) { console.error(`${page}: logo must provide an explicit home affordance`); failures += 1; }
  if (!/class=["'][^"']*nav-cta[^"']*["'][^>]*>Discuss a role<\/a>/i.test(html)) { console.error(`${page}: primary navigation needs the consistent Discuss a role CTA`); failures += 1; }
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
  const themeInitPosition = html.search(/theme-init\.js\?v=[\w-]+/i);
  const stylesheetPosition = html.search(/style\.css\?v=[\w-]+/i);
  if (themeInitPosition < 0 || stylesheetPosition < 0 || themeInitPosition > stylesheetPosition) { console.error(`${page}: early theme initialization must load before the stylesheet`); failures += 1; }
}
const notFoundHtml = await readFile(join(root, "404.html"), "utf8");
const notFoundVersion = /style\.css\?v=([\w-]+)/i.exec(notFoundHtml)?.[1];
if (!notFoundVersion) { console.error("404.html: missing versioned stylesheet"); failures += 1; }
else stylesheetVersions.set("404.html", notFoundVersion);
const notFoundWidgetVersion = /ask-mantosh-widget\.js\?v=([\w-]+)/i.exec(notFoundHtml)?.[1];
if (!notFoundWidgetVersion) { console.error("404.html: missing versioned Ask Mantosh widget"); failures += 1; }
else widgetVersions.set("404.html", notFoundWidgetVersion);
if (!/theme-init\.js\?v=[\w-]+/i.test(notFoundHtml) || notFoundHtml.search(/theme-init\.js/i) > notFoundHtml.search(/style\.css/i)) { console.error("404.html: early theme initialization must load before the stylesheet"); failures += 1; }
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
if (!/Free to join\. Unsubscribe anytime\./.test(newsletterHtml) || /Buttondown sends the confirmation email/.test(newsletterHtml)) { console.error("newsletter: subscription reassurance must stay concise and visitor-focused"); failures += 1; }
if (!/data-buttondown-status=["']active["']/i.test(newsletterHtml)) { console.error("newsletter: missing active Buttondown status"); failures += 1; }
if (/href=["']\.\.\/insights\/["'][^>]+aria-current=["']page["']/i.test(newsletterHtml)) { console.error("newsletter: Insights navigation must not claim the separate Newsletter page as current"); failures += 1; }
if (!/action=["']https:\/\/buttondown\.com\/api\/emails\/embed-subscribe\/mantoshkumar["']/i.test(newsletterHtml)) { console.error("newsletter: missing Buttondown subscription endpoint"); failures += 1; }
if (!/<input[^>]+type=["']email["'][^>]+name=["']email["'][^>]+required/i.test(newsletterHtml)) { console.error("newsletter: email input must be named and required"); failures += 1; }
if (!/<input[^>]+type=["']hidden["'][^>]+name=["']embed["'][^>]+value=["']1["']/i.test(newsletterHtml)) { console.error("newsletter: missing Buttondown embed field"); failures += 1; }
if (/<body[\s\S]*?(?:Copy RSS link|Follow via RSS|id=["']copy-rss["']|rssFeedUrl)/i.test(newsletterHtml)) { console.error("newsletter: visible RSS controls must not distract from email subscription"); failures += 1; }
if (!/<header[^>]+resume-header[^>]*>[\s\S]*class=["'][^"']*newsletter-context-link[^"']*["'][^>]+href=["']\.\.\/insights\/["'][^>]*>Read current insights/i.test(newsletterHtml) || /<div class=["']resume-actions["']>\s*<a[^>]+href=["']\.\.\/insights\//i.test(newsletterHtml)) { console.error("newsletter: current insights need a compact contextual link instead of a standalone action row"); failures += 1; }
const stylesheet = await readFile(join(root, "assets/css/style.css"), "utf8");
if (!/\.newsletter-assurance\s*\{[^}]*padding-inline-start:\s*1rem/is.test(stylesheet) || !/\.newsletter-context-link\s*\{[^}]*margin-top:\s*\.55rem/is.test(stylesheet)) { console.error("stylesheet: newsletter reassurance and context link must keep their compact alignment"); failures += 1; }
if (!/\.page-shell\s*\{[^}]*padding:\s*clamp\(1\.75rem,\s*3vw,\s*2\.5rem\)\s+0\s+clamp\(2\.25rem,\s*3\.5vw,\s*3\.25rem\)/is.test(stylesheet) || !/@media\s*\(max-width:\s*640px\)[\s\S]*?\.page-shell\s*\{[^}]*padding-block:\s*1\.25rem\s+1\.5rem/is.test(stylesheet)) {
  console.error("stylesheet: internal page shells must retain the compact responsive rhythm");
  failures += 1;
}
if (!/\.reading-page \.resume-section\s*\{[^}]*margin-top:\s*clamp\(\.9rem,\s*1\.6vw,\s*1\.2rem\);[^}]*padding-top:\s*clamp\(1rem,\s*1\.8vw,\s*1\.35rem\)/is.test(stylesheet)) {
  console.error("stylesheet: long-form articles must use compact but readable section transitions");
  failures += 1;
}
if (!/main\.project-shell\s*\{[^}]*padding-block:\s*clamp\(1\.75rem,\s*3vw,\s*2\.5rem\)\s+clamp\(2\.25rem,\s*3\.5vw,\s*3\.25rem\)/is.test(stylesheet) || !/main\.project-shell\s*>\s*\.container\s*>\s*\.section-block\s*\{[^}]*margin-top:\s*1rem/is.test(stylesheet)) {
  console.error("stylesheet: standalone project pages must share the compact internal-page rhythm");
  failures += 1;
}
if (!/\.contact-links a\s*\{[^}]*color:\s*var\(--primary\);/is.test(stylesheet) || /\.contact-links a\s*\{[^}]*color:\s*#b8d7ff/is.test(stylesheet)) {
  console.error("stylesheet: contact profile links must use the theme-aware accent color");
  failures += 1;
}
if (!/\.navbar nav:not\(\.mobile-nav-expanded\)\s*>\s*a\s*\{[^}]*display:\s*none/is.test(stylesheet) || /(?:^|\n)\s*nav:not\(\.mobile-nav-expanded\)\s*>\s*a\s*\{[^}]*display:\s*none/im.test(stylesheet)) {
  console.error("stylesheet: mobile link hiding must be scoped to the header navigation");
  failures += 1;
}
if (stylesheet.includes("\n  nav {\n    display: flex;\n    max-width:") || stylesheet.includes("\n  nav {\n    max-width:") || stylesheet.includes("\n  nav a {")) {
  console.error("stylesheet: responsive header sizing must not constrain content navigation");
  failures += 1;
}
if (/contain-intrinsic-size:\s*auto\s+720px/i.test(stylesheet) || /\.section\s*\{[^}]*content-visibility:\s*auto/is.test(stylesheet)) {
  console.error("stylesheet: homepage sections must not reserve synthetic off-screen height");
  failures += 1;
}
const homeHtml = await readFile(join(root, "index.html"), "utf8");
if (!/<h1 aria-label=["']Turn engineering friction into reusable systems["']>\s*<span class=["']hero-title-line["'][^>]*>Turn engineering<\/span>\s*<span class=["']hero-title-line["'][^>]*>friction<\/span>\s*<span class=["']hero-title-line["'][^>]*>into reusable systems<\/span>\s*<\/h1>/i.test(homeHtml)) { console.error("homepage: hero title must preserve its intentional three-line rhythm"); failures += 1; }
if (!/\.hero-title-line\s*\{[^}]*display:\s*block;[^}]*white-space:\s*nowrap/is.test(stylesheet)) { console.error("stylesheet: hero title lines must remain explicit and unbroken"); failures += 1; }
if (!/\.hero\s*\{[^}]*padding:\s*clamp\(3rem,\s*4\.5vw,\s*4rem\)\s+0\s+clamp\(\.75rem,\s*1\.5vw,\s*1\.25rem\)/is.test(stylesheet) || !/@media\s*\(max-width:\s*640px\)[\s\S]*?\.hero\s*\{[^}]*padding:\s*2rem\s+0\s+\.75rem/is.test(stylesheet)) { console.error("stylesheet: homepage hero must preserve the compact top rhythm across desktop and mobile"); failures += 1; }
if (!/\.hero::after\s*\{[^}]*pointer-events:\s*none;[^}]*animation:\s*hero-orb-breathe\s+11s/is.test(stylesheet) || !/@keyframes\s+hero-orb-breathe\s*\{[\s\S]*?opacity:[\s\S]*?transform:/is.test(stylesheet)) { console.error("stylesheet: hero orb needs a slow, non-interactive transform-and-opacity evolution"); failures += 1; }
if (!/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.hero::after\s*\{[^}]*animation:\s*none\s*!important/is.test(stylesheet) || !/html\[data-theme=["']contrast["']\]\s+\.hero::after\s*\{[^}]*display:\s*none/is.test(stylesheet)) { console.error("stylesheet: hero orb needs a static reduced-motion treatment and must be suppressed in contrast mode"); failures += 1; }
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
if (!/<div class=["']hero-buttons["']>[\s\S]*href=["']#systems["'][^>]*>See projects[\s\S]*href=["']experience\/["'][^>]*>View experience[\s\S]*href=["']contact\/["'][^>]*>Discuss a role[\s\S]*<\/div>/i.test(homeHtml)) { console.error("homepage: recruiter actions must lead to projects, experience, and role discussion"); failures += 1; }
if (/<div class=["']hero-buttons["']>[\s\S]*View résumé PDF[\s\S]*<\/div>/i.test(homeHtml)) { console.error("homepage: résumé PDF must not displace the Experience path in the primary recruiter actions"); failures += 1; }
const homeProjectPosition = homeHtml.indexOf('id="systems"');
const homeExperiencePosition = homeHtml.indexOf('id="experience"');
const homeInsightsPosition = homeHtml.indexOf('id="insights"');
if (!(homeProjectPosition >= 0 && homeExperiencePosition > homeProjectPosition && homeInsightsPosition > homeExperiencePosition)) { console.error("homepage: content must flow from projects to experience to supporting insights"); failures += 1; }
if (!/<div class=["']hero-buttons["']>[\s\S]*>Discuss a role[\s\S]*<\/div>\s*<nav class=["']hero-discovery["'][^>]*>[\s\S]*href=["']insights\/["'][^>]*>Read insights[\s\S]*href=["']newsletter\/["'][^>]*>Join the newsletter[\s\S]*<\/nav>/i.test(homeHtml)) { console.error("homepage: insights and newsletter need a visible secondary discovery row after recruiter actions"); failures += 1; }
if (!/\.hero-content\s*\{[^}]*width:\s*100%;[^}]*max-width:\s*900px/is.test(stylesheet)) { console.error("stylesheet: homepage hero content must use the available responsive width"); failures += 1; }
if (!/\.hero-discovery\s*\{[^}]*display:\s*flex;[^}]*margin-bottom:/is.test(stylesheet)) { console.error("stylesheet: homepage discovery links need a compact horizontal treatment"); failures += 1; }
if (!/#home\s*>\s*\.section\s*\{[^}]*padding-block:\s*clamp\(\.875rem,\s*1\.8vw,\s*1\.5rem\)/is.test(stylesheet) || !/@media\s*\(max-width:\s*640px\)[\s\S]*?#home\s*>\s*\.section\s*\{[^}]*padding-block:\s*\.75rem/is.test(stylesheet)) { console.error("stylesheet: homepage section transitions must remain compact across desktop and mobile"); failures += 1; }
if (!/@media\s*\(max-width:\s*640px\)[\s\S]*?\.hero-discovery\s*\{[^}]*width:\s*100%;[^}]*flex-wrap:\s*nowrap;[^}]*margin-bottom:\s*1\.25rem/is.test(stylesheet) || !/@media\s*\(max-width:\s*640px\)[\s\S]*?\.hero-discovery\s*>\s*span\s*\{[^}]*display:\s*none/is.test(stylesheet)) { console.error("stylesheet: mobile insight and newsletter links must share one compact row"); failures += 1; }
if (!/class=["'][^"']*insight-discovery-actions[^"']*["'][^>]*>[\s\S]*href=["']insights\/["'][^>]*>View all insights[\s\S]*href=["']newsletter\/["'][^>]*aria-label=["']Join the newsletter for new insights by email["'][^>]*>Join newsletter/i.test(homeHtml)) { console.error("homepage: closing insight actions need concise, explicit labels"); failures += 1; }
if (!/@media\s*\(max-width:\s*640px\)[\s\S]*?#home \.insight-discovery-actions\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);[^}]*gap:\s*\.65rem/is.test(stylesheet) || !/@media\s*\(max-width:\s*640px\)[\s\S]*?#home \.insight-discovery-actions \.section-link\s*\{[^}]*min-height:\s*44px/is.test(stylesheet)) { console.error("stylesheet: closing insight actions must remain one accessible mobile row"); failures += 1; }
if (!/@media\s*\(min-width:\s*641px\)\s*and\s*\(max-width:\s*939px\)[\s\S]*?#home #systems \.cards > \.project-card:last-child:nth-child\(odd\),[\s\S]*?#home #insights \.cards > \.insight-card:last-child:nth-child\(odd\)\s*\{[^}]*grid-column:\s*1\s*\/\s*-1/is.test(stylesheet)) { console.error("stylesheet: odd homepage project and insight cards must fill the intermediate two-column row"); failures += 1; }
const projectsHtml = await readFile(join(root, "projects/index.html"), "utf8");
const knowledgeSystemHtml = await readFile(join(root, "projects/engineering-knowledge-system.html"), "utf8");
const gttHtml = await readFile(join(root, "projects/gtt-price-calculator.html"), "utf8");
const validationPlatformHtml = await readFile(join(root, "projects/validation-platform-optical-networking.html"), "utf8");
const workflowToolkitHtml = await readFile(join(root, "projects/workflow-automation-toolkit.html"), "utf8");
const validationPlatformKnowledge = await readFile(join(root, "knowledge/projects/validation-platform-optical-networking.md"), "utf8");
if (!/<figure class=["']project-architecture["'][^>]*aria-labelledby=["']knowledge-architecture-caption["']/i.test(knowledgeSystemHtml) || !/<figcaption id=["']knowledge-architecture-caption["']/i.test(knowledgeSystemHtml)) { console.error("knowledge system: architecture must use an accessible figure and caption"); failures += 1; }
if ((knowledgeSystemHtml.match(/class=["']architecture-lane["']/gi) || []).length !== 2 || (knowledgeSystemHtml.match(/<ol class=["']architecture-steps["']/gi) || []).length !== 2 || (knowledgeSystemHtml.match(/<li><small>[^<]+<\/small><strong>[^<]+<\/strong><span>[^<]+<\/span><\/li>/gi) || []).length !== 10) { console.error("knowledge system: architecture must present two controlled five-step paths"); failures += 1; }
if ((knowledgeSystemHtml.match(/class=["']architecture-boundaries["']/gi) || []).length !== 1 || !/Public browser[\s\S]*GitHub control plane[\s\S]*Cloudflare runtime/i.test(knowledgeSystemHtml) || !/class=["']architecture-guardrail["'][\s\S]*No browser secret[\s\S]*No answer from model memory/i.test(knowledgeSystemHtml)) { console.error("knowledge system: architecture must make its trust and evidence boundaries explicit"); failures += 1; }
if (!/\.architecture-steps\s*\{[^}]*grid-template-columns:\s*repeat\(5,\s*minmax\(0,\s*1fr\)\)/is.test(stylesheet) || !/@media\s*\(max-width:\s*760px\)[\s\S]*?\.architecture-steps\s*\{[^}]*grid-template-columns:\s*1fr/is.test(stylesheet) || !/@media\s*\(max-width:\s*760px\)[\s\S]*?\.architecture-steps li\s*\{[^}]*grid-template-columns:\s*4rem\s+minmax\(0,\s*1fr\)/is.test(stylesheet)) { console.error("stylesheet: project architecture must remain readable across desktop and mobile"); failures += 1; }
if (!/<h1>Systems and tools I’ve built<\/h1>/.test(projectsHtml)) { console.error("projects: page title must describe the work plainly"); failures += 1; }
if (!/<div class=["']inline-cta["']>[\s\S]*<strong>Evaluating fit\?<\/strong>[\s\S]*href=["']\.\.\/experience\/["'][^>]*>View experience[\s\S]*href=["']\.\.\/contact\/["'][^>]*>Discuss a role or project/i.test(projectsHtml)) { console.error("projects: evaluating-fit CTA must offer Experience and contact without losing its current prompt"); failures += 1; }
for (const [page, html, expectedCards] of [["index.html", homeHtml, 3], ["projects/index.html", projectsHtml, 5]]) {
  const projectCards = [...html.matchAll(/<article\b[^>]*class=["'][^"']*project-card[^"']*["'][^>]*>([\s\S]*?)<\/article>/gi)];
  if (projectCards.length !== expectedCards) { console.error(`${page}: expected ${expectedCards} fully clickable project cards, found ${projectCards.length}`); failures += 1; }
  for (const card of projectCards) {
    const detailLinks = card[1].match(/<a\b(?=[^>]*class=["'][^"']*project-detail-link[^"']*["'])(?=[^>]*href=["'](?!#)[^"']+["'])[^>]*>/gi) || [];
    if (detailLinks.length !== 1) { console.error(`${page}: every project card needs exactly one stretched detail-page link`); failures += 1; }
  }
}
for (const [name, html, captionId, boundaryLabel, expectedSteps, requiredBoundary] of [
  ["GTT calculator", gttHtml, "gtt-architecture-caption", "GTT calculator boundaries", 5, /Broker remains separate[\s\S]*No credentials, live prices, account access, or trade execution/i],
  ["validation platform", validationPlatformHtml, "validation-architecture-caption", "Validation platform boundaries", 5, /Accountable judgment[\s\S]*Root cause, build health, and release risk remain engineering decisions/i],
  ["workflow toolkit", workflowToolkitHtml, "toolkit-architecture-caption", "Workflow Automation Toolkit boundaries", 5, /Local source files[\s\S]*Task-specific commands[\s\S]*Shared utility package/i],
]) {
  if (!new RegExp(`<figure class=["']project-architecture["'][^>]*aria-labelledby=["']${captionId}["']`, "i").test(html) || !new RegExp(`<figcaption id=["']${captionId}["']`, "i").test(html)) { console.error(`${name}: architecture must use an accessible figure and caption`); failures += 1; }
  if (!new RegExp(`<ul class=["']architecture-boundaries["'][^>]*aria-label=["']${boundaryLabel}["']`, "i").test(html) || !requiredBoundary.test(html)) { console.error(`${name}: architecture must state its system boundary plainly`); failures += 1; }
  if ((html.match(/<ol class=["']architecture-steps["']/gi) || []).length !== 1 || (html.match(/<li><small>/gi) || []).length !== expectedSteps) { console.error(`${name}: architecture must present one accessible five-step path`); failures += 1; }
  if (!/class=["']architecture-guardrail["']/.test(html)) { console.error(`${name}: architecture must retain its evidence or execution guardrail`); failures += 1; }
}
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
  if (liveAction >= 0 && sourceAction >= 0) {
    console.error("homepage: live project cards should defer source links to their detail pages");
    failures += 1;
  }
  if ((content.match(/<div class=["']tech["']>[\s\S]*?<span>/gi) || []).length !== 1 || (content.match(/<span>[^<]+<\/span>/gi) || []).length !== 3) {
    console.error("homepage: every selected project must present exactly three technology tags");
    failures += 1;
  }
}
for (const [page, html, repository] of [
  ["projects/engineering-knowledge-system.html", knowledgeSystemHtml, "https://github.com/mantoshkumar1/mantoshkumar1.github.io"],
  ["projects/photosahi.html", await readFile(join(root, "projects/photosahi.html"), "utf8"), "https://github.com/mantoshkumar1/photosahi"],
]) {
  if (!html.includes(`href="${repository}"`)) {
    console.error(`${page}: project detail page must retain its source repository`);
    failures += 1;
  }
}
for (const [page, html] of [["index.html", homeHtml], ["projects/index.html", projectsHtml]]) {
  if (!/href=["']#ask-mantosh["'][^>]*>Try the live system/i.test(html)) { console.error(`${page}: knowledge-system project must open its live Ask Mantosh experience`); failures += 1; }
}
if (!/href=["']#ask-mantosh["'][^>]*>Try Ask Mantosh/i.test(knowledgeSystemHtml)) { console.error("projects/engineering-knowledge-system.html: primary action must demonstrate Ask Mantosh instead of reloading the website"); failures += 1; }
const askMantoshClient = await readFile(join(root, "assets/js/main.js"), "utf8");
if (!/window\.location\.hash === ["']#ask-mantosh["']/.test(askMantoshClient) || !/a\[href=["']#ask-mantosh/.test(askMantoshClient)) { console.error("Ask Mantosh: live-system deep link must open the assistant on click and direct arrival"); failures += 1; }
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
if (!/Ranked in the top 1% in India’s GATE Computer Science &amp; IT examination/.test(experienceHtml) || !/Technical University of Munich/.test(experienceHtml)) { console.error("experience: concise GATE top-1% result and TUM education must remain visible"); failures += 1; }
if (!/<p class=["']eyebrow["']>Verified highlights<\/p>\s*<h2 id=["']verified-highlights["']>Education and recognition<\/h2>/i.test(experienceHtml)) { console.error("experience: verified highlights must follow the established eyebrow-and-heading hierarchy"); failures += 1; }
if (/<strong>Ranked in the top 1% in India’s GATE Computer Science &amp; IT examination<\/strong>/.test(experienceHtml)) { console.error("experience: GATE result should read as evidence without promotional emphasis"); failures += 1; }
if (/GATE is a prestigious national examination|About GATE/.test(experienceHtml)) { console.error("experience: detailed GATE context belongs in Ask Mantosh, not the scannable highlights list"); failures += 1; }
if (!/href=["']https:\/\/www\.linkedin\.com\/in\/mantoshk\/details\/recommendations\/["'][^>]*>Read the recommendations on LinkedIn/i.test(experienceHtml)) { console.error("experience: recommendation link must open the dedicated LinkedIn recommendations page"); failures += 1; }
if ((experienceHtml.match(/<blockquote class=["']reference-quote["']>/g) || []).length !== 2 || !/Mustafa Furkan Kaptan/.test(experienceHtml) || !/Itzhak Mordehay/.test(experienceHtml) || !/Short excerpts from public LinkedIn recommendations/.test(experienceHtml)) { console.error("experience: verified LinkedIn pull-quotes and attribution are missing"); failures += 1; }
if (!/\.reference-grid\s*\+\s*\.section-link\s*\{[^}]*margin-top:\s*0/is.test(stylesheet)) { console.error("experience: LinkedIn recommendation link must stay visually connected to its quote cards"); failures += 1; }
if (!/<section class=["']resume-section capability-section["'][\s\S]*?<h2 id=["']capabilities-title["']>How I help engineering teams<\/h2>[\s\S]*?<\/section>\s*<section class=["']resume-section skills-section["'][\s\S]*?<h2 id=["']technical-skills-title["']>Technical toolkit<\/h2>[\s\S]*?<div class=["']technical-toolkit["']/i.test(experienceHtml)) { console.error("experience: capabilities and technical skills must remain separate, ordered sections"); failures += 1; }
if (!/<div class=["']resume-actions["']>[\s\S]*href=["']\.\.\/resume\/["'][^>]*>View résumé[\s\S]*href=["']\.\.\/projects\/["'][^>]*>See projects[\s\S]*class=["']button primary["'][^>]*href=["']\.\.\/contact\/["'][^>]*>Discuss a role or project[\s\S]*<\/div>/i.test(experienceHtml)) { console.error("experience: closing actions must offer résumé, projects, and a primary role-or-project discussion"); failures += 1; }
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
if (!/Toronto-based Staff Software Engineer/.test(resumeHtml) || !/Work authorization:<\/strong> Canada • United States • India/.test(resumeHtml)) { console.error("resume: location, role, or current work authorization is missing"); failures += 1; }
if (!/Ranked in the top 1%<\/strong> in India’s GATE Computer Science &amp; IT examination/.test(resumeHtml) || !/href=["']\.\.\/experience\/#capabilities["'][^>]*>See how I help engineering teams/i.test(resumeHtml)) { console.error("resume: verified highlights or capabilities bridge is missing"); failures += 1; }
if (!/<strong>M\.Sc\. in Computer Science<\/strong>/.test(resumeHtml) || !/<strong>Two Intel Heroes of Tomorrow awards<\/strong>/.test(resumeHtml) || !/<strong>Ranked in the top 1%<\/strong>/.test(resumeHtml)) { console.error("resume: verified highlights must selectively emphasize the three recruiter-scannable achievements"); failures += 1; }
if (!/<h2[^>]*>Experience<\/h2>[\s\S]*?<h2[^>]*>Focus Areas<\/h2>[\s\S]*?<h2[^>]*id=["']resume-verified-highlights["'][^>]*>Verified highlights<\/h2>[\s\S]*?href=["']\.\.\/experience\/#capabilities["'][^>]*>See how I help engineering teams/i.test(resumeHtml)) { console.error("resume: recruiter scan must flow from experience to focus areas, verified highlights, and the capabilities bridge"); failures += 1; }
if ((resumeHtml.match(/<h2 class=["']resume-section-label["'][^>]*>/g) || []).length !== 3 || !/\.resume-section h2\.resume-section-label\s*\{[^}]*color:\s*var\(--primary\);[^}]*font-size:\s*0\.8rem;[^}]*text-transform:\s*uppercase/is.test(stylesheet)) { console.error("resume: Experience, Focus Areas, and Verified Highlights must use the compact blue section-label treatment"); failures += 1; }
if (!/class=["'][^"']*resume-card[^"']*resume-summary[^"']*["']/.test(resumeHtml) || !/\.resume-summary \.experience-evidence\s*\{[^}]*padding-top:\s*0/is.test(stylesheet)) { console.error("resume: Verified Highlights must not add padding beyond the standard compact section gap"); failures += 1; }
if (!/<section[^>]+class=["'][^"']*capability-section[^"']*["'][^>]+id=["']capabilities["']/i.test(experienceHtml) && !/<section[^>]+id=["']capabilities["'][^>]+class=["'][^"']*capability-section/i.test(experienceHtml)) { console.error("experience: capabilities section needs a stable resume-link anchor"); failures += 1; }
if (/<strong>Ranked in the top 1% in India’s GATE Computer Science &amp; IT examination<\/strong>/.test(resumeHtml)) { console.error("resume: GATE result should read as evidence without promotional emphasis"); failures += 1; }
const resumeResourceActions = resumeHtml.match(/<div class=["']resume-resource-actions["'][^>]*role=["']group["'][^>]*aria-label=["']Résumé resources["'][^>]*>([\s\S]*?)<\/div>/i)?.[1] || "";
if ((resumeResourceActions.match(/class=["'][^"']*resume-resource-link[^"']*["']/gi) || []).length !== 3 || !/>\s*<span>Download résumé<\/span>/i.test(resumeResourceActions) || !/>\s*<span>LinkedIn<\/span>/i.test(resumeResourceActions) || !/>\s*<span>GitHub<\/span>/i.test(resumeResourceActions)) {
  console.error("resume: PDF, LinkedIn, and GitHub must remain prominent resource actions");
  failures += 1;
}
for (const page of ["index.html", "insights/index.html"]) {
  const html = await readFile(join(root, page), "utf8");
  for (const card of html.matchAll(/<article\b[^>]*class=["'][^"']*insight-card[^"']*["'][^>]*>([\s\S]*?)<\/article>/gi)) {
    const links = card[1].match(/<a\b[^>]*href=/gi) || [];
    if (links.length !== 1) { console.error(`${page}: every full-card insight must have exactly one destination`); failures += 1; }
  }
}
const insightIndexHtml = await readFile(join(root, "insights/index.html"), "utf8");
if (!/Follow new engineering insights[\s\S]*Receive new evidence-backed notes by email\. Unsubscribe anytime\.[\s\S]*>Subscribe/i.test(insightIndexHtml) || /Choose email or RSS/i.test(insightIndexHtml)) { console.error("insights: visible subscription CTA must describe the email newsletter without presenting RSS as a user choice"); failures += 1; }
for (const page of pages.filter((entry) => entry.startsWith("projects/") && entry !== "projects/index.html")) {
  const html = await readFile(join(root, page), "utf8");
  if (!/<div class=["']inline-cta-actions["']>[\s\S]*href=["']\.\.\/experience\/["'][^>]*>View experience[\s\S]*href=["']\.\.\/contact\/["']/i.test(html)) { console.error(`${page}: closing project CTA must preserve contact context and add an explicit Experience path`); failures += 1; }
}
for (const page of pages.filter((entry) => entry.startsWith("insights/") && entry !== "insights/index.html")) {
  const html = await readFile(join(root, page), "utf8");
  if (!/class=["'][^"']*page-shell[^"']*reading-shell[^"']*["']/i.test(html)) { console.error(`${page}: article needs compact reading-shell spacing`); failures += 1; }
  if (!/class=["'][^"']*case-study[^"']*reading-page[^"']*["']/i.test(html)) { console.error(`${page}: article needs compact reading-page spacing`); failures += 1; }
  if (!/href=["']\.\.\/newsletter\/["'][^>]*>Get new insights by email/i.test(html)) { console.error(`${page}: article needs a closing newsletter action`); failures += 1; }
}
if (failures) process.exit(1);
console.log(`SEO audit passed for ${pages.length} indexable pages.`);

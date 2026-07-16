import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const criticalPages = [
  ["home", "/", "Turn engineering friction into reusable systems"],
  ["experience", "/experience/", "14+ years across engineering environments"],
  ["projects", "/projects/", "Systems and tools I’ve built"],
  ["migration case study", "/projects/legacy-validation-framework-migration.html", "Migrating a legacy framework"],
  ["resume", "/resume/", "Mantosh Kumar"],
  ["contact", "/contact/", "Discuss a Staff or Principal Engineer role"]
];

async function expectNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const offenders = overflow > 1 ? await page.evaluate(() => [...document.querySelectorAll("body *")]
    .filter((element) => {
      const bounds = element.getBoundingClientRect();
      return bounds.right > document.documentElement.clientWidth + 1 || bounds.left < -1;
    })
    .slice(0, 8)
    .map((element) => `${element.tagName.toLowerCase()}.${element.className || ""}(${(element.textContent || "").trim().slice(0, 45)})`)) : [];
  expect(overflow, `page must not overflow the viewport horizontally; offenders: ${offenders.join(", ")}`).toBeLessThanOrEqual(1);
}

async function expectMainBelowHeader(page) {
  const positions = await page.evaluate(() => {
    const header = document.querySelector(".navbar")?.getBoundingClientRect();
    const main = document.querySelector("main")?.getBoundingClientRect();
    return { headerBottom: header?.bottom ?? 0, mainTop: main?.top ?? 0 };
  });
  expect(positions.mainTop).toBeGreaterThanOrEqual(positions.headerBottom - 1);
}

async function assertNoSeriousAccessibilityViolations(page, context = "page") {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(result.violations, `${context}: ${JSON.stringify(result.violations, null, 2)}`).toEqual([]);
  const accessibleNameResult = await new AxeBuilder({ page })
    .withRules(["label-content-name-mismatch"])
    .analyze();
  expect(
    accessibleNameResult.violations,
    `${context} accessible names: ${JSON.stringify(accessibleNameResult.violations, null, 2)}`
  ).toEqual([]);
}

test("critical pages remain visible, bounded, accessible, and reviewable", async ({ page }, testInfo) => {
  for (const [name, route, heading] of criticalPages) {
    await page.goto(route);
    await expect(page.locator("h1")).toContainText(heading);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByRole("button", { name: "Ask Mantosh" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectMainBelowHeader(page);
    await assertNoSeriousAccessibilityViolations(page, `${name}-${testInfo.project.name}`);
    const screenshot = await page.screenshot({ fullPage: true, animations: "disabled" });
    await testInfo.attach(`${name}-${testInfo.project.name}`, { body: screenshot, contentType: "image/png" });
  }
});

test("appearance choices preserve the homepage hero and primary action", async ({ page }) => {
  await page.goto("/");
  for (const theme of ["light", "dark", "soft", "contrast"]) {
    await test.step(theme, async () => {
      await page.locator("#appearance-select").selectOption(theme);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      // Theme colors animate briefly. Audit the settled palette, not an
      // inaccessible-looking intermediate frame from the transition.
      await page.waitForTimeout(300);
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.getByRole("link", { name: /See projects/ })).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await assertNoSeriousAccessibilityViolations(page, `${theme}-${test.info().project.name}`);
    });
  }
});

test("recruiter path connects home, experience, projects, resume, and contact", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /View experience/ }).first().click();
  await expect(page).toHaveURL(/\/experience\/$/);
  await page.getByRole("link", { name: /See projects/ }).last().click();
  await expect(page).toHaveURL(/\/projects\/$/);
  await page.getByRole("link", { name: /View experience/ }).last().click();
  await expect(page).toHaveURL(/\/experience\/$/);
  await page.getByRole("link", { name: /View résumé/ }).last().click();
  await expect(page).toHaveURL(/\/resume\/$/);
  await page.getByRole("link", { name: /Discuss a role/ }).first().click();
  await expect(page).toHaveURL(/\/contact\/$/);
});

test("project and insight cards expose their primary detail destinations", async ({ page }) => {
  await page.goto("/projects/");
  const projects = page.locator(".project-card");
  await expect(projects).toHaveCount(6);
  const projectDestinations = [];
  for (let index = 0; index < await projects.count(); index += 1) {
    await expect(projects.nth(index).locator(".project-detail-link")).toHaveAttribute("href", /.+/);
    projectDestinations.push(await projects.nth(index).locator(".project-detail-link").getAttribute("href"));
  }
  for (const destination of projectDestinations) {
    await page.goto(`/projects/${destination}`);
    await expect(page.locator(".project-question")).toContainText("This page answers:");
    for (const heading of ["Problem", "Challenge", "My Contribution", "Outcome", "Evidence"]) {
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    }
    const decisions = page.locator(".engineering-decisions");
    await expect(decisions.getByRole("heading", { name: "Engineering Decisions" })).toBeVisible();
    expect(await decisions.locator("h3").count()).toBeGreaterThanOrEqual(3);
    const demonstrates = page.locator(".project-demonstrates");
    await expect(demonstrates.getByRole("heading", { name: "What This Project Demonstrates" })).toBeVisible();
    expect(await demonstrates.locator("h3").count()).toBeGreaterThanOrEqual(4);
    await expect(demonstrates.locator(".project-demonstrates-summary")).toBeVisible();
    await expect(page.locator(".project-reflection").getByRole("heading", { name: "Reflection" })).toBeVisible();
    expect(await page.locator(".project-evidence-list > div").count()).toBeGreaterThanOrEqual(2);
    const related = page.locator(".project-related");
    await expect(related.getByRole("heading", { name: "Continue Exploring" })).toBeVisible();
    await expect(related.locator("a")).toHaveCount(4);
    await expect(related).toContainText("Related Project");
    await expect(related).toContainText("Related Insight");
    await expect(related).toContainText("Engineering Principle");
    await expect(related).toContainText("Ask Mantosh");
  }
  await page.goto("/projects/");
  await projects.nth(1).locator(".project-detail-link").click();
  await expect(page).toHaveURL(/\/projects\/photosahi\.html$/);

  await page.goto("/insights/");
  const firstInsight = page.locator(".insight-card").first();
  const destination = await firstInsight.locator("a").getAttribute("href");
  await firstInsight.click();
  await expect(page).toHaveURL(new RegExp(destination.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$"));
});

test("newsletter validation and résumé resources save visitors from dead ends", async ({ page }) => {
  await page.goto("/newsletter/");
  await page.getByRole("button", { name: "Subscribe" }).click();
  await expect(page.locator("#newsletter-email")).toBeFocused();
  expect(await page.locator("#newsletter-email").evaluate((input) => input.validity.valueMissing)).toBe(true);
  await expect(page).toHaveURL(/\/newsletter\/$/);

  await page.goto("/resume/");
  await expect(page.getByRole("link", { name: /View résumé PDF/ })).toHaveAttribute("target", "_blank");
  await expect(page.getByRole("link", { name: /Download résumé/ })).toHaveAttribute("download", "");
  await expect(page.getByRole("link", { name: /^LinkedIn/ })).toHaveAttribute("href", "https://www.linkedin.com/in/mantoshk/");
});

test("contact offers a working copy-email fallback", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/contact/");
  await page.getByRole("button", { name: "Copy email" }).click();
  await expect(page.locator("#copy-email-status")).toContainText("mantoshk234@gmail.com");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("mantoshk234@gmail.com");
});

test("Ask Mantosh opens with a compact, portfolio-wide welcome state", async ({ page }) => {
  let submittedQuestion = "";
  let submittedAudience = "";
  await page.route("https://ask-mantosh.mantoshk234.workers.dev/**", async (route) => {
    const request = JSON.parse(route.request().postData());
    submittedQuestion = request.question;
    submittedAudience = request.audience;
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        answer: "A concise evidence-backed answer.",
        sources: [{ label: "Project: Validation Platform", title: "Validation Platform", category: "project", url: "/projects/validation-platform-optical-networking.html", summary: "Published project documentation." }],
        recommendations: [{ title: "Migration Case Study", category: "project", url: "/projects/legacy-validation-framework-migration.html" }, { title: "Engineering experience", category: "experience", url: "/experience/" }],
        followUpQuestions: ["How was cutover validated?", "What changed after migration?"],
        confidence: "high", success: true
      })
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Ask Mantosh" }).click();

  const panel = page.locator("#ask-mantosh-panel");
  await expect(panel.getByRole("heading", { name: "Ask Mantosh" })).toBeVisible();
  await expect(panel.getByText("Ask about my projects, engineering decisions, automation, distributed systems, and experience.", { exact: true })).toBeVisible();
  await expect(panel.getByText("Grounded in published projects, case studies, and engineering notes.", { exact: true })).toBeVisible();
  await expect(panel.getByText("Published Engineering Knowledge", { exact: true })).toHaveCount(0);
  await expect(panel.getByText("Explore the evidence behind the work.", { exact: true })).toHaveCount(0);
  await expect(panel.locator(".ask-mantosh-chip")).toHaveCount(3);
  await expect(panel.getByText("Who are you?", { exact: true })).toBeVisible();
  await expect(panel.locator(".ask-mantosh-audience-chip")).toHaveCount(4);
  await expect(panel.locator("#ask-mantosh-input")).toHaveAttribute("placeholder", "Ask about my work...");

  await panel.getByRole("button", { name: "Engineer", exact: true }).click();
  await expect(panel.getByRole("button", { name: "Audience: Engineer" })).toBeVisible();
  await expect(panel.locator("#ask-mantosh-audience-selector")).toBeHidden();

  const firstQuestion = await panel.locator(".ask-mantosh-suggestions .ask-mantosh-chip").first().textContent();
  await panel.locator(".ask-mantosh-suggestions .ask-mantosh-chip").first().click();
  await expect.poll(() => submittedQuestion).toBe(firstQuestion);
  await expect.poll(() => submittedAudience).toBe("engineer");
  await expect(panel.locator(".ask-mantosh-message.user")).toContainText(submittedQuestion);
  const answer = panel.locator(".ask-mantosh-message.assistant");
  await expect(answer.getByRole("heading", { name: "Related reading" })).toBeVisible();
  await expect(answer.locator(".ask-mantosh-reading-link")).toHaveCount(4);
  await expect(answer.getByRole("heading", { name: "Suggested follow-up" })).toBeVisible();
  await expect(answer.getByRole("button", { name: "How was cutover validated?" })).toBeVisible();
  await expect(answer.getByRole("heading", { name: "Grounded in" })).toBeVisible();
  await expect(answer.locator(".ask-mantosh-source")).toContainText("Project: Validation Platform");
  await answer.getByRole("button", { name: "How was cutover validated?" }).click();
  await expect.poll(() => submittedQuestion).toBe("How was cutover validated?");
  await expect(panel.locator(".ask-mantosh-message.user").last()).toContainText("How was cutover validated?");
});

test("Ask Mantosh prioritizes page-specific questions on project pages", async ({ page }) => {
  await page.goto("/projects/photosahi.html");
  await page.getByRole("button", { name: "Ask Mantosh" }).click();
  const suggestions = page.locator(".ask-mantosh-suggestions .ask-mantosh-chip");
  await expect(suggestions).toHaveText([
    "Why was PhotoSahi built without a backend?",
    "How does PhotoSahi protect privacy?",
    "How does browser-side image processing work?"
  ]);
});

test("Ask Mantosh preserves minimized history, exports it, and clears deliberately", async ({ page }) => {
  const longAnswer = `Opening Newsletter.\n\n${Array.from({ length: 18 }, (_, index) => `Paragraph ${index + 1} explains a published engineering lesson with enough detail to require scrolling.`).join("\n\n")}`;
  await page.route("https://ask-mantosh.mantoshk234.workers.dev/**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        answer: longAnswer, sources: [], followUpQuestions: [], suggestedQuestions: [], confidence: "high",
        action: { type: "navigate", destinationType: "newsletter", label: "Newsletter", url: "/newsletter/" }, success: true
      })
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Ask Mantosh" }).click();
  await page.getByRole("button", { name: "Recruiter", exact: true }).click();
  await page.locator("#ask-mantosh-input").fill("How do I subscribe?");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.locator(".ask-mantosh-message.assistant")).toContainText("Opening Newsletter");
  await expect.poll(() => page.locator(".ask-mantosh-message.assistant").evaluate((answer) => {
    const messages = answer.closest(".ask-mantosh-messages");
    return Math.abs(answer.getBoundingClientRect().top - messages.getBoundingClientRect().top);
  })).toBeLessThanOrEqual(8);

  await page.getByRole("button", { name: /Minimize Ask Mantosh/ }).click();
  await expect(page.locator("#ask-mantosh-panel")).toBeHidden();
  await page.getByRole("button", { name: "Ask Mantosh" }).click();
  await expect(page.locator(".ask-mantosh-message.user")).toContainText("How do I subscribe?");
  await expect(page.getByRole("button", { name: "Audience: Recruiter" })).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Export conversation/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^ask-mantosh-conversation-\d{4}-\d{2}-\d{2}\.txt$/);

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: /Close Ask Mantosh and clear/ }).click();
  await expect(page.locator("#ask-mantosh-panel")).toBeHidden();
  await page.getByRole("button", { name: "Ask Mantosh" }).click();
  await expect(page.locator(".ask-mantosh-empty")).toBeVisible();
  await expect(page.getByText("Who are you?", { exact: true })).toBeVisible();
  await expect(page.locator(".ask-mantosh-message")).toHaveCount(0);
});

test("Ask Mantosh errors remain readable in every appearance mode", async ({ page }) => {
  await page.route("https://ask-mantosh.mantoshk234.workers.dev/**", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ success: false, error: { code: "invalid_model_response", message: "The AI service returned an invalid response." } })
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Ask Mantosh" }).click();
  await page.getByRole("button", { name: "Student", exact: true }).click();
  await page.locator("#ask-mantosh-input").fill("What are the hobbies of Mantosh?");
  await page.getByRole("button", { name: "Send message" }).click();

  const error = page.locator(".ask-mantosh-error");
  const userLabel = page.locator(".ask-mantosh-message.user header > span");
  await expect(error).toContainText("The AI service returned an invalid response.");
  await expect(error.getByRole("button", { name: "Try again" })).toBeVisible();
  for (const theme of ["light", "dark", "soft", "contrast"]) {
    await page.locator("#appearance-select").selectOption(theme);
    await page.waitForTimeout(300);
    await expect(error).toBeVisible();
    if (theme === "light") await expect(userLabel).toHaveCSS("color", "rgb(7, 95, 189)");
    if (theme === "soft") await expect(userLabel).toHaveCSS("color", "rgb(138, 75, 22)");
    await assertNoSeriousAccessibilityViolations(page, `Ask Mantosh error-${theme}-${test.info().project.name}`);
  }
});

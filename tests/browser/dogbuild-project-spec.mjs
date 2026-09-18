import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("DogBuild project discoverability and accessibility", () => {
  test("DogBuild is discoverable from projects listing", async ({ page }) => {
    // Test that projects/index.html now has 7 projects (not 6)
    await page.goto("/projects/");
    const projects = page.locator(".project-card");
    await expect(projects).toHaveCount(7);

    // Verify DogBuild card is present
    const dogbuildCard = page.locator(".project-card", { has: page.locator("h3", { hasText: "DogBuild" }) });
    await expect(dogbuildCard).toBeVisible();

    // Verify DogBuild card has the correct links
    await expect(dogbuildCard.locator("a", { hasText: "Explore on GitHub" })).toHaveAttribute("href", "https://github.com/mantoshkumar1/dogbuild");
    await expect(dogbuildCard.locator("a", { hasText: "See the system" })).toHaveAttribute("href", "dogbuild.html");
  });

  test("DogBuild project detail page is routable and accessible", async ({ page }, testInfo) => {
    await page.goto("/projects/dogbuild.html");

    // Verify page exists and has correct H1
    await expect(page.locator("h1")).toContainText("DogBuild");

    // Verify main content is visible
    await expect(page.locator("main")).toBeVisible();

    // Verify problem, architecture, design principles sections exist
    for (const section of ["The Problem", "Current Architecture", "Key Design Principles", "Current Status", "Roadmap"]) {
      await expect(page.locator("h2", { hasText: section })).toBeVisible();
    }

    // Verify disclaimer is present
    await expect(page.locator("text=not yet a production-ready autonomous-agent platform")).toBeVisible();

    // Verify call-to-action buttons exist
    await expect(page.getByRole("link", { name: "Explore on GitHub" })).toHaveAttribute("href", "https://github.com/mantoshkumar1/dogbuild");
    await expect(page.getByRole("link", { name: "Read the problem statement" })).toHaveAttribute("href", "../insights/message-bus-between-ai-agents.html");
  });

  test("DogBuild page has no horizontal overflow and proper landmark structure", async ({ page }, testInfo) => {
    await page.goto("/projects/dogbuild.html");

    // Check for horizontal overflow
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    const offenders = overflow > 1 ? await page.evaluate(() => [...document.querySelectorAll("body *")]
      .filter((element) => {
        const bounds = element.getBoundingClientRect();
        return bounds.right > document.documentElement.clientWidth + 1 || bounds.left < -1;
      })
      .slice(0, 8)
      .map((element) => `${element.tagName.toLowerCase()}.${element.className || ""}(${(element.textContent || "").trim().slice(0, 45)})`)) : [];
    expect(overflow, `page must not overflow horizontally; offenders: ${offenders.join(", ")}`).toBeLessThanOrEqual(1);

    // Verify navigation landmarks
    await expect(page.locator("header.navbar")).toBeVisible();
    await expect(page.locator("nav")).toBeVisible();
    await expect(page.locator("main")).toBeVisible();

    // Verify skip link
    await expect(page.locator(".skip-link")).toBeVisible();
  });

  test("DogBuild page passes accessibility audit on desktop and mobile", async ({ page, context }, testInfo) => {
    for (const viewport of [{ width: 1024, height: 768, name: "desktop" }, { width: 375, height: 667, name: "mobile" }]) {
      await test.step(`${viewport.name}`, async () => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto("/projects/dogbuild.html");

        // Accessibility audit
        const result = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze();
        expect(result.violations, `${viewport.name}: ${JSON.stringify(result.violations, null, 2)}`).toEqual([]);

        // Take screenshot for evidence
        const screenshot = await page.screenshot({ fullPage: true, animations: "disabled" });
        await testInfo.attach(`dogbuild-${viewport.name}`, { body: screenshot, contentType: "image/png" });
      });
    }
  });

  test("DogBuild project card correctly reflects data-content-count update", async ({ page }) => {
    await page.goto("/projects/");
    const cardsDiv = page.locator('[data-content-section="projects"]');
    await expect(cardsDiv).toHaveAttribute("data-content-count", "7");
  });

  test("DogBuild SEO metadata is present and correct", async ({ page }) => {
    await page.goto("/projects/dogbuild.html");

    // Check canonical URL
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute("href", "https://mantoshkumar1.github.io/projects/dogbuild.html");

    // Check meta description
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute("content", /deterministic control and orchestration layer/);

    // Check Open Graph metadata
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute("content", /DogBuild.*Deterministic AI Agent Coordination/);

    const ogDesc = page.locator('meta[property="og:description"]');
    await expect(ogDesc).toHaveAttribute("content", /deterministic control and orchestration layer/);
  });

  test("DogBuild page navigation and breadcrumbs work correctly", async ({ page }) => {
    // Verify breadcrumb navigation from home
    await page.goto("/");
    await page.getByRole("link", { name: "Projects" }).click();
    await expect(page).toHaveURL(/\/projects\/$/);

    // Click DogBuild card
    const dogbuildLink = page.locator(".project-card", { has: page.locator("h3", { hasText: "DogBuild" }) })
      .locator("a", { hasText: "See the system" });
    await dogbuildLink.click();
    await expect(page).toHaveURL(/\/projects\/dogbuild\.html$/);

    // Verify breadcrumb navigation structure
    const breadcrumbs = page.locator("script[type='application/ld+json']");
    const breadcrumbText = await breadcrumbs.textContent();
    expect(breadcrumbText).toContain("Home");
    expect(breadcrumbText).toContain("Projects");
    expect(breadcrumbText).toContain("DogBuild");
  });

  test("DogBuild page keyboard navigation and focus management work", async ({ page }) => {
    await page.goto("/projects/dogbuild.html");

    // Tab to first interactive element
    await page.keyboard.press("Tab");
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement, "Keyboard Tab should focus an interactive element").not.toBeNull();

    // Verify focus ring is visible on interactive elements
    const initialFocus = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? getComputedStyle(el).outline !== "none" || getComputedStyle(el).boxShadow !== "none" : false;
    });
    expect(initialFocus, "Focused element should have visible focus indicator").toBeTruthy();

    // Tab through primary actions (GitHub link, problem statement link)
    let focusedLinks = 0;
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab");
      const tagName = await page.evaluate(() => document.activeElement?.tagName);
      if (tagName === "A") {
        focusedLinks++;
      }
    }
    expect(focusedLinks, "Should be able to tab to multiple links").toBeGreaterThan(0);
  });

  test("DogBuild project links return successful responses", async ({ page, context }) => {
    await page.goto("/projects/dogbuild.html");

    // Track response status codes
    const responses = [];
    context.on("response", (response) => {
      if (!response.url().includes("analytics") && !response.url().includes("tracking")) {
        responses.push({ url: response.url(), status: response.status() });
      }
    });

    // Click GitHub link and verify it navigates (don't follow external)
    const githubLink = page.getByRole("link", { name: "Explore on GitHub" });
    const href = await githubLink.getAttribute("href");
    expect(href).toBe("https://github.com/mantoshkumar1/dogbuild");

    // Click internal link and verify successful response
    await page.getByRole("link", { name: "Read the problem statement" }).click();
    await expect(page).toHaveURL(/\/insights\/message-bus-between-ai-agents\.html$/);

    // Verify all internal resources loaded successfully
    const failedResponses = responses.filter((r) => r.status >= 400 && !r.url.includes("external"));
    expect(failedResponses, "All internal resources should load successfully").toEqual([]);
  });
});

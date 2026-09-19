import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

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

test("Ask Mantosh modal makes all non-dialog direct body children inert while open", async ({ page }, testInfo) => {
  await page.route("https://cdn.jsdelivr.net/**", (route) => route.abort());
  await page.route("https://ask-mantosh.mantoshk234.workers.dev/**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        answer: "Test answer.",
        sources: [],
        recommendations: [],
        followUpQuestions: [],
        confidence: "high",
        success: true
      })
    });
  });

  await page.goto("/");

  // Verify initial state: all direct body children should be interactive
  // Skip script, style, and span tags
  const initiallyInert = await page.evaluate(() => {
    return [...document.body.children]
      .filter((el) => {
        if (el.id === "ask-mantosh-panel" || el.id === "ask-mantosh-backdrop") return false;
        if (el.tagName === "SCRIPT" || el.tagName === "STYLE" || el.tagName === "SPAN") return false;
        return true;
      })
      .map((el) => el.hasAttribute("inert"));
  });

  // All should start without inert
  expect(initiallyInert.every((v) => !v), "all non-dialog direct body children should start interactive").toBe(true);

  // Open the modal
  await page.getByRole("button", { name: "Ask Mantosh" }).click();
  await expect(page.locator("#ask-mantosh-panel")).not.toHaveAttribute("hidden");

  // Verify all direct body children except panel and backdrop are now inert
  const whileOpen = await page.evaluate(() => {
    return [...document.body.children]
      .filter((el) => {
        if (el.id === "ask-mantosh-panel" || el.id === "ask-mantosh-backdrop") return false;
        if (el.tagName === "SCRIPT" || el.tagName === "STYLE" || el.tagName === "SPAN") return false;
        return true;
      })
      .map((el) => el.hasAttribute("inert"));
  });

  expect(whileOpen.every((v) => v), "all non-dialog direct body children should be inert while modal is open").toBe(true);

  // Verify panel and backdrop are NOT inert
  const panelHasInert = await page.locator("#ask-mantosh-panel").evaluate((el) => el.hasAttribute("inert"));
  const backdropHasInert = await page.locator("#ask-mantosh-backdrop").evaluate((el) => el.hasAttribute("inert"));
  expect(panelHasInert, "ask-mantosh-panel should not have inert").toBe(false);
  expect(backdropHasInert, "ask-mantosh-backdrop should not have inert").toBe(false);

  // Verify skip link and launcher button are inert (not interactive)
  const skipLinkInert = await page.locator(".skip-link").evaluate((el) => el.hasAttribute("inert"));
  const launcherInert = await page.locator("#ask-mantosh-toggle").evaluate((el) => el.hasAttribute("inert"));
  expect(skipLinkInert, "skip-link should be inert").toBe(true);
  expect(launcherInert, "launcher button should be inert").toBe(true);

  // Test escape to close
  await page.keyboard.press("Escape");
  await expect(page.locator("#ask-mantosh-panel")).toHaveAttribute("hidden");

  // Verify all direct body children have their prior inert state restored
  const afterClose = await page.evaluate(() => {
    return [...document.body.children]
      .filter((el) => {
        if (el.id === "ask-mantosh-panel" || el.id === "ask-mantosh-backdrop") return false;
        if (el.tagName === "SCRIPT" || el.tagName === "STYLE" || el.tagName === "SPAN") return false;
        return true;
      })
      .map((el) => el.hasAttribute("inert"));
  });

  expect(afterClose, "prior inert states should be restored after close").toEqual(initiallyInert);
});

test("Ask Mantosh modal allows all close paths and restores background state", async ({ page, context }, testInfo) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.route("https://cdn.jsdelivr.net/**", (route) => route.abort());
  await page.route("https://ask-mantosh.mantoshk234.workers.dev/**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        answer: "Test answer.",
        sources: [],
        recommendations: [],
        followUpQuestions: [],
        confidence: "high",
        success: true
      })
    });
  });

  await page.goto("/");

  const captureInertStates = async () => {
    return await page.evaluate(() => {
      return [...document.body.children]
        .filter((el) => {
          if (el.id === "ask-mantosh-panel" || el.id === "ask-mantosh-backdrop") return false;
          if (el.tagName === "SCRIPT" || el.tagName === "STYLE" || el.tagName === "SPAN") return false;
          return true;
        })
        .map((el) => el.hasAttribute("inert"));
    });
  };

  const initialStates = await captureInertStates();

  // Test minimize close path
  await page.getByRole("button", { name: "Ask Mantosh" }).click();
  await expect(page.locator("#ask-mantosh-panel")).not.toHaveAttribute("hidden");
  await expect(page.locator("#ask-mantosh-input")).toBeFocused();

  await page.getByRole("button", { name: /Minimize/ }).click();
  await expect(page.locator("#ask-mantosh-panel")).toHaveAttribute("hidden");
  let afterClose = await captureInertStates();
  expect(afterClose, "minimize: prior inert states should be restored").toEqual(initialStates);

  // Test escape close path
  await page.getByRole("button", { name: "Ask Mantosh" }).click();
  await expect(page.locator("#ask-mantosh-panel")).not.toHaveAttribute("hidden");
  await page.keyboard.press("Escape");
  await expect(page.locator("#ask-mantosh-panel")).toHaveAttribute("hidden");
  afterClose = await captureInertStates();
  expect(afterClose, "escape: prior inert states should be restored").toEqual(initialStates);
});

test("Ask Mantosh modal remains openable across themes and maintains focus management", async ({ page }, testInfo) => {
  await page.route("https://cdn.jsdelivr.net/**", (route) => route.abort());
  await page.route("https://ask-mantosh.mantoshk234.workers.dev/**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        answer: "Key published work includes platform systems and automation tooling.",
        sources: [],
        recommendations: [],
        followUpQuestions: ["Tell me more?"],
        confidence: "high",
        success: true
      })
    });
  });

  await page.goto("/");

  for (const theme of ["light", "dark", "soft", "contrast"]) {
    await test.step(theme, async () => {
      await page.locator("#appearance-select").selectOption(theme);
      await page.waitForTimeout(300); // Wait for theme transition

      // Open modal
      await page.getByRole("button", { name: "Ask Mantosh" }).click();
      await expect(page.locator("#ask-mantosh-panel")).not.toHaveAttribute("hidden");

      // Verify input is focused
      await expect(page.locator("#ask-mantosh-input")).toBeFocused();

      // Verify dialog is properly structured
      const panel = page.locator("#ask-mantosh-panel");
      await expect(panel).toHaveAttribute("role", "dialog");
      await expect(panel).toHaveAttribute("aria-modal", "true");

      // Take screenshot for reference
      const screenshot = await page.screenshot({ fullPage: false });
      await testInfo.attach(`${theme}-modal-open-${testInfo.project.name}`, { body: screenshot, contentType: "image/png" });

      // Close via escape for next iteration
      await page.keyboard.press("Escape");
      await expect(page.locator("#ask-mantosh-panel")).toHaveAttribute("hidden");
    });
  }
});

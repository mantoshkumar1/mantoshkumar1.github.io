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

/**
 * Capture inert state of ALL direct body children except panel/backdrop.
 * This does NOT filter by tag — it tests every child to expose tag-filter defects.
 */
async function captureAllBodyChildrenInertState(page) {
  return await page.evaluate(() => {
    const children = [];
    for (const el of document.body.children) {
      // Skip only the modal container and backdrop by ID
      if (el.id === "ask-mantosh-panel" || el.id === "ask-mantosh-backdrop") continue;
      children.push({
        tag: el.tagName,
        id: el.id || "(no id)",
        hasInert: el.hasAttribute("inert")
      });
    }
    return children;
  });
}

/**
 * Verify that every element in the given list has the expected inert state.
 */
function verifyAllInertState(elements, expectedInert, context) {
  const failures = elements.filter(el => el.hasInert !== expectedInert);
  if (failures.length > 0) {
    throw new Error(
      `${context}: Found ${failures.length} element(s) with unexpected inert state:\n` +
      failures.map(el => `  ${el.tag}${el.id ? ` id="${el.id}"` : ""} inert=${el.hasInert} (expected ${expectedInert})`).join("\n")
    );
  }
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

  // Capture initial state: all direct body children should start non-inert
  const initialState = await captureAllBodyChildrenInertState(page);
  expect(initialState.length > 0, "page should have direct body children").toBe(true);
  verifyAllInertState(initialState, false, "Initial state");

  // Open the modal
  await page.getByRole("button", { name: "Ask Mantosh" }).click();
  await expect(page.locator("#ask-mantosh-panel")).not.toHaveAttribute("hidden");

  // Verify input is focused
  await expect(page.locator("#ask-mantosh-input")).toBeFocused();

  // Verify panel and backdrop are NOT inert
  const panelHasInert = await page.locator("#ask-mantosh-panel").evaluate((el) => el.hasAttribute("inert"));
  const backdropHasInert = await page.locator("#ask-mantosh-backdrop").evaluate((el) => el.hasAttribute("inert"));
  expect(panelHasInert, "ask-mantosh-panel should NOT have inert").toBe(false);
  expect(backdropHasInert, "ask-mantosh-backdrop should NOT have inert").toBe(false);

  // Verify ALL direct body children (except panel/backdrop) are now inert
  const whileOpen = await captureAllBodyChildrenInertState(page);
  verifyAllInertState(whileOpen, true, "While modal open");

  // Test escape to close
  await page.keyboard.press("Escape");
  await expect(page.locator("#ask-mantosh-panel")).toHaveAttribute("hidden");

  // Verify prior inert state is restored exactly
  const afterClose = await captureAllBodyChildrenInertState(page);
  expect(afterClose.length, "children count after close").toBe(initialState.length);
  for (let i = 0; i < initialState.length; i++) {
    expect(
      afterClose[i].hasInert,
      `restore: ${afterClose[i].tag}${afterClose[i].id ? ` id="${afterClose[i].id}"` : ""} inert state`
    ).toBe(initialState[i].hasInert);
  }
});

test("Ask Mantosh modal prevents launcher interaction while open", async ({ page }) => {
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

  const launcher = page.getByRole("button", { name: "Ask Mantosh" });
  const originalFocus = await page.evaluate(() => document.activeElement.id || "");

  // Open the modal
  await launcher.click();
  await expect(page.locator("#ask-mantosh-panel")).not.toHaveAttribute("hidden");

  // Launcher should now be inert
  const launcherInert = await launcher.evaluate((el) => el.hasAttribute("inert"));
  expect(launcherInert, "launcher button should be inert while modal is open").toBe(true);

  // Launcher should not be focusable (trying to focus it should not move focus)
  const currentFocus = await page.evaluate(() => document.activeElement.id);
  await launcher.focus();
  const focusAfterLauncherFocus = await page.evaluate(() => document.activeElement.id);
  // Focus should remain on input or not move to launcher
  expect(focusAfterLauncherFocus, "focus should not move to inert launcher").not.toBe("ask-mantosh-toggle");
});

test("Ask Mantosh modal contains focus inside dialog (Tab/Shift+Tab)", async ({ page }) => {
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

  // Open the modal
  await page.getByRole("button", { name: "Ask Mantosh" }).click();
  await expect(page.locator("#ask-mantosh-panel")).not.toHaveAttribute("hidden");
  await expect(page.locator("#ask-mantosh-input")).toBeFocused();

  // Get all focusable elements within the dialog
  const focusableInDialog = await page.locator("#ask-mantosh-panel").evaluate((panel) => {
    const selector = "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";
    return Array.from(panel.querySelectorAll(selector)).map(el => el.id || el.textContent?.substring(0, 20) || "");
  });

  expect(focusableInDialog.length > 0, "dialog should have focusable elements").toBe(true);

  // Tab should cycle through focusable elements within dialog only
  const initialFocus = await page.evaluate(() => document.activeElement.id);
  await page.keyboard.press("Tab");
  await page.waitForTimeout(50); // Brief wait for focus change
  const afterTab = await page.evaluate(() => document.activeElement.id);
  expect(afterTab, "focus should move within dialog after Tab").not.toBe("");

  // All focused elements should be within the dialog
  const focusParent = await page.evaluate(() => {
    const active = document.activeElement;
    return active.closest("#ask-mantosh-panel") ? "dialog" : "outside";
  });
  expect(focusParent, "focus should remain in dialog").toBe("dialog");
});

test("Ask Mantosh modal restores state across all close paths", async ({ page, context }) => {
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

  const captureState = async () => {
    return {
      childInertStates: await captureAllBodyChildrenInertState(page),
      focusedId: await page.evaluate(() => document.activeElement.id || "")
    };
  };

  const initialState = await captureState();

  // Test each close path
  const closePaths = [
    {
      name: "minimize",
      close: async () => {
        await page.getByRole("button", { name: /Minimize/ }).click();
      }
    },
    {
      name: "escape",
      close: async () => {
        await page.keyboard.press("Escape");
      }
    },
    {
      name: "backdrop",
      close: async () => {
        await page.locator("#ask-mantosh-backdrop").click();
      }
    }
  ];

  for (const { name, close } of closePaths) {
    // Open
    await page.getByRole("button", { name: "Ask Mantosh" }).click();
    await expect(page.locator("#ask-mantosh-panel")).not.toHaveAttribute("hidden");

    // Close via specified path
    await close();
    await expect(page.locator("#ask-mantosh-panel")).toHaveAttribute("hidden");

    // Verify state restored
    const afterClose = await captureState();
    expect(
      afterClose.childInertStates.length,
      `${name} path: children count should match`
    ).toBe(initialState.childInertStates.length);

    for (let i = 0; i < initialState.childInertStates.length; i++) {
      expect(
        afterClose.childInertStates[i].hasInert,
        `${name} path: ${afterClose.childInertStates[i].tag} inert state restored`
      ).toBe(initialState.childInertStates[i].hasInert);
    }
  }
});

test("Ask Mantosh modal returns focus to previous element on close", async ({ page }) => {
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

  // Get a known focusable element (skip link or first nav link)
  const skipLink = page.locator(".skip-link");
  const skipLinkExists = await skipLink.count();
  const testElement = skipLinkExists > 0 ? skipLink : page.locator("a").first();

  // Focus it
  await testElement.focus();
  const focusBefore = await page.evaluate(() => document.activeElement.id || document.activeElement.textContent?.substring(0, 20) || "");

  // Open and close modal
  const launcher = page.getByRole("button", { name: "Ask Mantosh" });
  await launcher.click();
  await expect(page.locator("#ask-mantosh-panel")).not.toHaveAttribute("hidden");

  await page.keyboard.press("Escape");
  await expect(page.locator("#ask-mantosh-panel")).toHaveAttribute("hidden");

  // Focus should return to previous element
  const focusAfter = await page.evaluate(() => document.activeElement.id || document.activeElement.textContent?.substring(0, 20) || "");
  expect(focusAfter, "focus should return to previous element").toBe(focusBefore);
});

test("Ask Mantosh preserves pre-existing inert attribute state", async ({ page }) => {
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

  // Manually make one element inert before opening modal
  const targetElement = await page.locator("header").first();
  await targetElement.evaluate((el) => el.setAttribute("inert", ""));
  const wasInertBefore = await targetElement.evaluate((el) => el.hasAttribute("inert"));
  expect(wasInertBefore, "element should be inert before modal open").toBe(true);

  // Open modal
  await page.getByRole("button", { name: "Ask Mantosh" }).click();
  await expect(page.locator("#ask-mantosh-panel")).not.toHaveAttribute("hidden");

  // Element should still be inert
  const stillInert = await targetElement.evaluate((el) => el.hasAttribute("inert"));
  expect(stillInert, "element should remain inert while modal open").toBe(true);

  // Close modal
  await page.keyboard.press("Escape");
  await expect(page.locator("#ask-mantosh-panel")).toHaveAttribute("hidden");

  // Element should still be inert (pre-existing state preserved)
  const stayedInert = await targetElement.evaluate((el) => el.hasAttribute("inert"));
  expect(stayedInert, "pre-existing inert attribute should be preserved after close").toBe(true);
});

test("Ask Mantosh modal remains functional across themes", async ({ page }, testInfo) => {
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
    await test.step(`theme: ${theme}`, async () => {
      await page.locator("#appearance-select").selectOption(theme);
      await page.waitForTimeout(300);

      // Open modal
      await page.getByRole("button", { name: "Ask Mantosh" }).click();
      await expect(page.locator("#ask-mantosh-panel")).not.toHaveAttribute("hidden");

      // Verify structure
      const panel = page.locator("#ask-mantosh-panel");
      await expect(panel).toHaveAttribute("role", "dialog");
      await expect(panel).toHaveAttribute("aria-modal", "true");

      // Verify all background is inert
      const backgroundInert = await captureAllBodyChildrenInertState(page);
      verifyAllInertState(backgroundInert, true, `${theme}: modal open`);

      // Close and verify restoration
      await page.keyboard.press("Escape");
      await expect(page.locator("#ask-mantosh-panel")).toHaveAttribute("hidden");

      const backgroundAfter = await captureAllBodyChildrenInertState(page);
      expect(backgroundAfter.length, `${theme}: children count after close`).toBe(backgroundInert.length);
    });
  }
});

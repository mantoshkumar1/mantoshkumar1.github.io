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

  // Use exact launcher locator with explicit ID check
  const launcher = page.locator("#ask-mantosh-toggle");
  await expect(launcher).toBeTruthy();

  // Open the modal
  await launcher.click();
  await expect(page.locator("#ask-mantosh-panel")).not.toHaveAttribute("hidden");

  // Launcher should now be inert
  const launcherInert = await launcher.evaluate((el) => el.hasAttribute("inert"));
  expect(launcherInert, "launcher button should be inert while modal is open").toBe(true);

  // Test pointer interaction is prevented (click should not affect hidden state)
  const isHiddenBefore = await page.locator("#ask-mantosh-panel").isHidden();
  await launcher.click({ force: false }); // Non-force click should not reach inert element
  const isHiddenAfter = await page.locator("#ask-mantosh-panel").isHidden();
  expect(isHiddenAfter, "pointer interaction on inert launcher should not close modal").toBe(isHiddenBefore);

  // Launcher should not be focusable (trying to focus it should not move focus)
  const focusBeforeLauncherFocus = await page.evaluate(() => document.activeElement.id);
  await launcher.focus();
  const focusAfterLauncherFocus = await page.evaluate(() => document.activeElement.id);
  // Focus should not move to inert launcher
  expect(focusAfterLauncherFocus, "focus should not move to inert launcher").toBe(focusBeforeLauncherFocus);
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

  // Open the modal using explicit launcher selector
  await page.locator("#ask-mantosh-toggle").click();
  await expect(page.locator("#ask-mantosh-panel")).not.toHaveAttribute("hidden");
  await expect(page.locator("#ask-mantosh-input")).toBeFocused();

  // Get all focusable elements within the dialog
  const focusableInDialog = await page.locator("#ask-mantosh-panel").evaluate((panel) => {
    const selector = "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";
    return Array.from(panel.querySelectorAll(selector)).map(el => ({ id: el.id, tag: el.tagName }));
  });

  expect(focusableInDialog.length > 0, "dialog should have focusable elements").toBe(true);

  // Test forward Tab: should cycle through dialog focusable elements
  const initialFocusId = await page.evaluate(() => document.activeElement.id);
  await page.keyboard.press("Tab");
  await page.waitForTimeout(50);
  const afterTabFocusId = await page.evaluate(() => document.activeElement.id);
  
  // Verify focus moved to next element within dialog
  expect(afterTabFocusId, "forward Tab should move focus within dialog").not.toBe("");
  const focusParentAfterTab = await page.evaluate(() => {
    const active = document.activeElement;
    return active.closest("#ask-mantosh-panel") ? "dialog" : "outside";
  });
  expect(focusParentAfterTab, "focus should remain in dialog after Tab").toBe("dialog");

  // Test reverse Shift+Tab: should move focus backward within dialog
  const beforeShiftTabFocusId = await page.evaluate(() => document.activeElement.id);
  await page.keyboard.press("Shift+Tab");
  await page.waitForTimeout(50);
  const afterShiftTabFocusId = await page.evaluate(() => document.activeElement.id);
  
  // Focus should move, likely back to initial element or previous in tab order
  const focusParentAfterShiftTab = await page.evaluate(() => {
    const active = document.activeElement;
    return active.closest("#ask-mantosh-panel") ? "dialog" : "outside";
  });
  expect(focusParentAfterShiftTab, "focus should remain in dialog after Shift+Tab").toBe("dialog");

  // Test boundary: repeated Tab should stay within dialog
  for (let i = 0; i < focusableInDialog.length + 2; i++) {
    const parentBefore = await page.evaluate(() => {
      const active = document.activeElement;
      return active.closest("#ask-mantosh-panel") ? "dialog" : "outside";
    });
    expect(parentBefore, `iteration ${i}: focus should remain in dialog during Tab cycle`).toBe("dialog");
    await page.keyboard.press("Tab");
    await page.waitForTimeout(30);
  }
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

  const captureStateWithIdentity = async () => {
    return {
      childStates: await page.evaluate(() => {
        const children = [];
        for (const el of document.body.children) {
          if (el.id === "ask-mantosh-panel" || el.id === "ask-mantosh-backdrop") continue;
          children.push({
            tag: el.tagName,
            id: el.id || `(no-id-${el.tagName})`,
            hasInert: el.hasAttribute("inert"),
            element: el // For identity comparison
          });
        }
        return children.map(({ tag, id, hasInert }) => ({ tag, id, hasInert }));
      })
    };
  };

  const initialState = await captureStateWithIdentity();

  // Test each close path independently
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
      name: "backdrop click",
      close: async () => {
        await page.locator("#ask-mantosh-backdrop").click();
      }
    },
    {
      name: "clear conversation",
      close: async () => {
        // Click clear button if present, otherwise escape
        const clearBtn = page.getByRole("button", { name: /Clear/ });
        const exists = await clearBtn.count();
        if (exists > 0) {
          await clearBtn.click();
          // May show confirmation dialog
          const confirmBtn = page.getByRole("button", { name: /ok|yes|close/i });
          if (await confirmBtn.count() > 0) {
            await confirmBtn.click();
          }
        } else {
          // Fallback to escape if no clear button
          await page.keyboard.press("Escape");
        }
      }
    }
  ];

  for (const { name, close } of closePaths) {
    // Open
    await page.locator("#ask-mantosh-toggle").click();
    await expect(page.locator("#ask-mantosh-panel")).not.toHaveAttribute("hidden");

    // Verify inert applied when open
    const whileOpen = await captureStateWithIdentity();
    for (const state of whileOpen.childStates) {
      expect(state.hasInert, `${name} path: ${state.id} should be inert when modal open`).toBe(true);
    }

    // Close via specified path
    await close();
    // Wait for modal to be hidden
    await expect(page.locator("#ask-mantosh-panel")).toHaveAttribute("hidden", { timeout: 1000 });

    // Verify state restored by comparing element identities and inert states
    const afterClose = await captureStateWithIdentity();
    expect(
      afterClose.childStates.length,
      `${name} path: children count should match initial`
    ).toBe(initialState.childStates.length);

    for (let i = 0; i < initialState.childStates.length; i++) {
      const initialEl = initialState.childStates[i];
      const afterEl = afterClose.childStates[i];
      expect(
        afterEl.tag,
        `${name} path: element ${i} tag should match`
      ).toBe(initialEl.tag);
      expect(
        afterEl.id,
        `${name} path: element ${i} id should match`
      ).toBe(initialEl.id);
      expect(
        afterEl.hasInert,
        `${name} path: element ${i} (${afterEl.tag}${afterEl.id ? ` id="${afterEl.id}"` : ""}) inert state should be restored`
      ).toBe(initialEl.hasInert);
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

  // Test focus restoration from different element types
  const testElements = [
    { selector: ".skip-link", name: "skip link" },
    { selector: "a", name: "first link" },
    { selector: "button:not(#ask-mantosh-toggle)", name: "first button (not launcher)" }
  ];

  for (const { selector, name } of testElements) {
    const testElement = page.locator(selector).first();
    const elementExists = await testElement.count();
    if (elementExists === 0) continue;

    // Focus the element and capture its identity
    await testElement.focus();
    const focusBefore = await page.evaluate(() => ({
      id: document.activeElement.id,
      tag: document.activeElement.tagName,
      text: document.activeElement.textContent?.substring(0, 30) || ""
    }));

    // Open modal using explicit launcher
    await page.locator("#ask-mantosh-toggle").click();
    await expect(page.locator("#ask-mantosh-panel")).not.toHaveAttribute("hidden");

    // Modal input should be focused
    await expect(page.locator("#ask-mantosh-input")).toBeFocused();

    // Close modal via escape
    await page.keyboard.press("Escape");
    await expect(page.locator("#ask-mantosh-panel")).toHaveAttribute("hidden");

    // Verify focus returned to exact previous element
    const focusAfter = await page.evaluate(() => ({
      id: document.activeElement.id,
      tag: document.activeElement.tagName,
      text: document.activeElement.textContent?.substring(0, 30) || ""
    }));

    expect(focusAfter.tag, `${name}: element tag should be restored`).toBe(focusBefore.tag);
    if (focusBefore.id) {
      expect(focusAfter.id, `${name}: element id should be restored`).toBe(focusBefore.id);
    }
    expect(focusAfter.text, `${name}: element text content should be restored`).toBe(focusBefore.text);

    break; // Test with first available element
  }
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

test("Ask Mantosh modal accessibility violations with inertness applied", async ({ page }) => {
  await page.route("https://cdn.jsdelivr.net/**", (route) => route.abort());
  await page.route("https://ask-mantosh.mantoshk234.workers.dev/**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        answer: "Platform systems and automation are key areas of focus.",
        sources: [],
        recommendations: [],
        followUpQuestions: [],
        confidence: "high",
        success: true
      })
    });
  });

  await page.goto("/");

  // Open modal
  await page.locator("#ask-mantosh-toggle").click();
  await expect(page.locator("#ask-mantosh-panel")).not.toHaveAttribute("hidden");

  // Run Axe accessibility check while modal is open
  await assertNoSeriousAccessibilityViolations(page, "page with modal open");

  // Close modal and verify accessibility again
  await page.keyboard.press("Escape");
  await expect(page.locator("#ask-mantosh-panel")).toHaveAttribute("hidden");

  // Verify no accessibility violations after close
  await assertNoSeriousAccessibilityViolations(page, "page after modal close");
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

      // Open modal using explicit launcher
      await page.locator("#ask-mantosh-toggle").click();
      await expect(page.locator("#ask-mantosh-panel")).not.toHaveAttribute("hidden");

      // Verify structure
      const panel = page.locator("#ask-mantosh-panel");
      await expect(panel).toHaveAttribute("role", "dialog");
      await expect(panel).toHaveAttribute("aria-modal", "true");

      // Verify all background elements are inert using element identity
      const backgroundInert = await captureAllBodyChildrenInertState(page);
      const inertFailures = backgroundInert.filter(el => !el.hasInert);
      expect(
        inertFailures.length,
        `${theme}: all background elements should be inert when modal open. Failed: ${inertFailures.map(e => e.tag + (e.id ? ` id="${e.id}"` : "")).join(", ")}`
      ).toBe(0);

      // Close and verify restoration
      await page.keyboard.press("Escape");
      await expect(page.locator("#ask-mantosh-panel")).toHaveAttribute("hidden");

      const backgroundAfter = await captureAllBodyChildrenInertState(page);
      expect(backgroundAfter.length, `${theme}: children count after close`).toBe(backgroundInert.length);
      
      // Verify none are inert after close
      const stillInert = backgroundAfter.filter(el => el.hasInert);
      expect(
        stillInert.length,
        `${theme}: background elements should not be inert after modal close. Still inert: ${stillInert.map(e => e.tag + (e.id ? ` id="${e.id}"` : "")).join(", ")}`
      ).toBe(0);
    });
  }
});
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

  // Use exact launcher locator with explicit ID
  const launcher = page.locator("#ask-mantosh-toggle");
  await expect(launcher).toBeTruthy();

  // Open the modal
  await launcher.click();
  await expect(page.locator("#ask-mantosh-panel")).not.toHaveAttribute("hidden");

  // Launcher should now be inert
  const launcherInert = await launcher.evaluate((el) => el.hasAttribute("inert"));
  expect(launcherInert, "launcher button should be inert while modal is open").toBe(true);

  // Test pointer interaction is blocked: non-force click should timeout or be ignored
  // Capture panel state before attempting blocked click
  const panelBefore = await page.locator("#ask-mantosh-panel").evaluate((el) => ({
    hidden: el.hidden,
    inert: document.body.children
  }));

  // Attempt non-force click on inert launcher should fail to reach it
  let clickBlocked = false;
  try {
    // Set a strict timeout and attempt non-force click
    await launcher.click({ force: false, timeout: 500 });
  } catch (err) {
    // Expected: click is blocked by inertness
    clickBlocked = true;
  }

  expect(clickBlocked, "non-force click on inert launcher should be blocked").toBe(true);

  // Verify modal state unchanged by blocked click attempt
  const panelAfter = await page.locator("#ask-mantosh-panel").isHidden();
  expect(panelAfter, "modal should remain open after blocked launcher click").toBe(false);

  // Launcher should not be focusable
  const focusBeforeLauncherFocus = await page.evaluate(() => document.activeElement.id);
  await launcher.focus({ force: false });
  const focusAfterLauncherFocus = await page.evaluate(() => document.activeElement.id);
  // Focus should not move to inert launcher
  expect(focusAfterLauncherFocus, "focus should not move to inert launcher").toBe(focusBeforeLauncherFocus);
});

test("Ask Mantosh modal contains focus inside dialog (Tab/Shift+Tab boundaries)", async ({ page }) => {
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
    const elements = Array.from(panel.querySelectorAll(selector));
    return elements.map(el => ({ id: el.id, tag: el.tagName, text: el.textContent?.substring(0, 20) || "" }));
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

  // Test forward boundary: Tab beyond the last focusable element should wrap
  // Press Tab enough times to cycle through all focusable elements and back
  const forwardCycle = focusableInDialog.length + 3;
  for (let i = 0; i < forwardCycle; i++) {
    const parentBefore = await page.evaluate(() => {
      const active = document.activeElement;
      return active.closest("#ask-mantosh-panel") ? "dialog" : "outside";
    });
    expect(parentBefore, `forward cycle iteration ${i}: focus should remain in dialog during Tab`).toBe("dialog");
    await page.keyboard.press("Tab");
    await page.waitForTimeout(30);
  }

  // Test reverse boundary: Shift+Tab beyond the first focusable element should wrap
  const reverseCycle = focusableInDialog.length + 3;
  for (let i = 0; i < reverseCycle; i++) {
    const parentBefore = await page.evaluate(() => {
      const active = document.activeElement;
      return active.closest("#ask-mantosh-panel") ? "dialog" : "outside";
    });
    expect(parentBefore, `reverse cycle iteration ${i}: focus should remain in dialog during Shift+Tab`).toBe("dialog");
    await page.keyboard.press("Shift+Tab");
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
        // Exact selector for minimize button
        const minimize = page.locator("button[aria-label*='Minimize'], button:has-text('Minimize')").first();
        await minimize.click();
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
        // Use EXACT #ask-mantosh-clear selector with NO fallback
        const clearBtn = page.locator("#ask-mantosh-clear");
        await clearBtn.click();
        // Clear may show confirmation; handle if present
        const confirmBtn = page.locator("button:has-text('OK'), button:has-text('Yes'), button:has-text('Confirm')").first();
        const confirmExists = await confirmBtn.count().catch(() => 0);
        if (confirmExists > 0) {
          await confirmBtn.click();
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
    try {
      await close();
    } catch (err) {
      // Some paths may fail temporarily; wait a bit and retry once
      await page.waitForTimeout(100);
      try {
        await close();
      } catch (e2) {
        // If still fails, log it but continue to verify state restoration attempt
        console.log(`${name} close path encountered error: ${e2.message}`);
      }
    }

    // Wait for modal to be hidden
    await expect(page.locator("#ask-mantosh-panel")).toHaveAttribute("hidden", { timeout: 1000 });

    // Verify state restored by comparing element identities and inert states
    const afterClose = await captureStateWithIdentity();

    // Compare each element by identity (tag + id), not by array position
    const initialById = new Map(initialState.childStates.map(s => [s.id, s]));
    const afterById = new Map(afterClose.childStates.map(s => [s.id, s]));

    // Verify all initial elements are present with same tags
    for (const [id, initialEl] of initialById) {
      expect(afterById.has(id), `${name} path: element with id="${id}" should still exist after close`).toBe(true);
      const afterEl = afterById.get(id);
      expect(
        afterEl.tag,
        `${name} path: element id="${id}" tag should match`
      ).toBe(initialEl.tag);
      expect(
        afterEl.hasInert,
        `${name} path: element id="${id}" (${afterEl.tag}) inert state should be restored`
      ).toBe(initialEl.hasInert);
    }
  }
});

test("Ask Mantosh modal returns focus to launcher on close", async ({ page }) => {
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

  const launcher = page.locator("#ask-mantosh-toggle");

  // Capture launcher identity BEFORE opening modal
  const launcherIdentity = await launcher.evaluate((el) => ({
    id: el.id,
    tag: el.tagName,
    text: el.textContent?.substring(0, 30) || ""
  }));

  // Open modal using the launcher
  await launcher.click();
  await expect(page.locator("#ask-mantosh-panel")).not.toHaveAttribute("hidden");

  // Modal input should be focused
  await expect(page.locator("#ask-mantosh-input")).toBeFocused();

  // Verify focused element changed
  const focusInModal = await page.evaluate(() => document.activeElement.id);
  expect(focusInModal, "focus should move to modal input").toBe("ask-mantosh-input");

  // Close modal via escape
  await page.keyboard.press("Escape");
  await expect(page.locator("#ask-mantosh-panel")).toHaveAttribute("hidden");

  // Verify focus returned to LAUNCHER (the actual previous focus)
  const focusAfter = await page.evaluate(() => ({
    id: document.activeElement.id,
    tag: document.activeElement.tagName,
    text: document.activeElement.textContent?.substring(0, 30) || ""
  }));

  expect(focusAfter.id, "focus should return to launcher after close").toBe(launcherIdentity.id);
  expect(focusAfter.tag, "launcher element tag should be restored").toBe(launcherIdentity.tag);
  expect(focusAfter.text, "launcher text should match").toBe(launcherIdentity.text);
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
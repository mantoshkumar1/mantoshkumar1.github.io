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

/**
 * Install page-realm snapshot: store actual element references WITHOUT serializing them.
 * Stores in window.__dbModalBodySnapshot to preserve element identity across page evaluations.
 */
async function installBodySnapshot(page) {
  await page.evaluate(() => {
    window.__dbModalBodySnapshot = Array.from(document.body.children)
      .filter((element) => element.id !== "ask-mantosh-panel" && element.id !== "ask-mantosh-backdrop")
      .map((element) => ({
        element,
        tag: element.tagName,
        id: element.id || `(no-id-${element.tagName})`,
        hadInert: element.hasAttribute("inert")
      }));
  });
}

/**
 * Restore and verify: check stored page-realm references after close.
 * Returns ONLY failure diagnostics (disconnected, replaced, tag/id mutation, inert mismatch).
 * Assert returned failures array is empty.
 */
async function restoreAndVerify(page) {
  return await page.evaluate(() => {
    if (!window.__dbModalBodySnapshot || window.__dbModalBodySnapshot.length === 0) {
      return ["no snapshot was installed"];
    }

    const failures = [];
    for (const { element, tag, id, hadInert } of window.__dbModalBodySnapshot) {
      // Check if element is still connected and has direct-body parent
      if (!element.isConnected || element.parentElement !== document.body) {
        failures.push(`element ${id} (${tag}): not found in document after close`);
        continue;
      }

      // Check if tag changed
      if (element.tagName !== tag) {
        failures.push(`element ${id}: tag changed from ${tag} to ${element.tagName}`);
      }

      // Check if ID changed
      const currentId = element.id || `(no-id-${element.tagName})`;
      if (currentId !== id) {
        failures.push(`element ${id}: ID changed to ${currentId}`);
      }

      // Check if inert state was restored correctly
      const currentInert = element.hasAttribute("inert");
      if (currentInert !== hadInert) {
        failures.push(`element ${id} (${tag}): inert state not restored (expected ${hadInert}, got ${currentInert})`);
      }
    }

    return failures;
  });
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
  // Attempt non-force click on inert launcher should fail with ActionabilityError due to inertness
  let clickError = null;
  try {
    // Set a strict timeout and attempt non-force click
    await launcher.click({ force: false, timeout: 500 });
  } catch (err) {
    // Expected: click is blocked by inertness (ActionabilityError)
    clickError = err;
  }

  expect(clickError).not.toBeNull();
  expect(clickError.message).toMatch(/ActionabilityError|inert|not actionable/i);

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

  // Derive actual enabled, visible, keyboard-tabbable dialog descendants
  // Store actual element references in page realm for object-identity comparison
  const tabbables = await page.locator("#ask-mantosh-panel").evaluate((panel) => {
    const selector = "button, [href], input, select, textarea, [tabindex]";
    const candidates = Array.from(panel.querySelectorAll(selector));

    // Filter to only enabled, visible, keyboard-tabbable elements
    const tabbableElements = candidates.filter(el => {
      // Check if disabled
      if (el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true") return false;

      // Check if hidden or display: none
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return false;

      // Check if element is in the document and visible
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;

      // Check if element or ancestor is inert
      if (el.hasAttribute("inert")) return false;
      let parent = el.parentElement;
      while (parent && parent !== panel) {
        if (parent.hasAttribute("inert")) return false;
        parent = parent.parentElement;
      }

      // Enforce element.tabIndex >= 0 for actual keyboard tabbability
      if (el.tabIndex < 0) return false;

      return true;
    });

    // Store actual page-realm element references (no ID serialization or refind)
    window.__dbFocusTestTabbables = tabbableElements;

    return tabbableElements.map((el, idx) => ({
      index: idx,
      id: el.id || `(no-id-${el.tagName})`,
      tag: el.tagName,
      text: el.textContent?.substring(0, 20) || ""
    }));
  });

  // Assert at least two tabbable elements
  expect(tabbables.length >= 2, "dialog should have at least two enabled, visible, keyboard-tabbable elements").toBe(true);

  // Prove exact last→first on Tab
  // Focus the last tabbable element by actual reference (not ID lookup/refind)
  const lastTabbable = tabbables[tabbables.length - 1];
  await page.evaluate((lastIndex) => {
    const tabbables = window.__dbFocusTestTabbables;
    if (tabbables && tabbables[lastIndex]) {
      tabbables[lastIndex].focus();
    }
  }, lastTabbable.index);

  // Verify the last element is focused by actual reference
  const focusedLastRef = await page.evaluate(() => {
    const tabbables = window.__dbFocusTestTabbables;
    if (!tabbables) return null;
    const activeEl = document.activeElement;
    return tabbables.indexOf(activeEl);
  });
  expect(focusedLastRef, "should focus the last tabbable element by object identity").toBe(lastTabbable.index);

  // Press Tab from last → should cycle to first
  await page.keyboard.press("Tab");

  const firstTabbable = tabbables[0];
  const focusAfterTabFromLastRef = await page.evaluate(() => {
    const tabbables = window.__dbFocusTestTabbables;
    if (!tabbables) return -1;
    const activeEl = document.activeElement;
    return tabbables.indexOf(activeEl);
  });
  expect(focusAfterTabFromLastRef, "Tab from last tabbable should cycle to first tabbable").toBe(firstTabbable.index);

  // Verify movement and containment
  const isInPanel = await page.evaluate(() => {
    const panel = document.getElementById("ask-mantosh-panel");
    const activeEl = document.activeElement;
    return activeEl.closest("#ask-mantosh-panel") === panel;
  });
  expect(isInPanel, "focus must remain in dialog after Tab wrap").toBe(true);

  // Prove exact first→last on Shift+Tab
  // Already at first tabbable, so press Shift+Tab → should cycle to last
  await page.keyboard.press("Shift+Tab");

  const focusAfterShiftTabFromFirstRef = await page.evaluate(() => {
    const tabbables = window.__dbFocusTestTabbables;
    if (!tabbables) return -1;
    const activeEl = document.activeElement;
    return tabbables.indexOf(activeEl);
  });
  expect(focusAfterShiftTabFromFirstRef, "Shift+Tab from first tabbable should cycle to last tabbable").toBe(lastTabbable.index);

  // Verify containment throughout cycling
  const finalContainmentTest = await page.evaluate(() => {
    const panel = document.getElementById("ask-mantosh-panel");
    const activeEl = document.activeElement;
    return activeEl.closest("#ask-mantosh-panel") === panel;
  });
  expect(finalContainmentTest, "focus must remain in dialog during exact cycling").toBe(true);
});

// Close-path test descriptors (R68 mechanical harness normalization)
const closePathDescriptors = [
  {
    name: "minimize",
    selector: "#ask-mantosh-minimize",
    close: async (page) => {
      await page.locator("#ask-mantosh-minimize").click();
    }
  },
  {
    name: "Escape",
    selector: "keyboard",
    close: async (page) => {
      await page.keyboard.press("Escape");
    }
  },
  {
    name: "backdrop click",
    selector: "#ask-mantosh-backdrop",
    close: async (page) => {
      // Genuine Playwright mouse click at coordinate first proven by elementFromPoint
      const coord = await page.evaluate(() => {
        // Find a point on the backdrop that's outside the panel
        const backdrop = document.getElementById("ask-mantosh-backdrop");
        const panel = document.getElementById("ask-mantosh-panel");
        if (!backdrop || !panel) return null;

        const backdropRect = backdrop.getBoundingClientRect();
        // Try corners and edges of backdrop to find a point outside the panel
        const testPoints = [
          { x: backdropRect.left + 10, y: backdropRect.top + 10 },
          { x: backdropRect.right - 10, y: backdropRect.top + 10 },
          { x: backdropRect.left + 10, y: backdropRect.bottom - 10 },
          { x: backdropRect.right - 10, y: backdropRect.bottom - 10 }
        ];

        for (const pt of testPoints) {
          const el = document.elementFromPoint(pt.x, pt.y);
          if (el && el.id === "ask-mantosh-backdrop") {
            return pt;
          }
        }
        return null;
      });

      if (!coord) {
        throw new Error("backdrop click: unable to find verified click coordinate outside panel");
      }
      await page.mouse.click(coord.x, coord.y);
    }
  },
  {
    name: "clear conversation",
    selector: "#ask-mantosh-clear",
    close: async (page) => {
      await page.locator("#ask-mantosh-clear").click();
    }
  }
];

// Register four separate close-path tests
for (const descriptor of closePathDescriptors) {
  test(`Ask Mantosh modal restores state after ${descriptor.name}`, async ({ page, context }) => {
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

    // Install page-realm snapshot with actual element references
    await installBodySnapshot(page);

    // Open modal
    await page.locator("#ask-mantosh-toggle").click();
    await expect(page.locator("#ask-mantosh-panel")).not.toHaveAttribute("hidden");

    // Invoke the specific closer — NO catch/retry, let error propagate if it occurs
    await descriptor.close(page);

    // Wait for modal to be hidden
    await expect(page.locator("#ask-mantosh-panel")).toHaveAttribute("hidden", { timeout: 1000 });

    // Verify exact-reference restoration (returns only failure diagnostics, assert empty)
    const failures = await restoreAndVerify(page);
    expect(failures, `${descriptor.name} path: exact-reference restoration`).toEqual([]);
  });
}

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

      // Install exact-reference snapshot before open
      await installBodySnapshot(page);

      // Open modal using explicit launcher
      await page.locator("#ask-mantosh-toggle").click();
      await expect(page.locator("#ask-mantosh-panel")).not.toHaveAttribute("hidden");

      // Verify structure
      const panel = page.locator("#ask-mantosh-panel");
      await expect(panel).toHaveAttribute("role", "dialog");
      await expect(panel).toHaveAttribute("aria-modal", "true");

      // Close via Escape and verify exact-reference restoration
      await page.keyboard.press("Escape");
      await expect(page.locator("#ask-mantosh-panel")).toHaveAttribute("hidden");

      // Verify exact-reference restoration (returns only failure diagnostics, assert empty)
      const failures = await restoreAndVerify(page);
      expect(failures, `${theme}: exact-reference restoration`).toEqual([]);
    });
  }
});

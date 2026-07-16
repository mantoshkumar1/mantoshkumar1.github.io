/* Shared Ask Mantosh launcher. Injects the minimized widget on every public page. */
(() => {
  const themeKey = "mantosh-appearance";
  const supportedThemes = new Set(["auto", "light", "dark", "soft", "contrast"]);
  let savedTheme = "soft";
  try {
    const storedTheme = window.localStorage.getItem(themeKey);
    if (supportedThemes.has(storedTheme)) savedTheme = storedTheme;
  } catch { /* Preference storage may be unavailable in privacy modes. */ }

  const applyTheme = (theme) => {
    if (theme === "auto") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.dataset.theme = theme;
    const themeColors = { light: "#f7f8fb", soft: "#f4efe7", contrast: "#000000", dark: "#05070a" };
    const autoColor = window.matchMedia("(prefers-color-scheme: light)").matches ? themeColors.light : themeColors.dark;
    const themeColor = theme === "auto" ? autoColor : themeColors[theme] || themeColors.dark;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeColor);
  };
  applyTheme(savedTheme);

  const navigation = document.querySelector(".navbar nav");
  if (navigation && !document.getElementById("appearance-select")) {
    navigation.insertAdjacentHTML("beforeend", `
      <label class="appearance-control" for="appearance-select">
        <span class="sr-only">Appearance</span>
        <select id="appearance-select" aria-label="Appearance">
          <option value="auto">Auto</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="soft">Soft</option>
          <option value="contrast">Contrast</option>
        </select>
      </label>`);
    const select = document.getElementById("appearance-select");
    select.value = savedTheme;
    select.addEventListener("change", () => {
      savedTheme = supportedThemes.has(select.value) ? select.value : "auto";
      try { window.localStorage.setItem(themeKey, savedTheme); } catch { /* The current choice still applies for this page. */ }
      applyTheme(savedTheme);
    });
    window.matchMedia("(prefers-color-scheme: light)").addEventListener?.("change", () => {
      if (savedTheme === "auto") applyTheme("auto");
    });
  }

  if (navigation && !document.getElementById("mobile-nav-toggle")) {
    navigation.id ||= "primary-navigation";
    const currentPage = navigation.querySelector('[aria-current="page"]')?.textContent.trim() || "";
    const closedLabel = currentPage || "Menu";
    const menuButton = document.createElement("button");
    menuButton.className = "mobile-nav-toggle";
    menuButton.id = "mobile-nav-toggle";
    menuButton.type = "button";
    menuButton.dataset.hasCurrent = currentPage ? "true" : "false";
    menuButton.setAttribute("aria-controls", navigation.id);
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", currentPage ? `Open navigation. Current page: ${currentPage}` : "Open navigation");
    menuButton.textContent = `${closedLabel} ▾`;
    navigation.insertBefore(menuButton, navigation.querySelector(".appearance-control"));

    const setNavigationOpen = (open) => {
      navigation.classList.toggle("mobile-nav-expanded", open);
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.setAttribute("aria-label", open ? "Close navigation" : (currentPage ? `Open navigation. Current page: ${currentPage}` : "Open navigation"));
      menuButton.textContent = open ? "Close" : `${closedLabel} ▾`;
    };

    menuButton.addEventListener("click", () => setNavigationOpen(!navigation.classList.contains("mobile-nav-expanded")));
    navigation.addEventListener("click", (event) => {
      if (event.target.closest("a")) setNavigationOpen(false);
    });
    document.addEventListener("click", (event) => {
      if (!navigation.contains(event.target)) setNavigationOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && navigation.classList.contains("mobile-nav-expanded")) {
        setNavigationOpen(false);
        menuButton.focus();
      }
    });
    window.matchMedia("(min-width: 641px)").addEventListener?.("change", (event) => {
      if (event.matches) setNavigationOpen(false);
    });
  }

  document.querySelector(".skip-link")?.addEventListener("click", (event) => {
    const target = document.querySelector(event.currentTarget.getAttribute("href"));
    window.setTimeout(() => target?.focus(), 0);
  });

  if (document.getElementById("ask-mantosh-toggle")) return;

  document.body.insertAdjacentHTML("beforeend", `
    <button class="ask-mantosh-toggle" id="ask-mantosh-toggle" type="button" aria-label="Ask Mantosh" aria-controls="ask-mantosh-panel" aria-expanded="false">
      <span class="ask-mantosh-toggle-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h10a2 2 0 012 2v5a2 2 0 01-2 2h-3l-4 3v-3H7a2 2 0 01-2-2V9a2 2 0 012-2z"></path></svg>
      </span>
      <span class="ask-mantosh-toggle-text">Ask Mantosh</span>
    </button>
    <div class="ask-mantosh-backdrop" id="ask-mantosh-backdrop" hidden></div>
    <section class="ask-mantosh-panel" id="ask-mantosh-panel" role="dialog" aria-modal="true" aria-labelledby="ask-mantosh-title" aria-describedby="ask-mantosh-description" data-api-url="https://ask-mantosh.mantoshk234.workers.dev/" hidden>
      <div class="ask-mantosh-header">
        <div class="ask-mantosh-header-content">
          <div class="ask-mantosh-identity"><span class="ask-mantosh-presence" aria-hidden="true"></span><h2 id="ask-mantosh-title">Ask Mantosh</h2><button class="ask-mantosh-audience-badge" id="ask-mantosh-audience-badge" type="button" aria-controls="ask-mantosh-audience-selector" aria-expanded="false" hidden>Audience: <span id="ask-mantosh-audience-label"></span></button></div>
          <p id="ask-mantosh-description">Ask about my projects, engineering decisions, automation, distributed systems, and experience.</p>
        </div>
        <div class="ask-mantosh-header-actions">
          <button class="ask-mantosh-close ask-mantosh-export" id="ask-mantosh-export" type="button" aria-label="Export conversation as a text file" title="Export visible conversation as TXT" hidden><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v10m0 0l-4-4m4 4l4-4M5 19h14"></path></svg><span>TXT</span></button>
          <button class="ask-mantosh-close" id="ask-mantosh-minimize" type="button" aria-label="Minimize Ask Mantosh; conversation will remain available" title="Minimize — conversation stays here"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 12h12"></path></svg></button>
          <button class="ask-mantosh-close ask-mantosh-clear" id="ask-mantosh-clear" type="button" aria-label="Close Ask Mantosh and clear conversation" title="Close and clear conversation"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M7 7l10 10M17 7L7 17"></path></svg></button>
        </div>
      </div>
      <div class="ask-mantosh-body">
        <section class="ask-mantosh-audience-selector" id="ask-mantosh-audience-selector" aria-labelledby="ask-mantosh-audience-title">
          <p id="ask-mantosh-audience-title">Who are you?</p>
          <div class="ask-mantosh-audience-options" role="group" aria-label="Choose how answers are presented">
            <button type="button" class="ask-mantosh-audience-chip" data-audience="recruiter" aria-pressed="false">Recruiter</button>
            <button type="button" class="ask-mantosh-audience-chip" data-audience="hiring-manager" aria-pressed="false">Hiring Manager</button>
            <button type="button" class="ask-mantosh-audience-chip" data-audience="engineer" aria-pressed="false">Engineer</button>
            <button type="button" class="ask-mantosh-audience-chip" data-audience="student" aria-pressed="false">Student</button>
          </div>
        </section>
        <div class="ask-mantosh-conversation"><div class="ask-mantosh-messages" id="ask-mantosh-messages" role="log" aria-live="polite" aria-relevant="additions text" aria-label="Ask Mantosh conversation"></div><button class="ask-mantosh-jump" id="ask-mantosh-jump" type="button" hidden>Jump to latest</button></div>
        <div class="ask-mantosh-suggestions" id="ask-mantosh-suggestions" role="group" aria-label="Suggested questions" hidden></div>
        <div class="ask-mantosh-status" id="ask-mantosh-status" role="status" aria-live="polite"></div>
        <div class="ask-mantosh-composer-hint" aria-hidden="true"><span><kbd>Enter</kbd> send</span><span><kbd>Shift</kbd> + <kbd>Enter</kbd> new line</span></div>
        <form class="ask-mantosh-composer" id="ask-mantosh-form"><label class="sr-only" for="ask-mantosh-input">Ask about my work</label><textarea id="ask-mantosh-input" rows="1" placeholder="Ask about my work..." maxlength="1000"></textarea><button class="ask-mantosh-send" id="ask-mantosh-send" type="submit" aria-label="Send message">Send</button></form>
      </div>
    </section>`);

  let clientPromise;
  const loadClient = () => {
    if (clientPromise) return clientPromise;
    clientPromise = new Promise((resolve, reject) => {
      const client = document.createElement("script");
      client.src = "/assets/js/main.js?v=20260716-5";
      client.addEventListener("load", resolve, { once: true });
      client.addEventListener("error", reject, { once: true });
      document.body.append(client);
    });
    return clientPromise;
  };

  const toggle = document.getElementById("ask-mantosh-toggle");
  toggle.addEventListener("click", (event) => {
    if (toggle.dataset.clientReady === "true") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    loadClient().then(() => {
      toggle.dataset.clientReady = "true";
      toggle.click();
    }).catch(() => {
      toggle.setAttribute("aria-disabled", "true");
    });
  }, { capture: true });

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest('a[href="#ask-mantosh"], [data-open-ask-mantosh]');
    if (!trigger || toggle.dataset.clientReady === "true") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    loadClient().then(() => {
      toggle.dataset.clientReady = "true";
      trigger.click();
    });
  }, { capture: true });

  if (window.location.hash === "#ask-mantosh") {
    loadClient().then(() => { toggle.dataset.clientReady = "true"; });
  }
})();

/* Shared Ask Mantosh launcher. Injects the minimized widget on every public page. */
(() => {
  const themeKey = "mantosh-appearance";
  const supportedThemes = new Set(["auto", "light", "dark", "soft", "contrast"]);
  let savedTheme = "dark";
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
          <div class="ask-mantosh-identity"><span class="ask-mantosh-presence" aria-hidden="true"></span><div><p class="ask-mantosh-eyebrow">PUBLISHED KNOWLEDGE</p><h2 id="ask-mantosh-title">Ask Mantosh</h2></div></div>
          <p id="ask-mantosh-description">Evidence-backed answers from Mantosh's projects, experience, and engineering writing.</p>
        </div>
        <div class="ask-mantosh-header-actions">
          <button class="ask-mantosh-close" id="ask-mantosh-minimize" type="button" aria-label="Minimize Ask Mantosh; conversation will remain available" title="Minimize — conversation stays here"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 12h12"></path></svg></button>
          <button class="ask-mantosh-close ask-mantosh-clear" id="ask-mantosh-clear" type="button" aria-label="Close Ask Mantosh and clear conversation" title="Close and clear conversation"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M7 7l10 10M17 7L7 17"></path></svg></button>
        </div>
      </div>
      <div class="ask-mantosh-body">
        <div class="ask-mantosh-conversation"><div class="ask-mantosh-messages" id="ask-mantosh-messages" role="log" aria-live="polite" aria-relevant="additions text" aria-label="Ask Mantosh conversation"></div><button class="ask-mantosh-jump" id="ask-mantosh-jump" type="button" hidden>Jump to latest</button></div>
        <div class="ask-mantosh-suggestions" id="ask-mantosh-suggestions" aria-label="Suggested questions" hidden></div>
        <div class="ask-mantosh-status" id="ask-mantosh-status" role="status" aria-live="polite"></div>
        <div class="ask-mantosh-composer-hint" aria-hidden="true"><span><kbd>Enter</kbd> send</span><span><kbd>Shift</kbd> + <kbd>Enter</kbd> new line</span></div>
        <form class="ask-mantosh-composer" id="ask-mantosh-form"><label class="sr-only" for="ask-mantosh-input">Ask about Mantosh's engineering work</label><textarea id="ask-mantosh-input" rows="1" placeholder="Ask about Mantosh's engineering work..." maxlength="1000"></textarea><button class="ask-mantosh-send" id="ask-mantosh-send" type="submit" aria-label="Send message">Send</button></form>
      </div>
    </section>`);

  const client = document.createElement("script");
  client.src = "/assets/js/main.js?v=20260713-3";
  document.body.append(client);
})();

(() => {
  const supportedThemes = new Set(["auto", "light", "dark", "soft", "contrast"]);
  let theme = "soft";
  try {
    const storedTheme = window.localStorage.getItem("mantosh-appearance");
    if (supportedThemes.has(storedTheme)) theme = storedTheme;
  } catch { /* Soft remains the first-visit default when storage is unavailable. */ }
  if (theme === "auto") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.dataset.theme = theme;
})();

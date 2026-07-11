/* Privacy-conscious AI-referral signal. It sends no request and collects no IDs. */
(() => {
  let host = "";
  try { host = document.referrer ? new URL(document.referrer).hostname.toLowerCase() : ""; } catch { return; }
  const sources = [
    ["chatgpt.com", "chatgpt"],
    ["perplexity.ai", "perplexity"],
    ["claude.ai", "claude"],
    ["copilot.microsoft.com", "copilot"],
    ["gemini.google.com", "gemini"]
  ];
  const source = sources.find(([domain]) => host === domain || host.endsWith(`.${domain}`))?.[1];
  if (!source) return;

  document.documentElement.dataset.aiReferral = source;
  window.dispatchEvent(new CustomEvent("ai-referral", { detail: { source } }));

  // Optional integrations: enable one analytics provider independently.
  if (typeof window.umami?.track === "function") window.umami.track("AI referral", { source });
  if (typeof window.plausible === "function") window.plausible("AI referral", { props: { source } });
})();

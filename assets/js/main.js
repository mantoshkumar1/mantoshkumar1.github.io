/* Ask Mantosh: isolated vanilla-JS chat client. External rendering libraries are lazy-loaded. */
const PORTFOLIO_QUESTIONS = [
  "Which project should I explore first?",
  "How did Mantosh modernize validation infrastructure?",
  "What problems has Mantosh solved with Python?",
  "Tell me about Mantosh's engineering experience.",
  "What are Mantosh's strongest technical skills?"
];

const PAGE_QUESTIONS = {
  "/projects/legacy-validation-framework-migration.html": ["Why was this migration difficult?", "How was rollout coordinated?", "What changed after migration?"],
  "/projects/photosahi.html": ["Why was PhotoSahi built without a backend?", "How does PhotoSahi protect privacy?", "How does browser-side image processing work?"],
  "/projects/validation-platform-optical-networking.html": ["What problem does the validation platform solve?", "How does it investigate failures?", "How does it improve release decisions?"],
  "/projects/gtt-price-calculator.html": ["What does the GTT calculator help investors check?", "What safety boundaries does it preserve?", "Why is the calculation kept separate from trading?"],
  "/projects/workflow-automation-toolkit.html": ["Which workflows does the toolkit automate?", "Why does it process files locally?", "How does it preserve user control?"],
  "/projects/engineering-knowledge-system.html": ["How does Ask Mantosh stay grounded in evidence?", "Why combine lexical and semantic retrieval?", "How is unsupported content prevented?"]
};

const DEFAULT_READING = [
  { title: "Projects", url: "/projects/", category: "Portfolio" },
  { title: "Engineering experience", url: "/experience/", category: "Experience" },
  { title: "Engineering notes", url: "/insights/", category: "Insights" },
  { title: "Résumé", url: "/resume/", category: "Résumé" }
];

function shuffled(values) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

function welcomeQuestions(pathname) {
  return PAGE_QUESTIONS[pathname] || shuffled(PORTFOLIO_QUESTIONS).slice(0, 3);
}

class MarkdownService {
  constructor() { this.loader = null; }

  appendInline(target, text) {
    const inlinePattern = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*\n]+)\*\*/g;
    let cursor = 0;
    for (const match of text.matchAll(inlinePattern)) {
      target.append(document.createTextNode(text.slice(cursor, match.index)));
      if (match[3]) {
        const strong = document.createElement("strong"); strong.textContent = match[3]; target.append(strong);
      } else {
        try {
          const url = new URL(match[2], window.location.origin);
          if (url.origin !== window.location.origin && url.protocol !== "https:") throw new Error("Unsupported link");
          const link = document.createElement("a");
          link.href = url.href; link.textContent = match[1];
          if (url.origin !== window.location.origin) { link.target = "_blank"; link.rel = "noopener noreferrer"; }
          target.append(link);
        } catch { target.append(document.createTextNode(match[1])); }
      }
      cursor = match.index + match[0].length;
    }
    target.append(document.createTextNode(text.slice(cursor)));
  }

  renderBasic(markdown, target) {
    target.replaceChildren();
    let list = null;
    for (const rawLine of markdown.split("\n")) {
      const line = rawLine.trim();
      if (!line) { list = null; continue; }
      const heading = /^(#{1,4})\s+(.+)$/.exec(line);
      if (heading) {
        list = null;
        const node = document.createElement(heading[1].length <= 2 ? "h2" : "h3");
        this.appendInline(node, heading[2]); target.append(node); continue;
      }
      const bullet = /^(?:[-*•]|\d+[.)])\s+(.+)$/.exec(line);
      if (bullet) {
        if (!list) { list = document.createElement("ul"); target.append(list); }
        const item = document.createElement("li"); this.appendInline(item, bullet[1]); list.append(item); continue;
      }
      list = null;
      const paragraph = document.createElement("p"); this.appendInline(paragraph, line); target.append(paragraph);
    }
  }

  async load() {
    if (!this.loader) {
      this.loader = Promise.all([
        import("https://cdn.jsdelivr.net/npm/marked@15.0.7/+esm"),
        import("https://cdn.jsdelivr.net/npm/dompurify@3.2.4/+esm"),
        import("https://cdn.jsdelivr.net/npm/highlight.js@11.11.1/es/common.min.js")
      ]).then(([markedModule, purifierModule, highlightModule]) => ({
        marked: markedModule.marked,
        sanitize: purifierModule.default.sanitize.bind(purifierModule.default),
        highlight: highlightModule.default
      }));
    }
    return this.loader;
  }

  async render(markdown, target) {
    this.renderBasic(markdown, target);
    let tools;
    try { tools = await this.load(); } catch { return; }
    const { marked, sanitize, highlight } = tools;
    target.innerHTML = sanitize(marked.parse(markdown, { gfm: true, breaks: true }));
    target.querySelectorAll("a").forEach((link) => { link.target = "_blank"; link.rel = "noopener noreferrer"; });
    target.querySelectorAll("pre code").forEach((code) => {
      highlight.highlightElement(code);
      const pre = code.parentElement;
      const language = [...code.classList].find((name) => name.startsWith("language-"))?.replace("language-", "") || "text";
      const toolbar = document.createElement("div");
      toolbar.className = "ask-mantosh-code-toolbar";
      toolbar.innerHTML = `<span>${language}</span><button type="button" data-copy-code aria-label="Copy ${language} code">Copy code</button>`;
      pre.prepend(toolbar);
    });
  }
}

class ChatApi {
  constructor(url) { this.url = url; }

  async stream(question, conversationId, signal, onEvent) {
    if (!this.url) throw new Error("Ask Mantosh is not configured yet.");
    const response = await fetch(this.url, {
      method: "POST", signal,
      headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
      body: JSON.stringify({ question, conversationId })
    });
    if (!response.ok || !response.body) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error?.message || "I couldn't answer that right now. Please try again.");
    }
    const contentType = response.headers.get("Content-Type") || "";
    if (contentType.includes("application/json")) {
      const payload = await response.json();
      onEvent("metadata", payload);
      if (payload.answer) onEvent("response.output_text.delta", { delta: payload.answer });
      onEvent("done", {});
      return;
    }
    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += value;
      const frames = buffer.split("\n\n");
      buffer = frames.pop();
      frames.forEach((frame) => this.parseFrame(frame, onEvent));
    }
    if (buffer.trim()) this.parseFrame(buffer, onEvent);
  }

  parseFrame(frame, onEvent) {
    const type = frame.match(/^event:\s*(.+)$/m)?.[1] || "message";
    const raw = frame.match(/^data:\s*(.+)$/m)?.[1];
    if (!raw) return;
    try { onEvent(type, JSON.parse(raw)); } catch { /* Ignore malformed upstream frames. */ }
  }
}

class ConversationView {
  constructor({ messages, suggestions, jump, status, markdown }) {
    this.messages = messages; this.suggestions = suggestions; this.jump = jump; this.status = status; this.markdown = markdown;
    this.nodes = new Map(); this.followUps = [];
    messages.addEventListener("scroll", () => this.updateJump());
    jump.addEventListener("click", () => this.scrollToLatest(true));
    messages.addEventListener("click", (event) => this.handleAction(event));
  }

  isNearBottom() { return this.messages.scrollHeight - this.messages.scrollTop - this.messages.clientHeight < 96; }
  scrollToLatest(force = false) { if (force || this.isNearBottom()) this.messages.scrollTo({ top: this.messages.scrollHeight, behavior: "smooth" }); this.updateJump(); }
  scrollToMessageStart(node) {
    const messagesRect = this.messages.getBoundingClientRect();
    const messageRect = node.getBoundingClientRect();
    const top = this.messages.scrollTop + messageRect.top - messagesRect.top - 4;
    this.messages.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    this.updateJump();
  }
  updateJump() { this.jump.hidden = this.isNearBottom(); }
  setStatus(text) { this.status.textContent = text; }
  setStreaming(active) {
    this.messages.setAttribute("aria-busy", String(active));
    this.messages.setAttribute("aria-live", active ? "off" : "polite");
  }

  showEmpty(onAsk) {
    this.messages.innerHTML = "";
    const empty = document.createElement("section");
    empty.className = "ask-mantosh-empty";
    empty.innerHTML = "<p>Grounded in published projects, case studies, and engineering notes.</p>";
    this.messages.append(empty); this.setSuggestions(welcomeQuestions(window.location.pathname), onAsk); this.updateJump();
  }

  add(message) {
    const shouldScroll = this.isNearBottom();
    this.messages.querySelector(".ask-mantosh-empty")?.remove();
    const node = document.createElement("article");
    node.className = `ask-mantosh-message ${message.role}`;
    node.dataset.messageId = message.id;
    if (message.role === "user") node.innerHTML = `<header><span>You</span></header><p></p>`;
    else node.innerHTML = "<header><span>Ask Mantosh</span><div class=\"ask-mantosh-message-actions\"><button type=\"button\" data-copy-answer aria-label=\"Copy answer\">Copy</button><button type=\"button\" data-copy-markdown aria-label=\"Copy answer as Markdown\">Markdown</button></div></header><div class=\"ask-mantosh-answer\"></div>";
    if (message.role === "user") node.querySelector("p").textContent = message.text;
    this.messages.append(node); this.nodes.set(message.id, node);
    if (message.role === "assistant") this.updateAssistant(message, { streaming: true });
    if (shouldScroll) this.scrollToLatest(true); else this.updateJump();
  }

  updateAssistant(message, { streaming = false, focus = true } = {}) {
    const node = this.nodes.get(message.id); if (!node) return;
    const answer = node.querySelector(".ask-mantosh-answer");
    let rendered;
    if (streaming) answer.textContent = message.text;
    else rendered = this.markdown.render(message.text, answer).catch(() => { answer.textContent = message.text; });
    node.classList.toggle("is-streaming", streaming);
    if (streaming) {
      if (!node.querySelector(".ask-mantosh-cursor")) answer.insertAdjacentHTML("beforeend", "<span class=\"ask-mantosh-cursor\" aria-hidden=\"true\"></span>");
      if (!message.text) answer.innerHTML = "<span class=\"ask-mantosh-typing\" aria-label=\"Ask Mantosh is thinking\"><span></span><span></span><span></span></span>";
    } else {
      this.renderMeta(node, message);
    }
    if (!streaming && focus) rendered.finally(() => requestAnimationFrame(() => this.scrollToMessageStart(node)));
    else this.updateJump();
  }

  renderMeta(node, message) {
    node.querySelector(".ask-mantosh-answer")?.parentElement.querySelector(".ask-mantosh-response-meta")?.remove();
    const meta = document.createElement("div"); meta.className = "ask-mantosh-response-meta";
    if (message.error) meta.innerHTML = `<div class=\"ask-mantosh-error\"><p>${this.escape(message.error)}</p><button type=\"button\" data-retry=\"${this.escape(message.question)}\">Try again</button></div>`;
    if (message.action?.type === "navigate" && message.action.url) {
      meta.insertAdjacentHTML("beforeend", `<a class=\"button secondary\" href=\"${this.safeUrl(message.action.url)}\" target=\"_blank\" rel=\"noopener noreferrer\">Open ${this.escape(message.action.label || "page")} <span aria-hidden=\"true\">↗</span></a>`);
    }
    if (!message.error) {
      const related = this.relatedReading(message);
      if (related.length) meta.insertAdjacentHTML("beforeend", `<section class=\"ask-mantosh-related\"><h4>Related reading</h4><div class=\"ask-mantosh-reading-list\">${related.map((item) => `<a href=\"${this.safeUrl(item.url)}\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"ask-mantosh-reading-link\"><span>${this.escape(item.category || "Read")}</span><strong>${this.escape(item.title)}</strong><span aria-hidden=\"true\">→</span></a>`).join("")}</div></section>`);
      if (message.sources?.length) {
        const sourceList = message.sources.map((source) => `<a class=\"ask-mantosh-source\" href=\"${this.safeUrl(source.url)}\" target=\"_blank\" rel=\"noopener noreferrer\" data-summary=\"${this.escape(source.summary || "Published engineering knowledge")}\"><span aria-hidden=\"true\">✓</span><span>${this.escape(source.label)}</span></a>`).join("");
        meta.insertAdjacentHTML("beforeend", `<footer class=\"ask-mantosh-sources\"><h4>Grounded in</h4><div>${sourceList}</div></footer>`);
      }
    }
    if (meta.childElementCount) node.append(meta);
  }

  relatedReading(message) {
    const candidates = [...(message.recommendations || [])];
    if (message.action?.url) candidates.unshift({ title: message.action.label || "Open page", url: message.action.url, category: message.action.destinationType || "Page" });
    candidates.push(...DEFAULT_READING);
    const seen = new Set();
    return candidates.filter((item) => {
      if (!item?.url || !item.title) return false;
      const safe = this.safeUrl(item.url);
      if (safe === "#" || seen.has(safe)) return false;
      seen.add(safe); return true;
    }).slice(0, 2);
  }

  setSuggestions(questions, onAsk, compact = false) {
    this.followUps = (questions || []).map((question) => question.replace(/(\babout\s+[a-z]+)-([a-z]+\?)/gi, "$1 $2").replace(/\?+\s*$/, "?"));
    const visible = compact ? this.followUps.slice(0, 1) : this.followUps;
    this.suggestions.hidden = !this.followUps.length;
    this.suggestions.classList.toggle("is-compact", compact && visible.length > 0);
    this.suggestions.innerHTML = `<div>${visible.map((question) => `<button class=\"ask-mantosh-chip${compact ? " ask-mantosh-next" : ""}\" type=\"button\" data-suggestion=\"${this.escape(question)}\"><span>${this.escape(question)}</span>${compact ? '<span aria-hidden=\"true\">→</span>' : ""}</button>`).join("")}</div>`;
    this.onAsk = onAsk;
  }
  handleAction(event) {
    const copy = event.target.closest("[data-copy-answer], [data-copy-markdown], [data-copy-code]");
    if (copy) {
      const article = copy.closest(".ask-mantosh-message"); const message = this.getMessage?.(article?.dataset.messageId);
      const content = copy.hasAttribute("data-copy-code") ? copy.closest("pre")?.querySelector("code")?.innerText : message?.text;
      if (content) navigator.clipboard?.writeText(content).then(() => { const label = copy.textContent; copy.textContent = "Copied"; setTimeout(() => { copy.textContent = label; }, 1200); });
    }
    const retry = event.target.closest("[data-retry]"); if (retry) this.onAsk?.(retry.dataset.retry);
    const suggestion = event.target.closest("[data-suggestion]"); if (suggestion) this.onAsk?.(suggestion.dataset.suggestion);
  }
  escape(value) { const div = document.createElement("div"); div.textContent = value || ""; return div.innerHTML; }
  safeUrl(value) { try { const url = new URL(value, window.location.origin); return url.protocol === "https:" || url.origin === window.location.origin ? url.href : "#"; } catch { return "#"; } }
}

class AskMantoshApp {
  constructor(elements) {
    this.elements = elements; this.messages = []; this.id = 0; this.controller = null; this.generation = 0;
    this.storageKey = "ask-mantosh-conversation-v1";
    this.conversationId = this.newConversationId();
    this.view = new ConversationView({ ...elements, markdown: new MarkdownService() }); this.view.getMessage = (id) => this.messages.find((message) => String(message.id) === String(id));
    this.api = new ChatApi(elements.panel.dataset.apiUrl || window.ASK_MANTOSH_API_URL || "");
  }
  newConversationId() { return `web_${crypto.randomUUID().replaceAll("-", "_")}`; }
  loadSession() {
    try {
      const snapshot = JSON.parse(window.sessionStorage.getItem(this.storageKey) || "null");
      if (!snapshot || !Array.isArray(snapshot.messages)) return false;
      if (/^[a-zA-Z0-9_-]{16,128}$/.test(snapshot.conversationId || "")) this.conversationId = snapshot.conversationId;
      this.messages = snapshot.messages.slice(-20)
        .filter((message) => message && ["user", "assistant"].includes(message.role) && typeof message.text === "string")
        .map((message) => ({ ...message, sources: Array.isArray(message.sources) ? message.sources : [], recommendations: Array.isArray(message.recommendations) ? message.recommendations : [], followUps: Array.isArray(message.followUps) ? message.followUps : [] }));
      this.messages.forEach((message) => {
        if (message.role === "assistant" && !message.text && !message.error) message.error = "The previous response was interrupted. Try again.";
        this.view.add(message);
        if (message.role === "assistant") this.view.updateAssistant(message, { focus: false });
      });
      this.id = this.messages.reduce((highest, message) => Math.max(highest, Number(message.id) || 0), 0);
      const latestAssistant = [...this.messages].reverse().find((message) => message.role === "assistant");
      if (latestAssistant?.followUps?.length) {
        latestAssistant.followUps = this.usableFollowUps(latestAssistant.followUps);
        if (!latestAssistant.followUps.length) latestAssistant.followUps = this.contextualFollowUps(latestAssistant);
        this.view.setSuggestions(latestAssistant.followUps, (question) => this.ask(question), true);
      }
      return this.messages.length > 0;
    } catch { return false; }
  }
  saveSession() {
    try {
      const messages = this.messages.slice(-20).map(({ id, role, text, question, sources, recommendations, followUps, error, action }) => ({ id, role, text, question, sources, recommendations, followUps, error, action }));
      window.sessionStorage.setItem(this.storageKey, JSON.stringify({ conversationId: this.conversationId, messages }));
    } catch { /* Chat remains usable when storage is unavailable. */ }
  }
  init() {
    const { toggle, exportButton, minimize, clear, backdrop, panel, form, input, send, suggestions } = this.elements;
    toggle.addEventListener("click", () => this.open()); exportButton.addEventListener("click", () => this.exportConversation()); minimize.addEventListener("click", () => this.close()); clear.addEventListener("click", () => this.clearConversation()); backdrop.addEventListener("click", () => this.close());
    form.addEventListener("submit", (event) => { event.preventDefault(); this.ask(input.value); });
    suggestions.addEventListener("click", (event) => { const button = event.target.closest("[data-suggestion]"); if (button) this.ask(button.dataset.suggestion); });
    input.addEventListener("input", () => this.resize()); input.addEventListener("keydown", (event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); this.ask(input.value); } });
    document.addEventListener("keydown", (event) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); this.open(); } if (event.key === "Escape" && !panel.hidden) this.close(); });
    panel.addEventListener("keydown", (event) => this.trapFocus(event));
    this.view.onAsk = (question) => this.ask(question);
    if (!this.loadSession()) this.view.showEmpty((question) => this.ask(question));
    this.updateExportAvailability();
    this.resize();
  }
  open() { if (this.elements.panel.hidden) { this.previousFocus = document.activeElement; this.elements.panel.hidden = false; this.elements.backdrop.hidden = false; document.body.classList.add("ask-mantosh-open"); this.elements.toggle.setAttribute("aria-expanded", "true"); requestAnimationFrame(() => this.elements.input.focus()); } }
  close() { if (!this.elements.panel.hidden) { this.elements.panel.hidden = true; this.elements.backdrop.hidden = true; document.body.classList.remove("ask-mantosh-open"); this.elements.toggle.setAttribute("aria-expanded", "false"); this.previousFocus?.focus?.(); } }
  clearConversation() {
    if (this.messages.length && !window.confirm("Close Ask Mantosh and clear this conversation?")) return;
    this.generation += 1;
    this.controller?.abort(); this.controller = null; this.messages = []; this.id = 0; this.conversationId = this.newConversationId();
    try { window.sessionStorage.removeItem(this.storageKey); window.localStorage.removeItem("ask-mantosh-audience-v1"); } catch { /* The visible conversation can still be cleared. */ }
    this.view.nodes.clear(); this.view.setStreaming(false); this.view.setStatus(""); this.view.showEmpty((question) => this.ask(question));
    this.updateExportAvailability();
    this.elements.input.value = ""; this.resize(); this.close();
  }
  updateExportAvailability() {
    this.elements.exportButton.hidden = !this.messages.some((message) => message.role === "assistant" && message.text.trim());
  }
  exportConversation() {
    const visibleMessages = this.messages.filter((message) => message.text.trim());
    if (!visibleMessages.some((message) => message.role === "assistant")) return;
    const transcript = [
      "Ask Mantosh conversation",
      "",
      ...visibleMessages.flatMap((message) => [message.role === "user" ? "You" : "Ask Mantosh", message.text.trim(), ""])
    ].join("\n").trimEnd() + "\n";
    const blob = new Blob([transcript], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ask-mantosh-conversation-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    this.view.setStatus("Conversation exported as TXT.");
  }
  trapFocus(event) {
    if (event.key !== "Tab") return;
    const focusable = [...this.elements.panel.querySelectorAll("button:not([disabled]), a[href], textarea:not([disabled])")];
    if (!focusable.length) return;
    const first = focusable[0]; const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  resize() { const { input, send } = this.elements; input.style.height = "auto"; input.style.height = `${Math.min(input.scrollHeight, 150)}px`; send.disabled = !input.value.trim(); }
  add(role, text, extra = {}) { const message = { id: ++this.id, role, text, ...extra }; this.messages.push(message); this.view.add(message); this.saveSession(); return message; }
  async ask(rawQuestion) {
    const question = rawQuestion.trim(); if (!question) return; this.open();
    if (this.controller) this.controller.abort();
    const generation = this.generation;
    const user = this.add("user", question); const assistant = this.add("assistant", "", { question, sources: [] });
    this.elements.input.value = ""; this.resize(); this.view.setSuggestions([], () => this.ask()); this.view.setStreaming(true); this.view.setStatus("Searching published engineering knowledge…");
    const controller = new AbortController(); this.controller = controller; let frameId = 0;
    const render = () => { frameId = 0; this.view.updateAssistant(assistant, { streaming: true }); };
    const cancelPendingRender = () => { if (frameId) { cancelAnimationFrame(frameId); frameId = 0; } };
    try {
      await this.api.stream(question, this.conversationId, controller.signal, (type, data) => {
        if (generation !== this.generation) return;
        if (type === "metadata") {
          assistant.sources = data.sources || [];
          assistant.recommendations = data.recommendations || [];
          assistant.followUps = data.followUpQuestions || data.suggestedQuestions || [];
          assistant.action = data.action || null;
          if (/^[a-zA-Z0-9_-]{16,128}$/.test(data.conversationId || "")) this.conversationId = data.conversationId;
        }
        if (type === "response.output_text.delta") { assistant.text += data.delta || ""; if (!frameId) frameId = requestAnimationFrame(render); }
        if (type === "error") throw new Error(data.message || "The response stream was interrupted.");
      });
      cancelPendingRender();
      this.finish(assistant);
    } catch (error) {
      cancelPendingRender();
      if (generation !== this.generation) return;
      if (error.name === "AbortError") { assistant.text ||= "Response stopped."; this.finish(assistant); }
      else {
        assistant.error = error instanceof TypeError
          ? "Ask Mantosh couldn't be reached. Check your connection and try again."
          : (error.message || "I couldn't answer that right now. Please try again.");
        this.finish(assistant);
      }
    } finally { if (this.controller === controller) { this.controller = null; } }
  }
  finish(message) {
    message.followUps = this.usableFollowUps(message.followUps);
    if (!message.followUps.length) message.followUps = this.contextualFollowUps(message);
    message.text = this.stripResponseSections(message.text);
    this.view.setStreaming(false);
    this.view.updateAssistant(message);
    this.view.setSuggestions(message.error ? [] : message.followUps, (question) => this.ask(question), true);
    this.saveSession();
    this.updateExportAvailability();
    this.view.setStatus("");
  }
  stripResponseSections(text) { return text.replace(/\n*##\s+(?:Sources|Follow-up Questions)\s*\n[\s\S]*$/i, "").trim(); }
  followUps(text) { const match = /^##\s+Follow-up Questions\s*$([\s\S]*?)(?=^##\s+|$)/im.exec(text); return match ? match[1].split("\n").map((line) => line.replace(/^\s*(?:[-*]|\d+[.)])\s+/, "").trim()).filter((line) => line.endsWith("?")).slice(0, 3) : []; }
  usableFollowUps(questions) {
    return (questions || []).map((question) => String(question || "").trim())
      .filter((question) => question.endsWith("?") && question.length <= 72 && question.split(/\s+/).length <= 12)
      .slice(0, 3);
  }
  contextualFollowUps(message) {
    const generated = this.followUps(message.text); if (generated.length) return generated;
    const value = `${message.question || ""} ${message.sources?.map((source) => source.title).join(" ") || ""}`.toLowerCase();
    if (/photosahi|photo|privacy|browser-side/.test(value)) return ["What did Mantosh personally own?", "Which skills does PhotoSahi demonstrate?", "Where could this experience add value?"];
    if (/migration|validation|rollout|regression/.test(value)) return ["What did Mantosh personally own?", "What outcomes did the migration produce?", "Which skills does this project demonstrate?"];
    if (/skill|experience|engineer|hire|python/.test(value)) return ["Where could Mantosh add the most value?", "Which projects best demonstrate his fit?", "What has Mantosh personally owned?"];
    return ["Which project best demonstrates Mantosh's fit?", "What has Mantosh personally owned?", "Where could Mantosh add the most value?"];
  }
}

const initializeAskMantosh = () => {
  document.querySelector("[data-year]")?.replaceChildren(String(new Date().getFullYear()));
  const byId = (id) => document.getElementById(id);
  const elements = { toggle: byId("ask-mantosh-toggle"), exportButton: byId("ask-mantosh-export"), minimize: byId("ask-mantosh-minimize"), clear: byId("ask-mantosh-clear"), backdrop: byId("ask-mantosh-backdrop"), panel: byId("ask-mantosh-panel"), form: byId("ask-mantosh-form"), input: byId("ask-mantosh-input"), send: byId("ask-mantosh-send"), messages: byId("ask-mantosh-messages"), suggestions: byId("ask-mantosh-suggestions"), jump: byId("ask-mantosh-jump"), status: byId("ask-mantosh-status") };
  if (Object.values(elements).every(Boolean)) {
    const app = new AskMantoshApp(elements);
    app.init();
    document.addEventListener("click", (event) => {
      const trigger = event.target.closest('a[href="#ask-mantosh"], [data-open-ask-mantosh]');
      if (!trigger) return;
      event.preventDefault();
      app.open();
    });
    if (window.location.hash === "#ask-mantosh") app.open();
  }
};

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initializeAskMantosh);
else initializeAskMantosh();

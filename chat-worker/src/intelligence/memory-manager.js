const MAX_MESSAGE_CHARS = 2_000;

function nowSeconds() { return Math.floor(Date.now() / 1000); }

function compact(value, max = 320) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length <= max ? normalized : `${normalized.slice(0, max - 1)}…`;
}

function buildSummary(messages) {
  const userTopics = messages.filter((message) => message.role === "user").map((message) => compact(message.content, 180));
  const citations = messages.flatMap((message) => {
    try { return JSON.parse(message.source_labels || "[]"); } catch { return []; }
  });
  const parts = [];
  if (userTopics.length) parts.push(`Earlier visitor topics: ${[...new Set(userTopics)].slice(-4).join(" | ")}`);
  if (citations.length) parts.push(`Previously cited sources: ${[...new Set(citations)].slice(-6).join(", ")}`);
  return compact(parts.join(". "), 1_000);
}

export class MemoryManager {
  constructor(db, config) {
    this.db = db;
    this.config = config;
  }

  async load(conversationId) {
    if (!this.db) return { summary: "", messages: [] };
    const now = nowSeconds();
    await this.db.prepare("DELETE FROM conversation_sessions WHERE expires_at < ?").bind(now).run();
    const session = await this.db.prepare("SELECT summary FROM conversation_sessions WHERE conversation_id = ? AND expires_at >= ?").bind(conversationId, now).first();
    if (!session) return { summary: "", messages: [] };
    const result = await this.db.prepare(
      "SELECT role, content, source_labels FROM conversation_messages WHERE conversation_id = ? ORDER BY id DESC LIMIT ?"
    ).bind(conversationId, this.config.conversationHistoryTurns * 2).all();
    return { summary: session.summary || "", messages: (result.results || []).reverse() };
  }

  async recordTurn({ conversationId, question, answer, sources }) {
    if (!this.db) return;
    const now = nowSeconds();
    const expiresAt = now + this.config.conversationTtlSeconds;
    const labels = JSON.stringify((sources || []).map((source) => source.label).filter(Boolean));
    const statements = [
      this.db.prepare(
        `INSERT INTO conversation_sessions (conversation_id, summary, expires_at, created_at, updated_at) VALUES (?, '', ?, ?, ?)
         ON CONFLICT(conversation_id) DO UPDATE SET expires_at=excluded.expires_at, updated_at=excluded.updated_at`
      ).bind(conversationId, expiresAt, now, now),
      this.db.prepare("INSERT INTO conversation_messages (conversation_id, role, content, source_labels, created_at) VALUES (?, 'user', ?, '[]', ?)")
        .bind(conversationId, compact(question, MAX_MESSAGE_CHARS), now),
      this.db.prepare("INSERT INTO conversation_messages (conversation_id, role, content, source_labels, created_at) VALUES (?, 'assistant', ?, ?, ?)")
        .bind(conversationId, compact(answer, MAX_MESSAGE_CHARS), labels, now)
    ];
    await this.db.batch(statements);

    const result = await this.db.prepare(
      "SELECT role, content, source_labels FROM conversation_messages WHERE conversation_id = ? ORDER BY id DESC LIMIT 12"
    ).bind(conversationId).all();
    const messages = (result.results || []).reverse();
    if (messages.length >= 10) {
      await this.db.prepare("UPDATE conversation_sessions SET summary = ?, updated_at = ? WHERE conversation_id = ?")
        .bind(buildSummary(messages.slice(0, -4)), now, conversationId).run();
      const ids = await this.db.prepare(
        "SELECT id FROM conversation_messages WHERE conversation_id = ? ORDER BY id DESC LIMIT -1 OFFSET ?"
      ).bind(conversationId, this.config.conversationHistoryTurns * 2).all();
      const staleIds = (ids.results || []).map((row) => row.id);
      if (staleIds.length) await this.db.batch(staleIds.map((id) => this.db.prepare("DELETE FROM conversation_messages WHERE id = ?").bind(id)));
    }
  }

  buildRetrievalQuery(question, memory) {
    const recentQuestion = [...memory.messages].reverse().find((message) => message.role === "user")?.content;
    if (!recentQuestion || recentQuestion === question) return question;
    return `${question}\n\nPrevious conversation topic: ${recentQuestion}`;
  }
}

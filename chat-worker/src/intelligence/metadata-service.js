function toDestination(row) {
  return { id: row.path, label: row.title, title: row.title, category: row.category, url: row.url, type: row.category };
}

export class MetadataService {
  constructor(db) { this.db = db; }

  async findByTitle(normalizedTitle) {
    if (!this.db || !normalizedTitle) return null;
    const row = await this.db.prepare(
      `SELECT path, title, category, url FROM documents
       WHERE visibility = 'public' AND lower(replace(replace(title, '-', ' '), ':', ' ')) = ? AND url <> '' LIMIT 1`
    ).bind(normalizedTitle).first();
    return row ? toDestination(row) : null;
  }

  async latestByCategory(category) {
    if (!this.db) return null;
    const row = await this.db.prepare(
      "SELECT path, title, category, url FROM documents WHERE visibility = 'public' AND category = ? AND url <> '' ORDER BY last_updated DESC, title ASC LIMIT 1"
    ).bind(category).first();
    return row ? toDestination(row) : null;
  }

  async profileFacts() {
    if (!this.db) return null;
    const result = await this.db.prepare(
      "SELECT fact_key, fact_value FROM profile_facts WHERE source_path = ? ORDER BY fact_key"
    ).bind("knowledge/faq/about-mantosh.md").all();
    const entries = (result.results || []).map((row) => [row.fact_key, safeFactValue(row.fact_value)]);
    return entries.length ? Object.fromEntries(entries) : null;
  }

  async related({ sources, limit }) {
    if (!this.db || !sources.length) return [];
    const paths = sources.map((source) => source.path).filter(Boolean);
    const tokens = [...new Set(sources.flatMap((source) => {
      const tags = typeof source.tags === "string" ? safeJson(source.tags) : source.tags || [];
      const topics = typeof source.related_topics === "string" ? safeJson(source.related_topics) : source.related_topics || [];
      return [...tags, ...topics];
    }).filter((token) => typeof token === "string" && token.length > 1))].slice(0, 12);
    if (!tokens.length) return [];
    const pathPlaceholders = paths.map(() => "?").join(",") || "''";
    const tokenPredicates = tokens.map(() => "(tags LIKE ? OR related_topics LIKE ?)").join(" OR ");
    const statement = this.db.prepare(
      `SELECT path, title, slug, category, tags, summary, related_topics, url, last_updated FROM documents
       WHERE visibility = 'public' AND url <> '' AND path NOT IN (${pathPlaceholders}) AND (${tokenPredicates})
       ORDER BY last_updated DESC, title ASC LIMIT ?`
    );
    const bindings = [...paths, ...tokens.flatMap((token) => [`%${token}%`, `%${token}%`]), limit];
    const result = await statement.bind(...bindings).all();
    return result.results || [];
  }
}

function safeFactValue(value) {
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === "string") return parsed;
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) return parsed;
  } catch { /* Invalid stored facts fail closed. */ }
  return null;
}

function safeJson(value) {
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
}

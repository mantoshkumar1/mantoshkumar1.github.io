function day() { return new Date().toISOString().slice(0, 10); }

const AGGREGATE_DIMENSIONS = Object.freeze({
  relevance_gate: new Set(["blocked", "continued_related", "continued_uncertain"]),
  lexical_coverage: new Set(["coverage_0", "coverage_1_39", "coverage_40_69", "coverage_70_100"]),
  post_gate_outcome: new Set(["grounded_answer", "knowledge_gap"]),
  ai_call_avoided: new Set(["embedding", "generation"])
});

async function hash(value) {
  const bytes = new TextEncoder().encode(value.toLowerCase().replace(/\s+/g, " ").trim());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].slice(0, 12).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export class AnalyticsService {
  constructor(db) { this.db = db; }

  async track(eventType, dimension) {
    if (!this.db || !dimension) return;
    const safeDimension = await hash(dimension);
    const now = Math.floor(Date.now() / 1000);
    await this.db.prepare(
      `INSERT INTO intelligence_analytics (event_day, event_type, dimension, count, updated_at) VALUES (?, ?, ?, 1, ?)
       ON CONFLICT(event_day, event_type, dimension) DO UPDATE SET count = count + 1, updated_at = excluded.updated_at`
    ).bind(day(), eventType, safeDimension, now).run();
  }

  trackInBackground(ctx, eventType, dimension) {
    const task = this.track(eventType, dimension).catch((error) => console.error("analytics write failed", error.message));
    if (ctx?.waitUntil) ctx.waitUntil(task);
  }

  async trackAggregate(metric, dimension) {
    if (!this.db || !AGGREGATE_DIMENSIONS[metric]?.has(dimension)) return;
    const now = Math.floor(Date.now() / 1000);
    await this.db.prepare(
      `INSERT INTO intelligence_analytics (event_day, event_type, dimension, count, updated_at) VALUES (?, ?, ?, 1, ?)
       ON CONFLICT(event_day, event_type, dimension) DO UPDATE SET count = count + 1, updated_at = excluded.updated_at`
    ).bind(day(), `aggregate:${metric}`, dimension, now).run();
  }

  async trackAggregates(metrics) {
    if (!this.db) return;
    const safeMetrics = metrics.filter(([metric, dimension]) => AGGREGATE_DIMENSIONS[metric]?.has(dimension));
    if (!safeMetrics.length) return;
    const now = Math.floor(Date.now() / 1000);
    const statements = safeMetrics.map(([metric, dimension]) => this.db.prepare(
      `INSERT INTO intelligence_analytics (event_day, event_type, dimension, count, updated_at) VALUES (?, ?, ?, 1, ?)
       ON CONFLICT(event_day, event_type, dimension) DO UPDATE SET count = count + 1, updated_at = excluded.updated_at`
    ).bind(day(), `aggregate:${metric}`, dimension, now));
    await this.db.batch(statements);
  }

  trackAggregatesInBackground(ctx, metrics) {
    const task = this.trackAggregates(metrics)
      .catch((error) => console.error("aggregate analytics write failed", error.message));
    if (ctx?.waitUntil) ctx.waitUntil(task);
  }
}

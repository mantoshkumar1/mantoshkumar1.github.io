function day() { return new Date().toISOString().slice(0, 10); }

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
}

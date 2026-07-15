import { AppError } from "./errors.js";

function utcDay() {
  return new Date().toISOString().slice(0, 10);
}

function utcMinute() {
  return new Date().toISOString().slice(0, 16);
}

function secondsUntilNextUtcDay() {
  const now = new Date();
  const nextDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return Math.max(1, Math.ceil((nextDay - now.getTime()) / 1_000));
}

export async function enforceStrictRequestLimit(env, config) {
  if (!env.KNOWLEDGE_DB?.prepare) {
    throw new AppError(503, "request_guard_unavailable", "The request safety guard is unavailable. Request rejected.");
  }
  try {
    const row = await env.KNOWLEDGE_DB.prepare(
      `INSERT INTO ai_request_windows (window_start, request_count) VALUES (?, 1)
       ON CONFLICT(window_start) DO UPDATE SET request_count = request_count + 1
       WHERE request_count < ?
       RETURNING request_count`
    ).bind(utcMinute(), config.freePerMinuteRequestLimit).first();
    if (!row) {
      throw new AppError(429, "request_rate_limit_reached", "AI-backed answers are limited to 5 per minute across Ask Mantosh. This controls hosting cost and abuse. Quick replies and navigation remain available; try this question again in about a minute.", { retryAfter: 60 });
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Request safety guard failed", error instanceof Error ? error.message : error);
    throw new AppError(503, "request_guard_unavailable", "The request safety guard is unavailable. Request rejected.");
  }
}

// Counts only requests that may invoke Workers AI; cached and navigation-only
// responses do not consume the self-imposed free-tier safety budget.
export async function enforceFreeUsageLimit(env, config) {
  if (!env.KNOWLEDGE_DB?.prepare) {
    throw new AppError(503, "free_usage_guard_unavailable", "The free-use safety guard is unavailable. Request rejected.");
  }
  try {
    const row = await env.KNOWLEDGE_DB.prepare(
      `INSERT INTO ai_daily_usage (usage_day, request_count) VALUES (?, 1)
       ON CONFLICT(usage_day) DO UPDATE SET request_count = request_count + 1
       WHERE request_count < ?
       RETURNING request_count`
    ).bind(utcDay(), config.freeDailyRequestLimit).first();
    if (!row) {
      throw new AppError(429, "free_usage_limit_reached", "Ask Mantosh's shared allowance of 50 AI-backed answers for today has been reached. This controls hosting cost. Quick replies and navigation remain available; AI-backed answers reset at 00:00 UTC.", { retryAfter: secondsUntilNextUtcDay() });
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Free-use guard failed", error instanceof Error ? error.message : error);
    throw new AppError(503, "free_usage_guard_unavailable", "The free-use safety guard is unavailable. Request rejected.");
  }
}

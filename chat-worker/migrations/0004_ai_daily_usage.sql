CREATE TABLE IF NOT EXISTS ai_daily_usage (
  usage_day TEXT PRIMARY KEY,
  request_count INTEGER NOT NULL CHECK (request_count >= 0)
);

CREATE TABLE IF NOT EXISTS ai_request_windows (
  window_start TEXT PRIMARY KEY,
  request_count INTEGER NOT NULL CHECK (request_count >= 0)
);

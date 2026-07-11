CREATE TABLE IF NOT EXISTS conversation_sessions (
  conversation_id TEXT PRIMARY KEY,
  subject_id TEXT,
  summary TEXT NOT NULL DEFAULT '',
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS conversation_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id TEXT NOT NULL REFERENCES conversation_sessions(conversation_id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  source_labels TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS conversation_messages_session_idx ON conversation_messages(conversation_id, id DESC);
CREATE INDEX IF NOT EXISTS conversation_sessions_expiry_idx ON conversation_sessions(expires_at);

CREATE TABLE IF NOT EXISTS intelligence_analytics (
  event_day TEXT NOT NULL,
  event_type TEXT NOT NULL,
  dimension TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (event_day, event_type, dimension)
);

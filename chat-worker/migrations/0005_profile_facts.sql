CREATE TABLE IF NOT EXISTS profile_facts (
  fact_key TEXT PRIMARY KEY,
  fact_value TEXT NOT NULL,
  source_path TEXT NOT NULL REFERENCES documents(path) ON DELETE CASCADE,
  last_updated TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS profile_facts_source_path_idx ON profile_facts(source_path);

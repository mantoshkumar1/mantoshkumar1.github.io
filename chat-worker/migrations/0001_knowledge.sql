CREATE TABLE IF NOT EXISTS documents (
  path TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT NOT NULL,
  summary TEXT NOT NULL,
  last_updated TEXT NOT NULL,
  related_topics TEXT NOT NULL,
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'private', 'draft')),
  checksum TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS chunks (
  chunk_id TEXT PRIMARY KEY,
  document_path TEXT NOT NULL REFERENCES documents(path) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  content TEXT NOT NULL,
  UNIQUE (document_path, position)
);

CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
  chunk_id UNINDEXED,
  document_path UNINDEXED,
  title,
  summary,
  content,
  tags,
  category UNINDEXED,
  visibility UNINDEXED,
  tokenize = 'unicode61 remove_diacritics 2'
);

CREATE INDEX IF NOT EXISTS chunks_document_path_idx ON chunks(document_path);
CREATE INDEX IF NOT EXISTS documents_visibility_idx ON documents(visibility);

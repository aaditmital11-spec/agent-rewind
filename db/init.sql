-- Runs once, the first time the Postgres container starts with an empty volume.

CREATE EXTENSION IF NOT EXISTS vector;

-- One row per agent run. A replay is a new run that points back at the original.
CREATE TABLE runs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'failed')),
  error TEXT,
  replayed_from_run_id INTEGER REFERENCES runs(id),
  -- For a replay: the step it restarted from. Steps before it reused recorded outputs.
  replayed_from_seq INTEGER,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per recorded call inside a run, in order (seq = 1, 2, 3, ...).
CREATE TABLE steps (
  id SERIAL PRIMARY KEY,
  run_id INTEGER NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  seq INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('llm', 'tool', 'retrieval')),
  name TEXT NOT NULL,
  input JSONB,
  output JSONB,
  error TEXT,
  duration_ms INTEGER,
  UNIQUE (run_id, seq)
);

-- Document chunks for RAG. 384 dimensions matches all-MiniLM-L6-v2.
CREATE TABLE chunks (
  id SERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(384)
);

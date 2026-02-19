-- Knowledge base for RAG: chunks from PMC, Europe PMC, WHO, Cochrane, etc.
-- Run after CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(64) NOT NULL,
  source_id VARCHAR(256),
  title TEXT,
  authors TEXT,
  year INT,
  chunk_text TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_source ON knowledge_chunks(source);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_year ON knowledge_chunks(year);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding ON knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

COMMENT ON TABLE knowledge_chunks IS 'RAG corpus: obstetrics, maternal and neonatal health (Open Access sources)';

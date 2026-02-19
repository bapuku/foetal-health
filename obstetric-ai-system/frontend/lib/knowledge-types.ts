/**
 * Types for RAG knowledge chunks (base de connaissances).
 */

export interface KnowledgeChunk {
  id: string;
  source: string;
  source_id?: string;
  title?: string;
  authors?: string;
  year?: number;
  chunk_text: string;
  metadata?: Record<string, unknown>;
}

export interface KnowledgeSearchResult {
  chunks: KnowledgeChunk[];
}

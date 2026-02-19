/**
 * Server-side retrieval from knowledge base (RAG).
 * Used by /api/knowledge/search and /api/assistant/chat.
 */

import path from 'path';
import fs from 'fs';
import type { KnowledgeChunk } from './knowledge-types';

const DEFAULT_TOP_K = 10;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((s) => s.length > 1);
}

function scoreChunk(chunk: KnowledgeChunk, queryTokens: Set<string>): number {
  const text = `${chunk.chunk_text} ${chunk.title ?? ''} ${chunk.authors ?? ''}`.toLowerCase();
  let score = 0;
  for (const t of queryTokens) {
    if (text.includes(t)) score += 1;
  }
  return score;
}

export function getChunksFromFile(): KnowledgeChunk[] {
  const dataPath = path.join(process.cwd(), 'data', 'knowledge-chunks.json');
  try {
    const raw = fs.readFileSync(dataPath, 'utf-8');
    return JSON.parse(raw) as KnowledgeChunk[];
  } catch {
    return [];
  }
}

export function getKnowledgeChunksForQuery(query: string, topK = DEFAULT_TOP_K): KnowledgeChunk[] {
  const chunks = getChunksFromFile();
  const k = Math.min(Math.max(1, topK), 20);
  if (chunks.length === 0) return [];
  const q = (query || '').trim();
  if (!q) return chunks.slice(0, k);
  const queryTokens = new Set(tokenize(q));
  const scored = chunks
    .map((c) => ({ chunk: c, score: scoreChunk(c, queryTokens) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  const top = scored.slice(0, k).map((s) => s.chunk);
  return top.length > 0 ? top : chunks.slice(0, k);
}

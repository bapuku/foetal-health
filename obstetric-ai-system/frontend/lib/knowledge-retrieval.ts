/**
 * Server-side retrieval from knowledge base (RAG).
 * Used by /api/knowledge/search and /api/assistant/chat.
 */

import path from 'path';
import fs from 'fs';
import type { KnowledgeChunk } from './knowledge-types';
import { assistantMemoryAsKnowledgeChunks } from './assistant-memory';

const DEFAULT_TOP_K = 10;

function stripAccents(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .map((s) => stripAccents(s))
    .filter((s) => s.length > 1);
}

function scoreChunk(chunk: KnowledgeChunk, queryTokens: Set<string>): number {
  const text = stripAccents(`${chunk.chunk_text} ${chunk.title ?? ''} ${chunk.authors ?? ''}`);
  let score = 0;
  for (const t of queryTokens) {
    if (t.length < 2) continue;
    if (text.includes(t)) score += 1;
  }
  return score;
}

function loadKnowledgeJsonFile(relName: string): KnowledgeChunk[] {
  const dataPath = path.join(process.cwd(), 'data', relName);
  try {
    const raw = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(raw) as unknown;
    return Array.isArray(data) ? (data as KnowledgeChunk[]) : [];
  } catch {
    return [];
  }
}

/** Chunks statiques + optionnellement `knowledge-chunks-ingested.json` (pipeline rag_ingest). */
export function getChunksFromFile(): KnowledgeChunk[] {
  const base = loadKnowledgeJsonFile('knowledge-chunks.json');
  const ingested = loadKnowledgeJsonFile('knowledge-chunks-ingested.json');
  if (ingested.length === 0) return base;
  const seen = new Set(base.map((c) => c.id));
  const merged = [...base];
  for (const c of ingested) {
    if (c?.id && !seen.has(c.id)) {
      seen.add(c.id);
      merged.push(c);
    }
  }
  return merged;
}

export function getKnowledgeChunksForQuery(query: string, topK = DEFAULT_TOP_K): KnowledgeChunk[] {
  const chunks = [...getChunksFromFile(), ...assistantMemoryAsKnowledgeChunks()];
  const k = Math.min(Math.max(1, topK), 20);
  if (chunks.length === 0) return [];
  const q = (query || '').trim();
  if (!q) return chunks.slice(0, k);
  const queryTokens = new Set(tokenize(q));
  const scored = chunks
    .map((c) => ({ chunk: c, score: scoreChunk(c, queryTokens) }))
    .sort((a, b) => b.score - a.score);
  const best = scored[0]?.score ?? 0;
  if (best === 0) return [];
  const top = scored
    .filter((s) => s.score > 0)
    .slice(0, k)
    .map((s) => s.chunk);
  return top;
}

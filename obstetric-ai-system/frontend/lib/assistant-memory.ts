/**
 * Mémoire persistante des échanges assistant : enrichit la RAG (chunks dérivés des Q/R).
 * Fichier : data/assistant-qa-memory.json (tableau JSON).
 * En environnement read-only (certaines prod serverless), les écritures sont ignorées silencieusement.
 */

import fs from 'fs';
import path from 'path';
import type { KnowledgeChunk } from './knowledge-types';

const MAX_ENTRIES = 250;
const MAX_QUESTION_LEN = 500;
const MAX_NARRATIVE_LEN = 1200;

export interface AssistantMemoryEntry {
  id: string;
  ts: string;
  question: string;
  summary: string;
  narrativeExcerpt: string;
  suggestedQuestions?: string[];
}

function memoryFilePath(): string {
  return path.join(process.cwd(), 'data', 'assistant-qa-memory.json');
}

export function readAssistantMemoryEntries(): AssistantMemoryEntry[] {
  const p = memoryFilePath();
  try {
    const raw = fs.readFileSync(p, 'utf-8');
    const data = JSON.parse(raw) as unknown;
    return Array.isArray(data) ? (data as AssistantMemoryEntry[]) : [];
  } catch {
    return [];
  }
}

/** Chunks dérivés pour scoring RAG (pas de données nominatives : texte déjà tronqué côté append). */
export function assistantMemoryAsKnowledgeChunks(): KnowledgeChunk[] {
  const entries = readAssistantMemoryEntries();
  return entries.map((e) => ({
    id: `mem-${e.id}`,
    source: 'Assistant (historique Q/R)',
    title: e.question.slice(0, 120),
    authors: 'Session clinique (Obstetric AI)',
    year: new Date(e.ts).getFullYear() || new Date().getFullYear(),
    chunk_text: `Question (échange antérieur) : ${e.question}\nSynthèse de la réponse : ${e.summary}\nExtrait : ${e.narrativeExcerpt}`,
    metadata: { type: 'session_qa', ts: e.ts },
  }));
}

function stableId(ts: string, question: string): string {
  const h = Buffer.from(question.slice(0, 80)).toString('base64url').slice(0, 12);
  return `${ts.replace(/[:.]/g, '-')}-${h}`;
}

export function appendAssistantMemory(input: {
  question: string;
  summary: string;
  narrative: string;
  suggestedQuestions?: string[];
}): void {
  const q = (input.question || '').trim().slice(0, MAX_QUESTION_LEN);
  const summary = (input.summary || '').trim().slice(0, 800);
  const narrativeExcerpt = (input.narrative || '').trim().slice(0, MAX_NARRATIVE_LEN);
  if (!q || !summary) return;

  const ts = new Date().toISOString();
  const entry: AssistantMemoryEntry = {
    id: stableId(ts, q),
    ts,
    question: q,
    summary,
    narrativeExcerpt,
    suggestedQuestions: input.suggestedQuestions?.slice(0, 8),
  };

  const p = memoryFilePath();
  try {
    const prev = readAssistantMemoryEntries();
    const next = [entry, ...prev.filter((e) => e.question !== q)].slice(0, MAX_ENTRIES);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(next, null, 2), 'utf-8');
  } catch {
    /* read-only FS ou permissions */
  }
}

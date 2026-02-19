#!/usr/bin/env node
/**
 * Ingest Europe PMC abstracts into knowledge chunks.
 * Run from repo root: node scripts/rag/ingest-europe-pmc.js
 * Writes to frontend/data/knowledge-chunks.json (merges with existing seed chunks).
 * Utilise l'agent crawler éthique pour toutes les requêtes (rate limit, robots.txt, cache).
 */

const fs = require('fs');
const path = require('path');
const { createEthicalCrawler } = require('./ethical-crawler');

const EUROPE_PMC_SEARCH = 'https://www.ebi.ac.uk/europepmc/webservices/rest/search';
const QUERIES = ['obstetrics', 'maternal health', 'neonatal', 'fetal monitoring', 'intrapartum care'];
const PAGE_SIZE = 20;
const MAX_PAGES_PER_QUERY = 2;
const CHUNK_MAX_CHARS = 600;

function chunkText(text) {
  if (!text || text.length <= CHUNK_MAX_CHARS) return text ? [text] : [];
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = start + CHUNK_MAX_CHARS;
    if (end < text.length) {
      const lastSpace = text.lastIndexOf(' ', end);
      if (lastSpace > start) end = lastSpace;
    }
    chunks.push(text.slice(start, end).trim());
    start = end;
  }
  return chunks;
}

async function fetchQuery(crawler, query, page = 1) {
  const url = `${EUROPE_PMC_SEARCH}?query=${encodeURIComponent(query)}&format=json&pageSize=${PAGE_SIZE}&cursorMark=*`;
  const res = await crawler.fetch(url);
  if (!res.ok) throw new Error(`Europe PMC ${res.status}`);
  return res.json();
}

function extractResults(data) {
  const list = data.resultList?.result;
  return Array.isArray(list) ? list : [];
}

function buildChunks(existing, results) {
  const seen = new Set(existing.map((c) => c.id));
  const out = [...existing];
  for (const r of results) {
    const id = r.id || r.pmid || r.pmcid;
    if (!id) continue;
    const title = r.title || '';
    const authors = r.authorString || r.authors?.map((a) => a.fullName).join(', ') || '';
    const year = r.pubYear ? parseInt(r.pubYear, 10) : undefined;
    const abstract = r.abstractText || r.abstract || '';
    if (!abstract && !title) continue;
    const text = [title, abstract].filter(Boolean).join('\n\n');
    const chunks = chunkText(text);
    const source = 'Europe PMC';
    chunks.forEach((chunkTextVal, i) => {
      const chunkId = `${id}-${i}`;
      if (seen.has(chunkId)) return;
      seen.add(chunkId);
      out.push({
        id: chunkId,
        source,
        source_id: id,
        title: title || undefined,
        authors: authors || undefined,
        year,
        chunk_text: chunkTextVal,
        metadata: { type: 'journal', journal: r.journalTitle },
      });
    });
  }
  return out;
}

async function main() {
  const crawler = createEthicalCrawler({
    minDelayMs: 1500,
    cacheDir: path.join(__dirname, '.cache'),
    auditLogPath: path.join(__dirname, '.crawler-audit.log'),
    respectRobots: true,
    allowedOriginsOnly: true,
  });

  const dataDir = path.join(__dirname, '..', 'frontend', 'data');
  const outPath = path.join(dataDir, 'knowledge-chunks.json');
  let existing = [];
  try {
    existing = JSON.parse(fs.readFileSync(outPath, 'utf-8'));
  } catch {
    // keep existing empty or ensure dir exists
  }
  fs.mkdirSync(dataDir, { recursive: true });

  for (const query of QUERIES) {
    try {
      const data = await fetchQuery(crawler, query, 1);
      const results = extractResults(data);
      existing = buildChunks(existing, results);
    } catch (e) {
      console.warn(`Query "${query}" failed:`, e.message);
    }
  }

  fs.writeFileSync(outPath, JSON.stringify(existing, null, 2), 'utf-8');
  console.log(`Wrote ${existing.length} chunks to ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

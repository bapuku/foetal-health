/**
 * Server-only: read/write JSON files in data/ (for API routes).
 * Uses process.cwd() which is the app root (frontend dir in dev, or container workdir in prod).
 */
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

export async function readJsonFile<T>(filename: string): Promise<T | null> {
  try {
    const p = path.join(DATA_DIR, filename);
    const raw = await fs.readFile(p, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function writeJsonFile(filename: string, data: unknown): Promise<void> {
  await ensureDataDir();
  const p = path.join(DATA_DIR, filename);
  await fs.writeFile(p, JSON.stringify(data, null, 2), 'utf-8');
}

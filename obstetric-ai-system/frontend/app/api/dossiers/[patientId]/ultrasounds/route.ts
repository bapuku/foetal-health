import { NextRequest, NextResponse } from 'next/server';
import { readJsonFile, writeJsonFile } from '@/lib/server-data';

export const dynamic = 'force-dynamic';

const DOSSIERS_FILE = 'dossiers.json';

type DossiersStore = Record<string, Record<string, unknown>>;

function ensureDossier(store: DossiersStore, patientId: string): Record<string, unknown> {
  if (!store[patientId]) {
    store[patientId] = {
      patientId,
      calendar: { items: [] },
      consultations: [],
      biologicalExams: [],
      ctgResults: [],
      ultrasounds: [],
    };
  }
  const d = store[patientId] as Record<string, unknown>;
  if (!Array.isArray(d.ultrasounds)) d.ultrasounds = [];
  return d;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const { patientId } = await params;
  try {
    const body = await request.json();
    const store = await readJsonFile<DossiersStore>(DOSSIERS_FILE) ?? {};
    const dossier = ensureDossier(store, patientId);
    const ultrasounds = dossier.ultrasounds as Record<string, unknown>[];
    const type = body.type ?? 't1';
    const data = body.data ?? {};
    const item = {
      id: body.id ?? `echo-${patientId}-${Date.now()}`,
      type,
      data: { date: data.date, sa: data.sa != null ? Number(data.sa) : undefined, ...data },
    };
    ultrasounds.push(item);
    await writeJsonFile(DOSSIERS_FILE, store);
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

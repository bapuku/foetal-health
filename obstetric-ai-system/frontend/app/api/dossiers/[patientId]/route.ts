import { NextRequest, NextResponse } from 'next/server';
import { readJsonFile, writeJsonFile } from '@/lib/server-data';

export const dynamic = 'force-dynamic';

const DOSSIERS_FILE = 'dossiers.json';

type DossiersStore = Record<string, Record<string, unknown>>;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const { patientId } = await params;
  const store = await readJsonFile<DossiersStore>(DOSSIERS_FILE) ?? {};
  const dossier = store[patientId] ?? null;
  if (!dossier) return NextResponse.json({ patientId, calendar: { items: [] }, consultations: [], biologicalExams: [], ctgResults: [], ultrasounds: [] });
  return NextResponse.json(dossier);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const { patientId } = await params;
  try {
    const body = await request.json();
    const store = await readJsonFile<DossiersStore>(DOSSIERS_FILE) ?? {};
    store[patientId] = { ...body, patientId };
    await writeJsonFile(DOSSIERS_FILE, store);
    return NextResponse.json(store[patientId]);
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

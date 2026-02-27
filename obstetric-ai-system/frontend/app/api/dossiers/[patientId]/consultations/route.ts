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
  if (!Array.isArray(d.consultations)) d.consultations = [];
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
    const consultations = dossier.consultations as Record<string, unknown>[];
    const item = {
      id: body.id ?? `c-${patientId}-${Date.now()}`,
      date: body.date,
      sa: body.sa != null ? Number(body.sa) : undefined,
      consultationNumber: body.consultationNumber != null ? Number(body.consultationNumber) : undefined,
      paSystolique: body.paSystolique != null ? Number(body.paSystolique) : undefined,
      paDiastolique: body.paDiastolique != null ? Number(body.paDiastolique) : undefined,
      poids: body.poids != null ? Number(body.poids) : undefined,
      hauteurUterine: body.hauteurUterine != null ? Number(body.hauteurUterine) : undefined,
      proteinurieBandelette: body.proteinurieBandelette,
      glycosurieBandelette: body.glycosurieBandelette,
      bcfBpm: body.bcfBpm != null ? Number(body.bcfBpm) : undefined,
      presentationFœtale: body.presentationFœtale,
      mouvementsFœtaux: body.mouvementsFœtaux,
      prescriptions: body.prescriptions,
      resumeClinique: body.resumeClinique,
    };
    consultations.push(item);
    await writeJsonFile(DOSSIERS_FILE, store);
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

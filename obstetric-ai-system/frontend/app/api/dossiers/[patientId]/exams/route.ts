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
  if (!Array.isArray(d.biologicalExams)) d.biologicalExams = [];
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
    const exams = dossier.biologicalExams as Record<string, unknown>[];
    const item = {
      id: body.id ?? `b-${patientId}-${Date.now()}`,
      type: body.type ?? '',
      date: body.date ?? '',
      trimestre: body.trimestre != null ? Number(body.trimestre) as 1 | 2 | 3 : undefined,
      resultatNumerique: body.resultatNumerique != null ? Number(body.resultatNumerique) : undefined,
      resultatQualitatif: body.resultatQualitatif,
      unite: body.unite,
      valeurMinNormale: body.valeurMinNormale != null ? Number(body.valeurMinNormale) : undefined,
      valeurMaxNormale: body.valeurMaxNormale != null ? Number(body.valeurMaxNormale) : undefined,
      statut: body.statut ?? 'en_attente',
      commentaire: body.commentaire,
    };
    exams.push(item);
    await writeJsonFile(DOSSIERS_FILE, store);
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

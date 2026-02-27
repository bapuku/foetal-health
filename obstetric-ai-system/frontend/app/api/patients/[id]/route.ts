import { NextRequest, NextResponse } from 'next/server';
import { readJsonFile, writeJsonFile } from '@/lib/server-data';
import type { PatientRecord } from '../route';

export const dynamic = 'force-dynamic';

const PATIENTS_FILE = 'patients.json';
const DOSSIERS_FILE = 'dossiers.json';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const list = await readJsonFile<PatientRecord[]>(PATIENTS_FILE) ?? [];
  const patient = list.find((p) => p.id === id);
  if (!patient) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(patient);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const list = await readJsonFile<PatientRecord[]>(PATIENTS_FILE) ?? [];
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const current = list[idx];
    const updated: PatientRecord = {
      ...current,
      nom: body.nom ?? current.nom,
      prenom: body.prenom ?? current.prenom,
      age: body.age !== undefined ? Number(body.age) : current.age,
      sa: body.sa !== undefined ? Number(body.sa) : current.sa,
      risque: body.risque ?? current.risque,
      derniereVisite: body.derniereVisite ?? current.derniereVisite,
      statut: body.statut ?? current.statut,
    };
    list[idx] = updated;
    await writeJsonFile(PATIENTS_FILE, list);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

type DossiersStore = Record<string, Record<string, unknown>>;

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const list = await readJsonFile<PatientRecord[]>(PATIENTS_FILE) ?? [];
  const idx = list.findIndex((p) => p.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  list.splice(idx, 1);
  await writeJsonFile(PATIENTS_FILE, list);
  const dossiers = await readJsonFile<DossiersStore>(DOSSIERS_FILE) ?? {};
  if (dossiers[id]) {
    delete dossiers[id];
    await writeJsonFile(DOSSIERS_FILE, dossiers);
  }
  return new NextResponse(null, { status: 204 });
}

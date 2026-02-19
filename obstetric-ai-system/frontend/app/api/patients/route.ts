import { NextRequest, NextResponse } from 'next/server';
import { readJsonFile, writeJsonFile } from '@/lib/server-data';

export const dynamic = 'force-dynamic';

const PATIENTS_FILE = 'patients.json';

export interface PatientRecord {
  id: string;
  nom: string;
  prenom: string;
  age: number;
  sa: number;
  risque: 'bas' | 'moyen' | 'eleve';
  derniereVisite: string;
  statut: 'actif' | 'accouchee' | 'suivi';
}

export async function GET() {
  const list = await readJsonFile<PatientRecord[]>(PATIENTS_FILE);
  return NextResponse.json(list ?? []);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const list = await readJsonFile<PatientRecord[]>(PATIENTS_FILE) ?? [];
    const id = body.id ?? `P-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const patient: PatientRecord = {
      id,
      nom: body.nom ?? '',
      prenom: body.prenom ?? '',
      age: Number(body.age) ?? 0,
      sa: Number(body.sa) ?? 0,
      risque: body.risque ?? 'bas',
      derniereVisite: body.derniereVisite ?? new Date().toISOString().slice(0, 10),
      statut: body.statut ?? 'actif',
    };
    if (list.some((p) => p.id === patient.id)) {
      return NextResponse.json({ error: 'Patient id already exists' }, { status: 400 });
    }
    list.push(patient);
    await writeJsonFile(PATIENTS_FILE, list);
    return NextResponse.json(patient);
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

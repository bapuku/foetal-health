import { NextRequest, NextResponse } from 'next/server';
import { readJsonFile, writeJsonFile } from '@/lib/server-data';

export const dynamic = 'force-dynamic';

const CONNECTIONS_FILE = 'connections.json';

interface ConnectionsStore {
  fhir: { baseUrl: string; authType: string };
  hl7: { endpoint: string; enabled: boolean };
  other: { endpoints: { name: string; url: string }[] };
}

function defaultStore(): ConnectionsStore {
  return {
    fhir: { baseUrl: process.env.FHIR_BASE_URL || '', authType: 'none' },
    hl7: { endpoint: '', enabled: false },
    other: { endpoints: [] },
  };
}

export async function GET() {
  const stored = await readJsonFile<ConnectionsStore>(CONNECTIONS_FILE);
  const store = stored ? { ...defaultStore(), ...stored, fhir: { ...defaultStore().fhir, ...stored.fhir }, hl7: { ...defaultStore().hl7, ...stored.hl7 }, other: { ...defaultStore().other, ...stored.other } } : defaultStore();
  return NextResponse.json(store);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const store = await readJsonFile<ConnectionsStore>(CONNECTIONS_FILE) || defaultStore();
    if (body.fhir) store.fhir = { ...store.fhir, ...body.fhir };
    if (body.hl7) store.hl7 = { ...store.hl7, ...body.hl7 };
    if (Array.isArray(body.other?.endpoints)) store.other.endpoints = body.other.endpoints;
    await writeJsonFile(CONNECTIONS_FILE, store);
    return NextResponse.json(store);
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

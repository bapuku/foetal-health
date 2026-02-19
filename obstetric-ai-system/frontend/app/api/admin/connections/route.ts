import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const store: {
  fhir: { baseUrl: string; authType: string };
  hl7: { endpoint: string; enabled: boolean };
  other: { endpoints: { name: string; url: string }[] };
} = {
  fhir: { baseUrl: process.env.FHIR_BASE_URL || '', authType: 'none' },
  hl7: { endpoint: '', enabled: false },
  other: { endpoints: [] },
};

export async function GET() {
  return NextResponse.json(store);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.fhir) store.fhir = { ...store.fhir, ...body.fhir };
    if (body.hl7) store.hl7 = { ...store.hl7, ...body.hl7 };
    if (Array.isArray(body.other?.endpoints)) store.other.endpoints = body.other.endpoints;
    return NextResponse.json(store);
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

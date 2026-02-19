const FHIR_BASE = process.env.NEXT_PUBLIC_FHIR_BASE_URL || 'http://localhost:8080/fhir';

export async function fhirGet<T>(path: string): Promise<T> {
  const res = await fetch(`${FHIR_BASE}/${path}`, { headers: { Accept: 'application/fhir+json' } });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function fhirSearch(resourceType: string, params: Record<string, string>): Promise<{ entry?: { resource: unknown }[] }> {
  const q = new URLSearchParams(params).toString();
  return fhirGet(`${resourceType}?${q}`);
}

let cachedFhirBase: string | null = null;

async function getFhirBase(): Promise<string> {
  if (cachedFhirBase) return cachedFhirBase;
  try {
    const res = await fetch('/api/admin/connections');
    const config = await res.json();
    const base = config?.fhir?.baseUrl?.trim();
    cachedFhirBase = base || process.env.NEXT_PUBLIC_FHIR_BASE_URL || 'http://localhost:8080/fhir';
  } catch {
    cachedFhirBase = process.env.NEXT_PUBLIC_FHIR_BASE_URL || 'http://localhost:8080/fhir';
  }
  return cachedFhirBase;
}

export async function fhirGet<T>(path: string): Promise<T> {
  const base = await getFhirBase();
  const url = path.startsWith('http') ? path : `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  const res = await fetch(url, { headers: { Accept: 'application/fhir+json' } });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function fhirSearch(resourceType: string, params: Record<string, string>): Promise<{ entry?: { resource: unknown }[] }> {
  const q = new URLSearchParams(params).toString();
  return fhirGet(`${resourceType}?${q}`);
}

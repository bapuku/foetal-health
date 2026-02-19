/**
 * Client API pour les services backend (CTG Monitor, Apgar Transition).
 * Les URLs sont lues depuis NEXT_PUBLIC_* (configurées via .env / setup-credentials.sh).
 */

const CTG_BASE = process.env.NEXT_PUBLIC_CTG_API_URL || 'http://localhost:8000';
const APGAR_BASE = process.env.NEXT_PUBLIC_APGAR_API_URL || 'http://localhost:8001';

export interface CTGInput {
  baseline_bpm: number;
  stv_ms: number;
  ltv_pct?: number;
  decelerations_light?: number;
  decelerations_severe?: number;
  signal_60s?: number[];
}

export interface CTGOutput {
  classification: string;
  confidence: number;
  narrative: string;
  hitl_required: boolean;
  escalation_level?: number;
  fhir_observation: Record<string, unknown>;
}

export interface ApgarInput {
  apgar_1min: number;
  apgar_5min: number;
  heart_rate?: number;
  respiration?: string;
  tone?: string;
  reflex?: string;
  color?: string;
}

export interface ApgarOutput {
  risk_apgar_low: boolean;
  narrative: string;
  hitl_required: boolean;
  fhir_observation: Record<string, unknown>;
}

export async function analyzeCTG(data: CTGInput): Promise<CTGOutput> {
  const res = await fetch(`${CTG_BASE}/api/ctg-monitor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error((err as { detail?: string }).detail || res.statusText);
  }
  return res.json();
}

export async function evaluateApgar(data: ApgarInput): Promise<ApgarOutput> {
  const res = await fetch(`${APGAR_BASE}/api/apgar-transition`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error((err as { detail?: string }).detail || res.statusText);
  }
  return res.json();
}

export async function healthCTG(): Promise<{ status: string; agent: string }> {
  const res = await fetch(`${CTG_BASE}/health`);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function healthApgar(): Promise<{ status: string; agent: string }> {
  const res = await fetch(`${APGAR_BASE}/health`);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

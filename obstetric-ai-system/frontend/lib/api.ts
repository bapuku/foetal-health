/**
 * Client API pour les services backend (CTG Monitor, Apgar Transition).
 * Les URLs sont lues depuis NEXT_PUBLIC_* (configurées via .env / setup-credentials.sh).
 */

const CTG_BASE = process.env.NEXT_PUBLIC_CTG_API_URL || 'http://localhost:8000';
const APGAR_BASE = process.env.NEXT_PUBLIC_APGAR_API_URL || 'http://localhost:8001';
const PRENATAL_BASE = process.env.NEXT_PUBLIC_PRENATAL_API_URL || 'http://localhost:8010';

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

// --- Prenatal Follow-up Agent (port 8010) ---

export async function evaluatePrenatal(dossier: Record<string, unknown>, saCourante: number): Promise<{
  conforme_calendrier: boolean;
  alertes: { type: string; message: string; severite: string }[];
  examens_en_retard: string[];
  resultats_anormaux: { examen: string; valeur: string; norme: string }[];
  recommandations: { action: string; level: string }[];
  narrative: string;
}> {
  const res = await fetch(`${PRENATAL_BASE}/api/prenatal-followup/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dossier, sa_courante: saCourante }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error((err as { detail?: string }).detail || res.statusText);
  }
  return res.json();
}

export async function submitPrenatalConsultation(
  patientId: string,
  consultation: Record<string, unknown>,
  biologicalExams?: Record<string, unknown>[]
): Promise<{ ok: boolean; alertes: unknown[]; narrative: string }> {
  const res = await fetch(`${PRENATAL_BASE}/api/prenatal-followup/consultation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patient_id: patientId, consultation, biological_exams: biologicalExams }),
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function screeningT21(risqueCombine: number, ageMaternel?: number): Promise<{
  palier: string;
  indication_dpni: boolean;
  indication_caryotype: boolean;
  message: string;
  recommandation: string;
}> {
  const res = await fetch(`${PRENATAL_BASE}/api/prenatal-followup/screening/t21`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ risque_combine: risqueCombine, age_maternel: ageMaternel }),
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function screeningDiabetes(h0: number, h1: number, h2: number, glycemieJeun?: number, unite = 'g/L'): Promise<{
  diagnostic_dg: boolean;
  message: string;
  recommandation: string;
}> {
  const res = await fetch(`${PRENATAL_BASE}/api/prenatal-followup/screening/diabetes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ h0, h1, h2, glycemie_jeun: glycemieJeun, unite }),
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function screeningGbs(saPrelevement: number, resultat: 'positif' | 'negatif', datePrelevement: string): Promise<{
  timing_ok: boolean;
  message: string;
  recommandation: string;
}> {
  const res = await fetch(`${PRENATAL_BASE}/api/prenatal-followup/screening/gbs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sa_prelevement: saPrelevement, resultat, date_prelevement: datePrelevement }),
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function getPrenatalNorms(sa: number): Promise<Record<string, unknown>> {
  const res = await fetch(`${PRENATAL_BASE}/api/prenatal-followup/norms?sa=${sa}`);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export interface PrenatalReportInput {
  patient_id: string;
  dossier?: Record<string, unknown>;
  consultation_data?: Record<string, unknown>;
  screening_results?: Record<string, unknown>;
  sa: number;
}

export interface PrenatalReportOutput {
  sections: Record<string, string>;
  sa: number;
  audit_input_hash?: string;
  audit_output_hash?: string;
  audit_hash?: string;
  model_used?: string;
  patient_id?: string;
  fhir_diagnostic_report?: Record<string, unknown>;
}

export async function generatePrenatalReport(params: PrenatalReportInput): Promise<PrenatalReportOutput> {
  const res = await fetch(`${PRENATAL_BASE}/api/prenatal-followup/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patient_id: params.patient_id,
      dossier: params.dossier,
      consultation_data: params.consultation_data,
      screening_results: params.screening_results,
      sa: params.sa,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error((err as { detail?: string }).detail || res.statusText);
  }
  return res.json();
}

export async function healthPrenatal(): Promise<{ status: string; agent: string }> {
  const res = await fetch(`${PRENATAL_BASE}/health`);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

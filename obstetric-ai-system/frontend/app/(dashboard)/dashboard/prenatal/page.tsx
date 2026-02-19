'use client';

import { useState, useEffect } from 'react';
import PageBanner from '@/components/ui/PageBanner';
import {
  evaluatePrenatal,
  getPrenatalNorms,
  screeningT21,
  screeningDiabetes,
  screeningGbs,
  healthPrenatal,
} from '@/lib/api';
import type { PrenatalConsultation } from '@/lib/prenatal-types';

const MOCK_PATIENTS = [
  { id: 'P-2024-0847', nom: 'Martin', prenom: 'Sophie', sa: 28 },
  { id: 'P-2024-0845', nom: 'Dubois', prenom: 'Marie', sa: 24 },
  { id: 'P-2024-0841', nom: 'Petit', prenom: 'Isabelle', sa: 32 },
];

const TIMELINE_ITEMS: { id: string; label: string; saMin: number; saMax: number }[] = [
  { id: 'epp', label: 'EPP', saMin: 0, saMax: 20 },
  { id: 'c1', label: '1ère consultation', saMin: 0, saMax: 15 },
  { id: 'echo1', label: 'Écho T1', saMin: 11, saMax: 14 },
  { id: 'c2', label: '2e consultation', saMin: 16, saMax: 20 },
  { id: 'c3', label: '3e consultation', saMin: 20, saMax: 24 },
  { id: 'echo2', label: 'Écho T2', saMin: 20, saMax: 25 },
  { id: 'c4', label: '4e consultation', saMin: 24, saMax: 28 },
  { id: 'c5', label: '5e consultation', saMin: 28, saMax: 32 },
  { id: 'echo3', label: 'Écho T3', saMin: 30, saMax: 35 },
  { id: 'c6', label: '6e consultation', saMin: 32, saMax: 36 },
  { id: 'c7', label: '7e consultation', saMin: 37, saMax: 42 },
];

function statusForItem(itemId: string, sa: number, saMin: number, saMax: number, realised: Set<string>): 'realisee' | 'planifiee' | 'en_retard' {
  if (realised.has(itemId)) return 'realisee';
  if (sa > saMax) return 'en_retard';
  return 'planifiee';
}

export default function PrenatalPage() {
  const [patientId, setPatientId] = useState(MOCK_PATIENTS[0]?.id ?? '');
  const [sa, setSa] = useState(MOCK_PATIENTS[0]?.sa ?? 28);
  const [agentUp, setAgentUp] = useState(false);
  const [alertes, setAlertes] = useState<{ type: string; message: string; severite: string }[]>([]);
  const [norms, setNorms] = useState<Record<string, unknown> | null>(null);
  const [t21Risk, setT21Risk] = useState<string>('0.0004');
  const [t21Result, setT21Result] = useState<{ palier: string; message: string } | null>(null);
  const [hgpo, setHgpo] = useState({ h0: 0.85, h1: 1.5, h2: 1.2 });
  const [dgResult, setDgResult] = useState<{ diagnostic_dg: boolean; message: string } | null>(null);
  const [gbsResult, setGbsResult] = useState<{ resultat: string; sa: number } | null>(null);
  const [consultation, setConsultation] = useState<Partial<PrenatalConsultation>>({
    paSystolique: 120,
    paDiastolique: 75,
    poids: 68,
    hauteurUterine: 26,
    proteinurieBandelette: 'Négatif',
    bcfBpm: 145,
  });
  const realisedItems = new Set<string>(['epp', 'c1', 'echo1', 'c2', 'c3', 'echo2', 'c4']);

  useEffect(() => {
    healthPrenatal()
      .then(() => setAgentUp(true))
      .catch(() => setAgentUp(false));
  }, []);

  useEffect(() => {
    getPrenatalNorms(sa)
      .then((n) => setNorms(n))
      .catch(() => setNorms(null));
  }, [sa]);

  const handleEvaluate = () => {
    const dossier = {
      calendar: { items: TIMELINE_ITEMS.map((i) => ({ ...i, status: statusForItem(i.id, sa, i.saMin, i.saMax, realisedItems), saCibleMax: i.saMax })) },
      consultations: [],
      biologicalExams: [],
    };
    evaluatePrenatal(dossier as unknown as Record<string, unknown>, sa)
      .then((r) => setAlertes(r.alertes || []))
      .catch(() => setAlertes([{ type: 'Agent', message: 'Agent indisponible.', severite: 'info' }]));
  };

  const handleT21 = () => {
    const risk = parseFloat(t21Risk);
    if (isNaN(risk)) return;
    screeningT21(risk)
      .then((r) => setT21Result({ palier: r.palier, message: r.message }))
      .catch(() => setT21Result({ palier: '—', message: 'Agent indisponible.' }));
  };

  const handleDG = () => {
    screeningDiabetes(hgpo.h0, hgpo.h1, hgpo.h2)
      .then((r) => setDgResult({ diagnostic_dg: r.diagnostic_dg, message: r.message }))
      .catch(() => setDgResult({ diagnostic_dg: false, message: 'Agent indisponible.' }));
  };

  const handleGBS = () => {
    screeningGbs(sa, 'negatif', new Date().toISOString().slice(0, 10))
      .then((r) => setGbsResult({ resultat: r.recommandation, sa }))
      .catch(() => setGbsResult({ resultat: '—', sa }));
  };

  const patient = MOCK_PATIENTS.find((p) => p.id === patientId);

  return (
    <div className="space-y-6">
      <PageBanner
        src="/images/prenatal-consultation.png"
        alt="Suivi prénatal"
        title="Suivi prénatal"
        subtitle="7 consultations obligatoires, EPP, 3 échographies, dépistages T21 / DG / SGB — CSP, HAS, CNGOF"
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-slate-900">Suivi prénatal français</h1>
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-600">Patiente</label>
          <select
            className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm"
            value={patientId}
            onChange={(e) => {
              setPatientId(e.target.value);
              const p = MOCK_PATIENTS.find((x) => x.id === e.target.value);
              if (p) setSa(p.sa);
            }}
          >
            {MOCK_PATIENTS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.prenom} {p.nom} — {p.sa} SA
              </option>
            ))}
          </select>
          <span className="text-sm font-medium text-slate-700">{sa} SA</span>
          {agentUp && (
            <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-800">Agent 8010 OK</span>
          )}
        </div>
      </div>

      {/* Alertes */}
      {alertes.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="mb-2 text-sm font-semibold text-amber-900">Alertes</p>
          <ul className="list-inside list-disc text-sm text-amber-800">
            {alertes.map((a, i) => (
              <li key={i}>
                [{a.severite}] {a.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Timeline */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Calendrier (7 consultations + EPP + 3 échos)
        </h2>
        <div className="flex flex-wrap gap-2">
          {TIMELINE_ITEMS.map((item) => {
            const status = statusForItem(item.id, sa, item.saMin, item.saMax, realisedItems);
            const variant =
              status === 'realisee'
                ? 'bg-green-100 text-green-800'
                : status === 'en_retard'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-slate-100 text-slate-700';
            return (
              <span
                key={item.id}
                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${variant}`}
                title={`${item.saMin}-${item.saMax} SA`}
              >
                {item.label} {item.saMin}-{item.saMax} SA
              </span>
            );
          })}
        </div>
        <button
          type="button"
          onClick={handleEvaluate}
          className="mt-3 rounded bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
        >
          Évaluer conformité
        </button>
      </section>

      {/* Consultation clinique */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Examen clinique (consultation)
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <label className="text-xs text-slate-500">PA (mmHg)</label>
            <input
              type="number"
              className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 text-sm"
              value={consultation.paSystolique ?? ''}
              onChange={(e) => setConsultation((c) => ({ ...c, paSystolique: Number(e.target.value) }))}
              placeholder="120"
            />
            <input
              type="number"
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
              value={consultation.paDiastolique ?? ''}
              onChange={(e) => setConsultation((c) => ({ ...c, paDiastolique: Number(e.target.value) }))}
              placeholder="75"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Poids (kg)</label>
            <input
              type="number"
              className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 text-sm"
              value={consultation.poids ?? ''}
              onChange={(e) => setConsultation((c) => ({ ...c, poids: Number(e.target.value) }))}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Hauteur utérine (cm)</label>
            <input
              type="number"
              className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 text-sm"
              value={consultation.hauteurUterine ?? ''}
              onChange={(e) => setConsultation((c) => ({ ...c, hauteurUterine: Number(e.target.value) }))}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">BCF (bpm)</label>
            <input
              type="number"
              className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 text-sm"
              value={consultation.bcfBpm ?? ''}
              onChange={(e) => setConsultation((c) => ({ ...c, bcfBpm: Number(e.target.value) }))}
            />
          </div>
        </div>
        <div className="mt-2 flex gap-4">
          <div>
            <label className="text-xs text-slate-500">Protéinurie</label>
            <select
              className="mt-0.5 rounded border border-slate-300 px-2 py-1 text-sm"
              value={consultation.proteinurieBandelette ?? ''}
              onChange={(e) => setConsultation((c) => ({ ...c, proteinurieBandelette: e.target.value }))}
            >
              <option value="Négatif">Négatif</option>
              <option value="+">+</option>
              <option value="++">++</option>
            </select>
          </div>
        </div>
      </section>

      {/* Normes biologiques */}
      {norms && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Normes biologiques (T{String(norms.trimestre)})
          </h2>
          <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
            <p>Hb : {(norms.hemoglobine_g_dL as { min: number; max: number })?.min}-{(norms.hemoglobine_g_dL as { min: number; max: number })?.max} g/dL</p>
            <p>Plaquettes : ≥ {String(norms.plaquettes_G_L_min)} G/L</p>
            <p>Glycémie à jeun : &lt; {String(norms.glycemie_jeun_g_L_max)} g/L</p>
            <p>PA : &lt; {(norms.pa_normale_mmHg as { systolique_max: number; diastolique_max: number })?.systolique_max}/{(norms.pa_normale_mmHg as { systolique_max: number; diastolique_max: number })?.diastolique_max} mmHg</p>
          </div>
        </section>
      )}

      {/* Dépistage T21 */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Dépistage trisomie 21 (3 paliers HAS)
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm">Risque combiné (ex. 0.0004 pour 1/2500)</label>
          <input
            type="text"
            className="rounded border border-slate-300 px-2 py-1 text-sm"
            value={t21Risk}
            onChange={(e) => setT21Risk(e.target.value)}
          />
          <button
            type="button"
            onClick={handleT21}
            className="rounded bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
          >
            Évaluer
          </button>
        </div>
        {t21Result && (
          <div className="mt-2 rounded bg-slate-100 p-2 text-sm">
            <strong>Palier :</strong> {t21Result.palier} — {t21Result.message}
          </div>
        )}
      </section>

      {/* Diabète gestationnel (HGPO) */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
          HGPO 75 g (IADPSG)
        </h2>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="text-xs text-slate-500">H0 (g/L)</label>
            <input
              type="number"
              step="0.01"
              className="mt-0.5 w-24 rounded border border-slate-300 px-2 py-1 text-sm"
              value={hgpo.h0}
              onChange={(e) => setHgpo((h) => ({ ...h, h0: Number(e.target.value) }))}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">H1 (g/L)</label>
            <input
              type="number"
              step="0.01"
              className="mt-0.5 w-24 rounded border border-slate-300 px-2 py-1 text-sm"
              value={hgpo.h1}
              onChange={(e) => setHgpo((h) => ({ ...h, h1: Number(e.target.value) }))}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">H2 (g/L)</label>
            <input
              type="number"
              step="0.01"
              className="mt-0.5 w-24 rounded border border-slate-300 px-2 py-1 text-sm"
              value={hgpo.h2}
              onChange={(e) => setHgpo((h) => ({ ...h, h2: Number(e.target.value) }))}
            />
          </div>
          <button
            type="button"
            onClick={handleDG}
            className="self-end rounded bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
          >
            Interpréter
          </button>
        </div>
        {dgResult && (
          <div className={`mt-2 rounded p-2 text-sm ${dgResult.diagnostic_dg ? 'bg-amber-100 text-amber-900' : 'bg-green-100 text-green-800'}`}>
            {dgResult.message}
          </div>
        )}
      </section>

      {/* SGB */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Streptocoque B (34-38 SA)
        </h2>
        <button
          type="button"
          onClick={handleGBS}
          className="rounded bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
        >
          Évaluer dépistage SGB
        </button>
        {gbsResult && (
          <p className="mt-2 text-sm text-slate-600">{gbsResult.resultat}</p>
        )}
      </section>
    </div>
  );
}

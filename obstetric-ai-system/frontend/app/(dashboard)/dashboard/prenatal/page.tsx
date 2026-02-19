'use client';

import { useState, useEffect, useRef } from 'react';
import PageBanner from '@/components/ui/PageBanner';
import {
  evaluatePrenatal,
  generatePrenatalReport,
  getPrenatalNorms,
  screeningT21,
  screeningDiabetes,
  screeningGbs,
  healthPrenatal,
} from '@/lib/api';
import type { PrenatalReportOutput } from '@/lib/api';
import type { PrenatalConsultation } from '@/lib/prenatal-types';

interface PatientOption {
  id: string;
  nom: string;
  prenom: string;
  sa: number;
}

const DEMO_PATIENTS: PatientOption[] = [
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
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [patientId, setPatientId] = useState('');
  const [sa, setSa] = useState(28);
  const [agentUp, setAgentUp] = useState(false);
  const [alertes, setAlertes] = useState<{ type: string; message: string; severite: string }[]>([]);
  const [lastAuditHash, setLastAuditHash] = useState<string | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [report, setReport] = useState<PrenatalReportOutput | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const reportPrintRef = useRef<HTMLDivElement>(null);
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
  const [realisedItemIds, setRealisedItemIds] = useState<string[]>(['epp', 'c1', 'echo1', 'c2', 'c3', 'echo2', 'c4']);
  const realisedItems = new Set<string>(realisedItemIds);

  useEffect(() => {
    fetch('/api/patients')
      .then((r) => (r.ok ? r.json() : []))
      .then((list: { id: string; nom: string; prenom: string; sa: number }[]) => {
        const opts = Array.isArray(list) ? list.map((p) => ({ id: p.id, nom: p.nom, prenom: p.prenom, sa: p.sa })) : [];
        setPatients(opts.length ? opts : DEMO_PATIENTS);
      })
      .catch(() => setPatients(DEMO_PATIENTS));
  }, []);

  useEffect(() => {
    if (patients.length && !patientId) {
      setPatientId(patients[0].id);
      setSa(patients[0].sa);
    }
  }, [patients, patientId]);

  useEffect(() => {
    if (!patientId) return;
    fetch(`/api/dossiers/${encodeURIComponent(patientId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((dossier: Record<string, unknown> | null) => {
        if (!dossier) return;
        const cal = dossier.calendar as { items?: { id: string; status?: string }[] } | undefined;
        const items = cal?.items ?? [];
        const realised = items.filter((i) => i.status === 'realisee').map((i) => i.id);
        if (realised.length) setRealisedItemIds(realised);
        const cons = (dossier.consultations as Record<string, unknown>[]) ?? [];
        const last = cons[cons.length - 1];
        if (last && typeof last === 'object') {
          setConsultation((c) => ({
            ...c,
            paSystolique: (last.paSystolique as number) ?? c.paSystolique,
            paDiastolique: (last.paDiastolique as number) ?? c.paDiastolique,
            poids: (last.poids as number) ?? c.poids,
            hauteurUterine: (last.hauteurUterine as number) ?? c.hauteurUterine,
            bcfBpm: (last.bcfBpm as number) ?? c.bcfBpm,
            proteinurieBandelette: (last.proteinurieBandelette as string) ?? c.proteinurieBandelette,
          }));
        }
      })
      .catch(() => {});
  }, [patientId]);

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

  const saveDossier = (dossier: Record<string, unknown>) => {
    if (!patientId) return;
    fetch(`/api/dossiers/${encodeURIComponent(patientId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dossier),
    }).catch(() => {});
  };

  const buildDossier = () => ({
    patientId,
    calendar: { items: TIMELINE_ITEMS.map((i) => ({ ...i, status: statusForItem(i.id, sa, i.saMin, i.saMax, realisedItems), saCibleMax: i.saMax })) },
    consultations: [{ ...consultation, sa, date: new Date().toISOString().slice(0, 10) }],
    biologicalExams: [],
  });

  const handleEvaluate = () => {
    const dossier = buildDossier();
    evaluatePrenatal(dossier as unknown as Record<string, unknown>, sa)
      .then((r) => {
        setAlertes(r.alertes || []);
        setLastAuditHash((r as { audit_hash?: string }).audit_hash ?? null);
        saveDossier(dossier);
      })
      .catch(() => {
        setAlertes([{ type: 'Agent', message: 'Agent indisponible.', severite: 'info' }]);
        setLastAuditHash(null);
      });
  };

  const handleGenerateReport = () => {
    setReportLoading(true);
    setReport(null);
    setReportModalOpen(true);
    const dossier = buildDossier();
    saveDossier(dossier);
    generatePrenatalReport({
      patient_id: patientId,
      dossier,
      consultation_data: { ...consultation, sa },
      screening_results: {
        t21: t21Result ? { palier: t21Result.palier, message: t21Result.message } : undefined,
        diabetes: dgResult ? { diagnostic_dg: dgResult.diagnostic_dg, message: dgResult.message } : undefined,
        gbs: gbsResult ? { resultat: gbsResult.resultat, sa: gbsResult.sa } : undefined,
      },
      sa,
    })
      .then((r) => setReport(r))
      .catch(() => setReport(null))
      .finally(() => setReportLoading(false));
  };

  const handlePrintReport = () => {
    if (reportPrintRef.current) {
      const prevTitle = document.title;
      document.title = `Rapport_prenatal_${patientId}_${sa}SA`;
      window.print();
      document.title = prevTitle;
    }
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

  const patient = patients.find((p) => p.id === patientId);

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
              const p = patients.find((x) => x.id === e.target.value);
              if (p) setSa(p.sa);
            }}
          >
            {patients.map((p) => (
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
        <div
          className={`rounded-lg border p-3 ${
            alertes.some((a) => a.severite === 'critical')
              ? 'border-red-300 bg-red-50'
              : alertes.some((a) => a.severite === 'warning')
                ? 'border-amber-300 bg-amber-50'
                : 'border-amber-200 bg-amber-50'
          }`}
        >
          <p className="mb-2 text-sm font-semibold text-slate-900">Alertes</p>
          <ul className="list-inside list-disc text-sm text-slate-800">
            {alertes.map((a, i) => (
              <li
                key={i}
                className={
                  a.severite === 'critical'
                    ? 'text-red-800 font-medium'
                    : a.severite === 'warning'
                      ? 'text-amber-800'
                      : 'text-amber-700'
                }
              >
                [{a.severite}] {a.message}
              </li>
            ))}
          </ul>
          {alertes.some((a) => a.severite === 'critical') && (
            <p className="mt-2 text-xs text-red-700">
              En cas d&apos;urgence (critique), alerte SMS / WhatsApp / Email envoyée à l&apos;équipe médicale.
            </p>
          )}
        </div>
      )}

      {/* Tracabilité audit (preuve des examens) */}
      {lastAuditHash && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600">
          <span className="font-medium text-slate-700">Preuve d&apos;évaluation (audit SHA-256) :</span>{' '}
          <code className="break-all rounded bg-white px-1" title="Hash de la chaîne d&apos;audit">
            {lastAuditHash}
          </code>
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
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleEvaluate}
            className="rounded bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
          >
            Évaluer conformité
          </button>
          <button
            type="button"
            onClick={handleGenerateReport}
            className="rounded border border-slate-600 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Générer rapport
          </button>
        </div>
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

      {/* Modale rapport médico-diagnostique */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-3">
              <h2 className="text-lg font-semibold text-slate-900">Rapport médico-diagnostique — {patientId} — {sa} SA</h2>
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Fermer"
              >
                ×
              </button>
            </div>
            <div ref={reportPrintRef} className="p-4 print:block">
              {reportLoading && <p className="text-sm text-slate-500">Génération du rapport…</p>}
              {report && !reportLoading && (
                <>
                  {report.model_used && (
                    <p className="mb-2 text-xs text-slate-500">
                      Modèle IA : {report.model_used} — Tracabilité : hash audit {report.audit_hash?.slice(0, 16)}…
                    </p>
                  )}
                  {report.sections && (
                    <div className="space-y-3 text-sm">
                      {Object.entries(report.sections).map(([key, value]) => (
                        <div key={key}>
                          <h3 className="font-medium capitalize text-slate-700">
                            {key.replace(/_/g, ' ')}
                          </h3>
                          <p className="mt-0.5 whitespace-pre-wrap text-slate-600">{value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
              {!report && !reportLoading && (
                <p className="text-sm text-slate-500">Impossible de générer le rapport.</p>
              )}
            </div>
            {report && !reportLoading && (
              <div className="border-t border-slate-200 p-3">
                <button
                  type="button"
                  onClick={handlePrintReport}
                  className="rounded bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
                >
                  Exporter en PDF (impression)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

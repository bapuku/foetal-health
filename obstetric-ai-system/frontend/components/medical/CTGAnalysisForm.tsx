'use client';

import { useState } from 'react';
import { analyzeCTG, type CTGOutput } from '@/lib/api';
import BadgeAction from '@/components/ui/BadgeAction';
import ActionModal from '@/components/ui/ActionModal';

interface CTGAnalysisFormProps {
  patientId?: string;
  patientLabel?: string;
  patientSa?: number;
}

export default function CTGAnalysisForm({ patientId, patientLabel, patientSa }: CTGAnalysisFormProps) {
  const [baselineBpm, setBaselineBpm] = useState(140);
  const [stvMs, setStvMs] = useState(12);
  const [decelLight, setDecelLight] = useState(0);
  const [decelSevere, setDecelSevere] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CTGOutput | null>(null);
  const [classificationModalOpen, setClassificationModalOpen] = useState(false);
  const [saveToDossierMessage, setSaveToDossierMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setSaveToDossierMessage(null);
    setLoading(true);
    try {
      const out = await analyzeCTG({
        baseline_bpm: baselineBpm,
        stv_ms: stvMs,
        decelerations_light: decelLight,
        decelerations_severe: decelSevere,
      });
      setResult(out);
      if (patientId && patientLabel) {
        const classification = (out.classification ?? 'Normal').toLowerCase();
        const body = {
          date: new Date().toISOString().slice(0, 10),
          baselineBpm,
          stvMs,
          classification: classification === 'normal' || classification === 'suspect' || classification === 'pathologique' ? classification : 'normal',
          narrative: out.narrative ?? '',
        };
        const res = await fetch(`/api/dossiers/${patientId}/ctg`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          setSaveToDossierMessage(`Resultat sauvegarde dans le dossier de ${patientLabel}`);
          setTimeout(() => setSaveToDossierMessage(null), 5000);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur reseau - verifiez que le backend CTG est lance (port 8000)');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">
          Analyse CTG{patientLabel ? ` — ${patientLabel}` : ''}
        </h2>
        <p className="text-xs text-slate-500">
          {patientId
            ? `Classification FIGO pour ${patientId} (${patientSa ?? '—'} SA)`
            : 'Soumettre des parametres pour classification FIGO via l\'agent CTG Monitor'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-slate-600">FHR baseline (bpm)</span>
          <input
            type="number"
            min={80}
            max={200}
            value={baselineBpm}
            onChange={(e) => setBaselineBpm(Number(e.target.value))}
            className="input-field"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-slate-600">STV (ms)</span>
          <input
            type="number"
            min={0}
            max={50}
            step={0.5}
            value={stvMs}
            onChange={(e) => setStvMs(Number(e.target.value))}
            className="input-field"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-slate-600">Decel. legeres</span>
          <input
            type="number"
            min={0}
            max={20}
            value={decelLight}
            onChange={(e) => setDecelLight(Number(e.target.value))}
            className="input-field"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-slate-600">Decel. severes</span>
          <input
            type="number"
            min={0}
            max={20}
            value={decelSevere}
            onChange={(e) => setDecelSevere(Number(e.target.value))}
            className="input-field"
          />
        </label>
        <div className="flex items-end">
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyse...
              </span>
            ) : (
              'Lancer l\'analyse'
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {saveToDossierMessage && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {saveToDossierMessage}
        </div>
      )}
      {result && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          {patientId && (
            <p className="text-xs text-blue-700 font-medium mb-2">
              Resultat pour {patientLabel ?? patientId} ({patientSa ?? '—'} SA)
            </p>
          )}
          <div className="flex items-center gap-4 mb-3 flex-wrap">
            <BadgeAction
              variant={result.classification === 'Pathologique' ? 'danger' : result.classification === 'Suspect' ? 'warn' : 'ok'}
              onClick={() => setClassificationModalOpen(true)}
              title="Voir detail classification et SHAP"
            >
              {result.classification}
            </BadgeAction>
            <span className="text-sm text-slate-500">
              Confiance: <strong>{(result.confidence * 100).toFixed(0)}%</strong>
            </span>
            {result.hitl_required && (
              <BadgeAction variant="danger" onClick={() => setClassificationModalOpen(true)} title="Validation HITL requise">
                <span className="flex items-center gap-1">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                  </svg>
                  HITL requis
                </span>
              </BadgeAction>
            )}
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{result.narrative}</p>
        </div>
      )}

      <ActionModal
        isOpen={classificationModalOpen}
        onClose={() => setClassificationModalOpen(false)}
        title={`Detail classification FIGO${patientLabel ? ` — ${patientLabel}` : ''}`}
        size="lg"
        actions={<button type="button" onClick={() => setClassificationModalOpen(false)} className="btn-primary">Fermer</button>}
      >
        <div className="space-y-3 text-sm">
          {result && (
            <>
              {patientId && (
                <p className="text-blue-700 font-medium">Patiente : {patientLabel ?? patientId} ({patientSa ?? '—'} SA)</p>
              )}
              <p><strong>Classification :</strong> {result.classification} (confiance {(result.confidence * 100).toFixed(0)}%)</p>
              <p className="text-slate-600">{result.narrative}</p>
              <p className="font-medium text-slate-700">Features SHAP (importance) :</p>
              <ul className="list-disc pl-5 text-slate-600">
                <li>FHR baseline : impact majeur sur la classification</li>
                <li>Variabilite STV : second facteur</li>
                <li>Decelerations : poids selon severite</li>
              </ul>
            </>
          )}
        </div>
      </ActionModal>
    </div>
  );
}

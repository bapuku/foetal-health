'use client';

import { useState } from 'react';
import { evaluateApgar, type ApgarOutput } from '@/lib/api';
import BadgeAction from '@/components/ui/BadgeAction';
import ActionModal from '@/components/ui/ActionModal';

export default function ApgarForm() {
  const [apgar1, setApgar1] = useState(8);
  const [apgar5, setApgar5] = useState(9);
  const [heartRate, setHeartRate] = useState(140);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApgarOutput | null>(null);
  const [hitlModalOpen, setHitlModalOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const out = await evaluateApgar({
        apgar_1min: apgar1,
        apgar_5min: apgar5,
        heart_rate: heartRate,
      });
      setResult(out);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur reseau - verifiez que le backend Apgar est lance (port 8001)');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">Evaluation Apgar</h2>
        <p className="text-xs text-slate-500">Score d&apos;adaptation neonatale via l&apos;agent Apgar Transition</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-slate-600">Apgar 1 min (0-10)</span>
          <input
            type="number"
            min={0}
            max={10}
            value={apgar1}
            onChange={(e) => setApgar1(Number(e.target.value))}
            className="input-field"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-slate-600">Apgar 5 min (0-10)</span>
          <input
            type="number"
            min={0}
            max={10}
            value={apgar5}
            onChange={(e) => setApgar5(Number(e.target.value))}
            className="input-field"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-slate-600">FC neonatale (bpm)</span>
          <input
            type="number"
            min={60}
            max={200}
            value={heartRate}
            onChange={(e) => setHeartRate(Number(e.target.value))}
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
                Evaluation...
              </span>
            ) : (
              'Evaluer'
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            {result.risk_apgar_low ? (
              <BadgeAction variant="danger" onClick={() => setHitlModalOpen(true)} title="Voir detail">
                Risque Apgar bas
              </BadgeAction>
            ) : (
              <span className="badge-ok">Apgar normal</span>
            )}
            {result.hitl_required && (
              <BadgeAction variant="danger" onClick={() => setHitlModalOpen(true)} title="Panneau validation pediatre">
                <span className="flex items-center gap-1">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                  </svg>
                  Validation pediatre requise
                </span>
              </BadgeAction>
            )}
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{result.narrative}</p>
        </div>
      )}

      <ActionModal
        isOpen={hitlModalOpen}
        onClose={() => setHitlModalOpen(false)}
        title="Validation pediatre (HITL)"
        size="md"
        actions={
          <>
            <button type="button" onClick={() => setHitlModalOpen(false)} className="btn-secondary">Fermer</button>
            <button type="button" className="btn-primary">Valider et signer</button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-slate-600">
          <p>Apgar 5 min &le; 6 declenche une alerte HITL. Le pediatre doit valider le resultat et la prise en charge.</p>
          <p>Commentaire (optionnel) :</p>
          <textarea className="input-field min-h-[80px]" placeholder="Commentaire clinique..." />
        </div>
      </ActionModal>

      {/* Scoring Reference */}
      <div className="mt-4 rounded-lg bg-slate-50 p-3">
        <p className="text-xs font-medium text-slate-500 mb-2">Reference Score Apgar</p>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="rounded bg-green-50 p-2 text-center">
            <p className="font-bold text-green-700">7-10</p>
            <p className="text-green-600">Normal</p>
          </div>
          <div className="rounded bg-amber-50 p-2 text-center">
            <p className="font-bold text-amber-700">4-6</p>
            <p className="text-amber-600">Moderement bas</p>
          </div>
          <div className="rounded bg-red-50 p-2 text-center">
            <p className="font-bold text-red-700">0-3</p>
            <p className="text-red-600">Critique</p>
          </div>
        </div>
      </div>
    </div>
  );
}

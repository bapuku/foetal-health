'use client';

import { useState, useEffect } from 'react';

export interface PatientOption {
  id: string;
  nom: string;
  prenom: string;
  age: number;
  sa: number;
  risque: 'bas' | 'moyen' | 'eleve';
  derniereVisite: string;
  statut: 'actif' | 'accouchee' | 'suivi';
}

const FALLBACK_PATIENTS: PatientOption[] = [
  { id: 'P-2024-0847', nom: 'Martin', prenom: 'Sophie', age: 31, sa: 38, risque: 'bas', derniereVisite: '18/02/2026', statut: 'actif' },
  { id: 'P-2024-0845', nom: 'Dubois', prenom: 'Marie', age: 28, sa: 36, risque: 'moyen', derniereVisite: '17/02/2026', statut: 'actif' },
  { id: 'P-2024-0841', nom: 'Petit', prenom: 'Isabelle', age: 29, sa: 34, risque: 'eleve', derniereVisite: '16/02/2026', statut: 'actif' },
];

interface PatientSelectorProps {
  selected: PatientOption | null;
  onSelect: (patient: PatientOption) => void;
  label?: string;
}

const RISQUE_STYLES: Record<string, string> = {
  bas: 'bg-green-100 text-green-800',
  moyen: 'bg-amber-100 text-amber-800',
  eleve: 'bg-red-100 text-red-800',
};

export default function PatientSelector({ selected, onSelect, label }: PatientSelectorProps) {
  const [patients, setPatients] = useState<PatientOption[]>(FALLBACK_PATIENTS);

  useEffect(() => {
    fetch('/api/patients', { signal: AbortSignal.timeout(5000) })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: PatientOption[] | null) => {
        if (data && data.length > 0) setPatients(data);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-blue-800 mb-2">
        {label ?? 'Sélectionner une patiente'}
      </p>
      {selected && (
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-blue-200 bg-white p-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900">{selected.prenom} {selected.nom}</p>
            <p className="text-xs text-slate-500">{selected.id} · {selected.sa} SA · {selected.age} ans</p>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${RISQUE_STYLES[selected.risque] ?? ''}`}>
            {selected.risque}
          </span>
          <button type="button" onClick={() => onSelect(selected)} className="text-xs text-blue-600 hover:underline shrink-0">
            Changer
          </button>
        </div>
      )}
      {!selected && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {patients.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p)}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{p.prenom} {p.nom}</p>
                <p className="text-xs text-slate-500">{p.id} · {p.sa} SA</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${RISQUE_STYLES[p.risque] ?? ''}`}>
                {p.risque}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

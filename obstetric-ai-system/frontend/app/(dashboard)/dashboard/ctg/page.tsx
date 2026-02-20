'use client';

import { useState } from 'react';
import CTGChart from '@/components/medical/CTGChart';
import CTGAnalysisForm from '@/components/medical/CTGAnalysisForm';
import PageBanner from '@/components/ui/PageBanner';
import PatientSelector, { type PatientOption } from '@/components/ui/PatientSelector';

export default function CTGPage() {
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null);

  return (
    <div className="space-y-6">
      <PageBanner src="/images/ctg-monitor.png" alt="Monitoring CTG" title="Monitoring CTG" subtitle="Cardiotocographie foetale - Classification FIGO temps reel" />
      <div>
        <h1 className="text-xl font-bold text-slate-900">Monitoring CTG</h1>
        <p className="text-sm text-slate-500">
          Selectionnez une patiente puis lancez le monitoring CTG et l&apos;analyse FIGO.
        </p>
      </div>

      <PatientSelector
        selected={selectedPatient}
        onSelect={(p) => setSelectedPatient(selectedPatient?.id === p.id ? null : p)}
        label="Patiente pour le monitoring CTG"
      />

      {!selectedPatient && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Selectionnez une patiente pour demarrer le monitoring CTG.
        </div>
      )}

      {selectedPatient && (
        <>
          {/* Stats rapides */}
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="card">
              <p className="text-sm text-slate-500">Patiente</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{selectedPatient.prenom} {selectedPatient.nom}</p>
              <p className="text-xs text-slate-400">{selectedPatient.id} &middot; {selectedPatient.sa} SA &middot; {selectedPatient.age} ans</p>
            </div>
            <div className="card">
              <p className="text-sm text-slate-500">Analyses aujourd&apos;hui</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">12</p>
            </div>
            <div className="card">
              <p className="text-sm text-slate-500">Classification normale</p>
              <p className="mt-1 text-2xl font-bold text-green-600">83%</p>
            </div>
            <div className="card">
              <p className="text-sm text-slate-500">HITL en attente</p>
              <p className="mt-1 text-2xl font-bold text-amber-600">1</p>
            </div>
          </div>

          {/* CTG Chart */}
          <CTGChart patientLabel={`${selectedPatient.prenom} ${selectedPatient.nom} (${selectedPatient.id})`} />

          {/* Analysis Form */}
          <CTGAnalysisForm
            patientId={selectedPatient.id}
            patientLabel={`${selectedPatient.prenom} ${selectedPatient.nom}`}
            patientSa={selectedPatient.sa}
          />
        </>
      )}

      {/* Legend - always visible */}
      <div className="card">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Classification FIGO</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex items-start gap-3 rounded-lg bg-green-50 p-3">
            <span className="mt-0.5 h-3 w-3 rounded-full bg-green-500" />
            <div>
              <p className="text-sm font-medium text-green-800">Normal</p>
              <p className="text-xs text-green-600">FHR 110-160 bpm, variabilite 5-25 bpm, accelerations presentes, pas de decelerations</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-3">
            <span className="mt-0.5 h-3 w-3 rounded-full bg-amber-500" />
            <div>
              <p className="text-sm font-medium text-amber-800">Suspect</p>
              <p className="text-xs text-amber-600">Un critere anormal. Surveillance renforcee recommandee.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-red-50 p-3">
            <span className="mt-0.5 h-3 w-3 rounded-full bg-red-500" />
            <div>
              <p className="text-sm font-medium text-red-800">Pathologique</p>
              <p className="text-xs text-red-600">Deux+ criteres anormaux. HITL obligatoire - validation clinicien requise.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

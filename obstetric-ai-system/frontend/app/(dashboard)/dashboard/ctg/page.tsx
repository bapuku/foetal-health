'use client';

import CTGChart from '@/components/medical/CTGChart';
import CTGAnalysisForm from '@/components/medical/CTGAnalysisForm';
import PageBanner from '@/components/ui/PageBanner';

export default function CTGPage() {
  return (
    <div className="space-y-6">
      <PageBanner src="/images/ctg-monitor.png" alt="Monitoring CTG" title="Monitoring CTG" subtitle="Cardiotocographie fœtale - Classification FIGO temps réel" />
      <div>
        <h1 className="text-xl font-bold text-slate-900">Monitoring CTG</h1>
        <p className="text-sm text-slate-500">
          Cardiotocographie foetale - Classification FIGO temps reel
        </p>
      </div>

      {/* Stats rapides */}
      <div className="grid gap-4 sm:grid-cols-3">
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
      <CTGChart />

      {/* Analysis Form */}
      <CTGAnalysisForm />

      {/* Legend */}
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

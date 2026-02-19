'use client';

import RiskDashboard from '@/components/medical/RiskDashboard';
import ApgarForm from '@/components/medical/ApgarForm';
import ExplainabilityView from '@/components/medical/ExplainabilityView';
import PageBanner from '@/components/ui/PageBanner';

export default function RisksPage() {
  return (
    <div className="space-y-6">
      <PageBanner src="/images/delivery-room.png" alt="Salle d'accouchement" title="Dashboard Risques" subtitle="Évaluation multi-agent des risques foeto-maternels avec explicabilité" />
      <div>
        <h1 className="text-xl font-bold text-slate-900">Dashboard Risques</h1>
        <p className="text-sm text-slate-500">
          Evaluation multi-agent des risques foeto-maternels avec explicabilite
        </p>
      </div>

      {/* Risk Dashboard */}
      <RiskDashboard />

      {/* Apgar Form */}
      <ApgarForm />

      {/* Explainability */}
      <ExplainabilityView />
    </div>
  );
}

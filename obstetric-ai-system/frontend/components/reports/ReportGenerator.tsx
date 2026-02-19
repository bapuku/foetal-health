'use client';

import { useState } from 'react';
import { generateDemoReport, type ReportData } from '@/lib/report-generator';

interface ReportGeneratorProps {
  patientOptions: { id: string; label: string }[];
  onGenerated: (report: ReportData) => void;
}

export default function ReportGenerator({ patientOptions, onGenerated }: ReportGeneratorProps) {
  const [patientId, setPatientId] = useState('');
  const [loading, setLoading] = useState(false);

  function handleGenerate() {
    if (!patientId) return;
    setLoading(true);
    try {
      const report = generateDemoReport(patientId);
      onGenerated(report);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2 className="text-base font-semibold text-slate-900 mb-3">Generer un rapport</h2>
      <p className="text-sm text-slate-500 mb-4">
        Rapport structure au format Harvard Cite It Right, avec triangulation et references EndNote.
      </p>
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1.5 min-w-[200px]">
          <span className="text-xs font-medium text-slate-600">Patiente</span>
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="input-field"
          >
            <option value="">Selectionner...</option>
            {patientOptions.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading || !patientId}
          className="btn-primary"
        >
          {loading ? 'Generation...' : 'Generer le rapport'}
        </button>
      </div>
    </div>
  );
}

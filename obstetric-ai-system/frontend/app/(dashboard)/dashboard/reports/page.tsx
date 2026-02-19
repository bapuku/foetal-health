'use client';

import { useState } from 'react';
import ReportGenerator from '@/components/reports/ReportGenerator';
import ReportViewer from '@/components/reports/ReportViewer';
import { generateDemoReport, type ReportData } from '@/lib/report-generator';
import { toRis } from '@/lib/citations';
import PageBanner from '@/components/ui/PageBanner';

const MOCK_PATIENTS = [
  { id: 'P-2024-0847', label: 'P-2024-0847 - Sophie Martin' },
  { id: 'P-2024-0845', label: 'P-2024-0845 - Marie Dubois' },
  { id: 'P-2024-0841', label: 'P-2024-0841 - Isabelle Petit' },
  { id: 'P-2024-0831', label: 'P-2024-0831 - Emma Leroy' },
];

const MOCK_REPORTS: { id: string; patientId: string; date: string; type: string; status: string }[] = [
  { id: 'R1', patientId: 'P-2024-0847', date: '2026-02-18', type: 'Complet', status: 'Genere' },
  { id: 'R2', patientId: 'P-2024-0845', date: '2026-02-17', type: 'Complet', status: 'Genere' },
  { id: 'R3', patientId: 'P-2024-0841', date: '2026-02-16', type: 'Urgence', status: 'Genere' },
];

export default function ReportsPage() {
  const [currentReport, setCurrentReport] = useState<ReportData | null>(null);

  function handleExportRis(report?: ReportData) {
    const data = report ?? currentReport;
    if (!data) return;
    const ris = toRis(data.references);
    const blob = new Blob([ris], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `references_${data.patientIdAnonymized}.ris`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <PageBanner src="/images/doctor-scans.png" alt="Revue des rapports" title="Rapports patients" subtitle="Rapports structurés Harvard Cite It Right, triangulation, références EndNote" />
      <div>
        <h1 className="text-xl font-bold text-slate-900">Rapports patients</h1>
        <p className="text-sm text-slate-500">
          Rapports structures Harvard Cite It Right, triangulation, references EndNote
        </p>
      </div>

      <ReportGenerator
        patientOptions={MOCK_PATIENTS}
        onGenerated={setCurrentReport}
      />

      <div className="card">
        <h2 className="text-base font-semibold text-slate-900 mb-3">Rapports generes</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="pb-2 font-medium text-slate-500">Patient</th>
                <th className="pb-2 font-medium text-slate-500">Date</th>
                <th className="pb-2 font-medium text-slate-500">Type</th>
                <th className="pb-2 font-medium text-slate-500">Statut</th>
                <th className="pb-2 font-medium text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_REPORTS.map((r) => (
                <tr key={r.id}>
                  <td className="py-2 text-slate-700">{r.patientId}</td>
                  <td className="py-2 text-slate-600">{r.date}</td>
                  <td className="py-2 text-slate-600">{r.type}</td>
                  <td className="py-2">
                    <span className="badge-ok">{r.status}</span>
                  </td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => setCurrentReport(generateDemoReport(r.patientId))}
                      className="text-blue-600 hover:underline text-xs font-medium"
                    >
                      Voir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {currentReport && (
        <ReportViewer
          report={currentReport}
          onExportPdf={() => {}}
          onExportRis={() => handleExportRis(currentReport)}
        />
      )}
    </div>
  );
}
'use client';

import { useRef, useState } from 'react';
import type { ReportData } from '@/lib/report-generator';
import CitationList from './CitationList';
import TriangulationTable from './TriangulationTable';
import { toRis } from '@/lib/citations';
import { exportReportToDocx, downloadDocx } from '@/lib/docx-exporter';

interface ReportViewerProps {
  report: ReportData;
  onExportPdf: () => void;
  onExportRis: () => void;
}

export default function ReportViewer({ report, onExportPdf, onExportRis }: ReportViewerProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [docxLoading, setDocxLoading] = useState(false);

  function handlePrint() {
    if (printRef.current) {
      const prevTitle = document.title;
      document.title = `Rapport_${report.patientIdAnonymized}_${report.date}`;
      window.print();
      document.title = prevTitle;
    }
    onExportPdf();
  }

  async function handleExportDocx() {
    setDocxLoading(true);
    try {
      const blob = await exportReportToDocx(report);
      const filename = `Rapport_${report.patientIdAnonymized}_${report.date}.docx`;
      downloadDocx(blob, filename);
    } finally {
      setDocxLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2 no-print flex-wrap">
        <button type="button" onClick={handlePrint} className="btn-primary">
          Export PDF
        </button>
        <button type="button" onClick={handleExportDocx} disabled={docxLoading} className="btn-secondary">
          {docxLoading ? 'Generation...' : 'Export DOCX'}
        </button>
        <button type="button" onClick={onExportRis} className="btn-secondary">
          Export refs EndNote (.ris)
        </button>
      </div>

      <div ref={printRef} className="report-content space-y-6 rounded-lg border border-slate-200 bg-white p-8">
        <header className="border-b border-slate-200 pb-4">
          <h1 className="text-xl font-bold text-slate-900">Rapport clinique structure</h1>
          <p className="mt-1 text-sm text-slate-500">ID patient (anonymise) : {report.patientIdAnonymized}</p>
          <p className="text-sm text-slate-500">Date : {report.date}</p>
          <p className="text-xs text-slate-400 mt-2">Auteurs IA : {report.authorIa}</p>
          <p className="text-xs text-slate-400">Validateur : {report.authorValidator}</p>
        </header>

        <section>
          <h2 className="text-sm font-semibold uppercase text-slate-600 mb-2">1. Resume executif</h2>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{report.executiveSummary}</p>
        </section>

        {report.narrativeSections?.situationClinique && (
          <section>
            <h2 className="text-sm font-semibold uppercase text-slate-600 mb-2">2. Situation clinique</h2>
            <p className="text-sm text-slate-700 leading-relaxed">{report.narrativeSections.situationClinique}</p>
          </section>
        )}

        <section>
          <h2 className="text-sm font-semibold uppercase text-slate-600 mb-2">{report.narrativeSections ? '3. ' : '2. '}Donnees cliniques</h2>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {report.clinicalData.map((row, i) => (
                <tr key={i}>
                  <td className="py-1.5 font-medium text-slate-600 w-1/3">{row.label}</td>
                  <td className="py-1.5 text-slate-800">{row.value} {row.unit ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase text-slate-600 mb-2">{report.narrativeSections ? '4. ' : '3. '}Analyse multi-agent</h2>
          {report.narrativeSections?.analyseMultiAgent && (
            <p className="text-sm text-slate-700 leading-relaxed mb-4">{report.narrativeSections.analyseMultiAgent}</p>
          )}
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            {report.multiAgentAnalysis.map((a, i) => (
              <li key={i}>
                <strong>{a.agent}</strong> : {a.result}
                {a.reference && <span className="text-slate-500"> ({a.reference})</span>}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase text-slate-600 mb-2">{report.narrativeSections ? '5. ' : '4. '}Triangulation systematique</h2>
          <TriangulationTable rows={report.triangulation} />
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase text-slate-600 mb-2">{report.narrativeSections ? '6. ' : '5. '}Classification et risques</h2>
          {report.narrativeSections?.classificationRisques && (
            <p className="text-sm text-slate-700 leading-relaxed mb-4">{report.narrativeSections.classificationRisques}</p>
          )}
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {report.classificationRisks.map((r, i) => (
                <tr key={i}>
                  <td className="py-1.5 font-medium text-slate-600">{r.name}</td>
                  <td className="py-1.5 text-slate-800">{r.value} {r.ic95 ?? ''}</td>
                  <td className="py-1.5 text-slate-500">{r.level ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase text-slate-600 mb-2">{report.narrativeSections ? '7. ' : '6. '}Explicabilite</h2>
          {report.narrativeSections?.explicabilite && (
            <p className="text-sm text-slate-700 leading-relaxed mb-4">{report.narrativeSections.explicabilite}</p>
          )}
          <ul className="space-y-1 text-sm text-slate-700">
            {report.explicability.map((e, i) => (
              <li key={i}><strong>{e.method}</strong> : {e.summary}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase text-slate-600 mb-2">{report.narrativeSections ? '8. ' : '7. '}Recommandations</h2>
          {report.narrativeSections?.recommandations && (
            <p className="text-sm text-slate-700 leading-relaxed mb-4">{report.narrativeSections.recommandations}</p>
          )}
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            {report.recommendations.map((r, i) => (
              <li key={i}>{r.action} <span className="text-slate-500">({r.level})</span></li>
            ))}
          </ul>
        </section>

        {report.narrativeSections?.planNeonatal && (
          <section>
            <h2 className="text-sm font-semibold uppercase text-slate-600 mb-2">9. Plan de soins neonataux</h2>
            <p className="text-sm text-slate-700 leading-relaxed">{report.narrativeSections.planNeonatal}</p>
          </section>
        )}

        <section>
          <h2 className="text-sm font-semibold uppercase text-slate-600 mb-2">{report.narrativeSections ? '10. ' : '8. '}Sources et audit</h2>
          <CitationList citations={report.references} />
        </section>

        <section className="pt-4 border-t border-slate-200 text-xs text-slate-400">
          <p>Annexes : trace CTG, ressources FHIR et audit log disponibles sur demande.</p>
        </section>
      </div>
    </div>
  );
}

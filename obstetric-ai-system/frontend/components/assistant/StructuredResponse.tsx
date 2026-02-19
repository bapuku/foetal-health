'use client';

import { useState } from 'react';
import { formatHarvard, toRis } from '@/lib/citations';
import type { TriangulationRow } from '@/lib/report-generator';
import type { StructuredAIResponse } from '@/lib/assistant-types';

export type { StructuredAIResponse } from '@/lib/assistant-types';

interface StructuredResponseProps {
  data: StructuredAIResponse;
}

function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700"
      >
        {title}
        <svg
          className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  );
}

export default function StructuredResponse({ data }: StructuredResponseProps) {
  return (
    <div className="space-y-3 text-sm">
      <CollapsibleSection title="Résumé diagnostique" defaultOpen={true}>
        <p className="text-slate-700">{data.summary}</p>
      </CollapsibleSection>

      <CollapsibleSection title="Narratif technique" defaultOpen={true}>
        <p className="whitespace-pre-wrap text-slate-700">{data.narrative}</p>
      </CollapsibleSection>

      {data.patientContext && data.patientContext.length > 0 && (
        <CollapsibleSection title="Contexte patient" defaultOpen={false}>
          <ul className="space-y-1 text-slate-700">
            {data.patientContext.map((p, i) => (
              <li key={i}>
                <span className="font-medium text-slate-600">{p.field}:</span> {p.value}
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      )}

      {data.metrics && data.metrics.length > 0 && (
        <CollapsibleSection title="Métriques / Données" defaultOpen={true}>
          <div className="overflow-x-auto">
            <table className="w-full border border-slate-200 rounded-lg text-sm">
              <thead>
                <tr className="bg-slate-100 text-left">
                  <th className="px-3 py-2 font-medium text-slate-700">Métrique</th>
                  <th className="px-3 py-2 font-medium text-slate-700">Valeur</th>
                  <th className="px-3 py-2 font-medium text-slate-700">Seuil</th>
                  <th className="px-3 py-2 font-medium text-slate-700">Statut</th>
                </tr>
              </thead>
              <tbody>
                {data.metrics.map((m, i) => (
                  <tr key={i} className="border-t border-slate-200">
                    <td className="px-3 py-2 text-slate-800">{m.name}</td>
                    <td className="px-3 py-2 text-slate-700">{m.value}</td>
                    <td className="px-3 py-2 text-slate-600">{m.threshold ?? '—'}</td>
                    <td className="px-3 py-2">
                      {m.status ? (
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            m.status === 'normal'
                              ? 'bg-green-100 text-green-800'
                              : m.status === 'warning'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {m.status}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CollapsibleSection>
      )}

      {data.triangulation && data.triangulation.length > 0 && (
        <CollapsibleSection title="Triangulation" defaultOpen={false}>
          <div className="overflow-x-auto">
            <table className="w-full border border-slate-200 rounded-lg text-sm">
              <thead>
                <tr className="bg-slate-100 text-left">
                  <th className="px-3 py-2 font-medium text-slate-700">Paramètre</th>
                  <th className="px-3 py-2 font-medium text-slate-700">Agent CTG</th>
                  <th className="px-3 py-2 font-medium text-slate-700">Agent Apgar</th>
                  <th className="px-3 py-2 font-medium text-slate-700">FHIR</th>
                  <th className="px-3 py-2 font-medium text-slate-700">Recommandations</th>
                  <th className="px-3 py-2 font-medium text-slate-700">Concordance</th>
                </tr>
              </thead>
              <tbody>
                {data.triangulation.map((r, i) => (
                  <tr key={i} className="border-t border-slate-200">
                    <td className="px-3 py-2 text-slate-800">{r.parameter}</td>
                    <td className="px-3 py-2 text-slate-700">{r.agentCtg}</td>
                    <td className="px-3 py-2 text-slate-700">{r.agentApgar}</td>
                    <td className="px-3 py-2 text-slate-700">{r.fhir}</td>
                    <td className="px-3 py-2 text-slate-600">{r.guidelines}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          r.convergence === 'convergent'
                            ? 'bg-green-100 text-green-800'
                            : r.convergence === 'divergent'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {r.convergence === 'convergent' ? 'Convergent' : r.convergence === 'divergent' ? 'Divergent' : 'Contradictoire'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CollapsibleSection>
      )}

      {data.recommendations && data.recommendations.length > 0 && (
        <CollapsibleSection title="Recommandations" defaultOpen={true}>
          <ul className="list-disc list-inside space-y-1 text-slate-700">
            {data.recommendations.map((rec, i) => (
              <li key={i}>
                {rec.action} <span className="text-slate-500">({rec.level})</span>
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      )}

      {data.references && data.references.length > 0 && (
        <CollapsibleSection title="Sources (Harvard Cite It Right)" defaultOpen={true}>
          <div className="flex flex-wrap items-center gap-2 pb-2">
            <button
              type="button"
              onClick={() => {
                const ris = toRis(data.references!);
                const blob = new Blob([ris], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `assistant_references_${new Date().toISOString().slice(0, 10)}.ris`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Exporter les références EndNote (.ris)
            </button>
          </div>
          <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600">
            {data.references.map((ref, i) => (
              <li key={ref.id ?? i} className="border-l-2 border-slate-200 pl-2">
                {formatHarvard(ref)}
              </li>
            ))}
          </ol>
        </CollapsibleSection>
      )}
    </div>
  );
}

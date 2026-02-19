'use client';

import type { TriangulationRow } from '@/lib/report-generator';

interface TriangulationTableProps {
  rows: TriangulationRow[];
}

const convergenceClass = {
  convergent: 'bg-green-50 text-green-800',
  divergent: 'bg-amber-50 text-amber-800',
  contradictory: 'bg-red-50 text-red-800',
};

export default function TriangulationTable({ rows }: TriangulationTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-3 py-2 text-left font-medium text-slate-600">Parametre</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">Agent CTG</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">Agent Apgar</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">Donnees FHIR</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">Guidelines</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">Concordance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, i) => (
            <tr key={i}>
              <td className="px-3 py-2 font-medium text-slate-800">{row.parameter}</td>
              <td className="px-3 py-2 text-slate-600">{row.agentCtg}</td>
              <td className="px-3 py-2 text-slate-600">{row.agentApgar}</td>
              <td className="px-3 py-2 text-slate-600">{row.fhir}</td>
              <td className="px-3 py-2 text-slate-600">{row.guidelines}</td>
              <td className="px-3 py-2">
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${convergenceClass[row.convergence]}`}>
                  {row.convergence === 'convergent' ? 'Convergent' : row.convergence === 'divergent' ? 'Divergent' : 'Contradictoire'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

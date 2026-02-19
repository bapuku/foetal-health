'use client';

import { formatHarvard, type HarvardCitation } from '@/lib/citations';

interface CitationListProps {
  citations: HarvardCitation[];
  onExportRis?: () => void;
}

export default function CitationList({ citations, onExportRis }: CitationListProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">References (Harvard Cite It Right)</h3>
        {onExportRis && (
          <button type="button" onClick={onExportRis} className="text-xs text-blue-600 hover:underline">
            Export EndNote (.ris)
          </button>
        )}
      </div>
      <ol className="list-decimal space-y-2 pl-5 text-xs text-slate-700">
        {citations.map((c, i) => (
          <li key={c.id} id={`ref-${c.id}`} className="leading-relaxed">
            {formatHarvard(c)}
          </li>
        ))}
      </ol>
    </div>
  );
}

'use client';

import { useState } from 'react';

export interface SkillItem {
  name: string;
  description: string;
  inputs?: string;
  outputs?: string;
  model?: string;
  latencyMs?: number;
}

interface SkillCardProps {
  agentName: string;
  port: number;
  status: 'up' | 'down';
  skills: SkillItem[];
  endpoint?: string;
}

export default function SkillCard({ agentName, port, status, skills, endpoint }: SkillCardProps) {
  const [execResult, setExecResult] = useState<{ loading: boolean; data?: string; ok?: boolean; ms?: number } | null>(null);
  const [expanded, setExpanded] = useState(false);

  const executeSkill = async () => {
    setExecResult({ loading: true });
    const t0 = Date.now();
    try {
      const ep = endpoint || `/api/${agentName.toLowerCase().replace(/\s+/g, '-')}`;
      const res = await fetch(`http://localhost:${port}${ep}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demo: true }),
        signal: AbortSignal.timeout(10000),
      });
      const data = await res.json().catch(() => res.text());
      setExecResult({ loading: false, data: JSON.stringify(data, null, 2), ok: res.ok, ms: Date.now() - t0 });
    } catch (e) {
      setExecResult({ loading: false, data: e instanceof Error ? e.message : 'Erreur', ok: false, ms: Date.now() - t0 });
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-900">{agentName}</h3>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status === 'up' ? 'bg-green-500' : 'bg-red-500'}`} />
            {status === 'up' ? 'Actif' : 'Inactif'}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {skills.slice(0, expanded ? skills.length : 2).map((s, i) => (
          <div key={i} className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 text-xs">
            <p className="font-medium text-slate-800">{s.name}</p>
            <p className="mt-1 text-slate-600">{s.description}</p>
            {(s.inputs || s.outputs) && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {s.inputs && <span className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-700">In: {s.inputs}</span>}
                {s.outputs && <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">Out: {s.outputs}</span>}
              </div>
            )}
            {(s.model || s.latencyMs != null) && (
              <p className="mt-1 text-slate-400">
                {s.model && <span>{s.model}</span>}
                {s.model && s.latencyMs != null && ' · '}
                {s.latencyMs != null && <span>~{s.latencyMs} ms</span>}
              </p>
            )}
          </div>
        ))}
        {skills.length > 2 && (
          <button type="button" onClick={() => setExpanded(!expanded)} className="text-xs text-blue-600 hover:underline">
            {expanded ? 'Reduire' : `+ ${skills.length - 2} competences`}
          </button>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={executeSkill}
          disabled={execResult?.loading || status === 'down'}
          className="btn-primary text-xs py-1.5 px-3 disabled:opacity-50"
        >
          {execResult?.loading ? 'Execution...' : 'Executer (demo)'}
        </button>
        <span className="text-xs text-slate-400">Port {port}</span>
      </div>

      {execResult && !execResult.loading && (
        <div className={`mt-3 rounded-lg border p-3 text-xs ${execResult.ok ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-medium ${execResult.ok ? 'text-green-800' : 'text-red-800'}`}>
              {execResult.ok ? 'Succes' : 'Echec'}
            </span>
            {execResult.ms != null && <span className="text-slate-500">{execResult.ms} ms</span>}
          </div>
          <pre className="max-h-40 overflow-auto whitespace-pre-wrap text-slate-700">{execResult.data}</pre>
        </div>
      )}
    </div>
  );
}

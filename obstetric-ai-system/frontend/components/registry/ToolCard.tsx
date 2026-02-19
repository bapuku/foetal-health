'use client';

import { useState } from 'react';

export type ToolCategory = 'medical' | 'ai' | 'fhir' | 'audit';

interface ToolCardProps {
  id?: string;
  name: string;
  description: string;
  category: ToolCategory;
  status: 'active' | 'inactive';
  version?: string;
  testEndpoint?: string;
  testPort?: number;
  onToggleActive?: () => void;
}

const categoryLabels: Record<ToolCategory, string> = {
  medical: 'Medical',
  ai: 'IA',
  fhir: 'FHIR',
  audit: 'Audit',
};

const categoryClass: Record<ToolCategory, string> = {
  medical: 'bg-green-100 text-green-800',
  ai: 'bg-blue-100 text-blue-800',
  fhir: 'bg-purple-100 text-purple-800',
  audit: 'bg-amber-100 text-amber-800',
};

const TOOL_DEMOS: Record<string, { port: number; endpoint: string; body?: object; method?: 'GET' | 'POST' }> = {
  bishop:           { port: 8004, endpoint: '/api/bishop-partogram', body: { demo: true } },
  rciu:             { port: 8005, endpoint: '/api/rciu-risk', body: { demo: true } },
  apgar:            { port: 8001, endpoint: '/api/apgar-transition', body: { demo: true } },
  'prenatal-calendar': { port: 8010, endpoint: '/api/prenatal-followup/norms', method: 'GET' },
  'screening-t21':  { port: 8010, endpoint: '/api/prenatal-followup/screening/t21', body: { risque_combine: 0.0004 } },
  'hgpo-calculator': { port: 8010, endpoint: '/api/prenatal-followup/screening/diabetes', body: { h0: 0.85, h1: 1.5, h2: 1.2 } },
  'gbs-screening':  { port: 8010, endpoint: '/api/prenatal-followup/screening/gbs', body: { sa_prelevement: 36, resultat: 'negatif', date_prelevement: new Date().toISOString().slice(0, 10) } },
  'llm-router':     { port: 8002, endpoint: '/health', method: 'GET' },
  'ctg-cnn':        { port: 8000, endpoint: '/api/ctg-monitor', body: { demo: true } },
  'fhir-client':    { port: 8000, endpoint: '/health', method: 'GET' },
  'audit-sha':      { port: 8002, endpoint: '/health', method: 'GET' },
};

export default function ToolCard({
  id: toolIdProp,
  name,
  description,
  category,
  status,
  version,
  testEndpoint,
  testPort,
  onToggleActive,
}: ToolCardProps) {
  const [testResult, setTestResult] = useState<{ loading: boolean; ok?: boolean; data?: string; ms?: number } | null>(null);

  const toolId = toolIdProp ?? name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const demo = TOOL_DEMOS[toolId];

  const runTest = async () => {
    setTestResult({ loading: true });
    const t0 = Date.now();
    const port = testPort ?? demo?.port ?? 8000;
    const endpoint = testEndpoint ?? demo?.endpoint ?? '/health';
    const body = demo?.body ?? {};
    const method = demo?.method ?? (endpoint === '/health' ? 'GET' : 'POST');

    try {
      const url = method === 'GET' && endpoint.includes('norms') ? `http://localhost:${port}${endpoint}?sa=28` : `http://localhost:${port}${endpoint}`;
      const res = await fetch(url, {
        method,
        headers: method === 'POST' ? { 'Content-Type': 'application/json' } : {},
        body: method === 'POST' ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(8000),
      });
      const data = await res.json().catch(() => res.text());
      setTestResult({ loading: false, ok: res.ok, data: typeof data === 'string' ? data : JSON.stringify(data, null, 2), ms: Date.now() - t0 });
    } catch (e) {
      setTestResult({ loading: false, ok: false, data: e instanceof Error ? e.message : 'Erreur', ms: Date.now() - t0 });
    }
  };

  return (
    <div className="card flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 truncate">{name}</h3>
          <p className="mt-1 text-xs text-slate-500 line-clamp-2">{description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {testResult && !testResult.loading && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${testResult.ok ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
              {testResult.ok ? 'Vérifié OK' : 'Echec'}
            </span>
          )}
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status === 'active' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status === 'active' ? 'bg-green-500' : 'bg-amber-500'}`} />
            {status === 'active' ? 'Actif' : 'Inactif'}
          </span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${categoryClass[category]}`}>
          {categoryLabels[category]}
        </span>
        {version && <span className="text-xs text-slate-400">v{version}</span>}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {onToggleActive && (
          <button
            type="button"
            onClick={onToggleActive}
            className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
          >
            {status === 'active' ? 'Désactiver' : 'Activer'}
          </button>
        )}
        <button
          type="button"
          onClick={runTest}
          disabled={testResult?.loading || status === 'inactive'}
          className="btn-primary text-xs py-1.5 px-3 disabled:opacity-50"
        >
          {testResult?.loading ? 'Vérification...' : 'Vérifier'}
        </button>
      </div>

      {testResult && !testResult.loading && (
        <div className={`mt-3 rounded-lg border p-3 text-xs ${testResult.ok ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-medium ${testResult.ok ? 'text-green-800' : 'text-red-800'}`}>
              {testResult.ok ? 'Succes' : 'Echec'}
            </span>
            {testResult.ms != null && <span className="text-slate-500">{testResult.ms} ms</span>}
          </div>
          <pre className="max-h-32 overflow-auto whitespace-pre-wrap text-slate-700">{testResult.data}</pre>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';

export type ToolCategory = 'medical' | 'ai' | 'fhir' | 'audit';

interface ToolCardProps {
  name: string;
  description: string;
  category: ToolCategory;
  status: 'active' | 'inactive';
  version?: string;
  testEndpoint?: string;
  testPort?: number;
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

const TOOL_DEMOS: Record<string, { port: number; endpoint: string; body: object }> = {
  bishop:       { port: 8004, endpoint: '/api/bishop-partogram', body: { demo: true } },
  rciu:         { port: 8005, endpoint: '/api/rciu-risk', body: { demo: true } },
  apgar:        { port: 8001, endpoint: '/api/apgar-transition', body: { demo: true } },
  'llm-router': { port: 8002, endpoint: '/health', body: {} },
  'ctg-cnn':    { port: 8000, endpoint: '/api/ctg-monitor', body: { demo: true } },
  'fhir-client':{ port: 8000, endpoint: '/health', body: {} },
  'audit-sha':  { port: 8002, endpoint: '/health', body: {} },
};

export default function ToolCard({
  name,
  description,
  category,
  status,
  version,
  testEndpoint,
  testPort,
}: ToolCardProps) {
  const [testResult, setTestResult] = useState<{ loading: boolean; ok?: boolean; data?: string; ms?: number } | null>(null);

  const toolId = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const demo = TOOL_DEMOS[toolId];

  const runTest = async () => {
    setTestResult({ loading: true });
    const t0 = Date.now();
    const port = testPort ?? demo?.port ?? 8000;
    const endpoint = testEndpoint ?? demo?.endpoint ?? '/health';
    const body = demo?.body ?? {};
    const method = endpoint === '/health' ? 'GET' : 'POST';

    try {
      const res = await fetch(`http://localhost:${port}${endpoint}`, {
        method,
        headers: method === 'POST' ? { 'Content-Type': 'application/json' } : {},
        body: method === 'POST' ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(8000),
      });
      const data = await res.json().catch(() => res.text());
      setTestResult({ loading: false, ok: res.ok, data: JSON.stringify(data, null, 2), ms: Date.now() - t0 });
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
        <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status === 'active' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${status === 'active' ? 'bg-green-500' : 'bg-amber-500'}`} />
          {status === 'active' ? 'Actif' : 'Inactif'}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${categoryClass[category]}`}>
          {categoryLabels[category]}
        </span>
        {version && <span className="text-xs text-slate-400">v{version}</span>}
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={runTest}
          disabled={testResult?.loading || status === 'inactive'}
          className="btn-primary text-xs py-1.5 px-3 disabled:opacity-50"
        >
          {testResult?.loading ? 'Test...' : 'Tester'}
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

'use client';

import { useState, useRef, useEffect } from 'react';
import WorkflowCard from '@/components/workflow/WorkflowCard';
import WorkflowBuilder from '@/components/workflow/WorkflowBuilder';
import type { WorkflowStep } from '@/components/workflow/WorkflowCard';
import PageBanner from '@/components/ui/PageBanner';
import ActionModal from '@/components/ui/ActionModal';
import { generateWorkflowDemoResult, type WorkflowRunResult } from '@/lib/agent-demo-results';

const TEMPLATES: { name: string; description: string; steps: WorkflowStep[] }[] = [
  {
    name: 'Pipeline standard',
    description: 'Intake → CTG + Bishop + RCIU (parallele) → Risk Synthesis → HITL → Symbolic + Polygraph → Quantum → Narrative',
    steps: [
      { id: '1', agent: 'CTG Monitor', port: 8000, type: 'parallel' },
      { id: '2', agent: 'Bishop Partogram', port: 8004, type: 'parallel' },
      { id: '3', agent: 'RCIU Risk', port: 8005, type: 'parallel' },
      { id: '4', agent: 'HITL Checkpoint', port: 0, type: 'hitl' },
      { id: '5', agent: 'Symbolic Reasoning', port: 8002, type: 'sequential' },
      { id: '6', agent: 'Polygraph Verifier', port: 8003, type: 'sequential' },
      { id: '7', agent: 'Quantum Optimizer', port: 8006, type: 'sequential' },
      { id: '8', agent: 'Clinical Narrative', port: 8008, type: 'sequential' },
    ],
  },
  {
    name: 'Urgence CTG',
    description: 'CTG Monitor → Classification → HITL immediat → Narrative',
    steps: [
      { id: 'u1', agent: 'CTG Monitor', port: 8000, type: 'sequential' },
      { id: 'u2', agent: 'HITL Checkpoint', port: 0, type: 'hitl' },
      { id: 'u3', agent: 'Clinical Narrative', port: 8008, type: 'sequential' },
    ],
  },
  {
    name: 'Evaluation postnatale',
    description: 'Apgar → Mother-Baby Risk → Narrative',
    steps: [
      { id: 'e1', agent: 'Apgar Transition', port: 8001, type: 'sequential' },
      { id: 'e2', agent: 'Mother-Baby Risk', port: 8007, type: 'sequential' },
      { id: 'e3', agent: 'Clinical Narrative', port: 8008, type: 'sequential' },
    ],
  },
  {
    name: 'Bilan complet',
    description: 'Les 10 agents en sequence / parallele',
    steps: [
      { id: 'b1', agent: 'CTG Monitor', port: 8000, type: 'parallel' },
      { id: 'b2', agent: 'Apgar Transition', port: 8001, type: 'parallel' },
      { id: 'b3', agent: 'Symbolic Reasoning', port: 8002, type: 'parallel' },
      { id: 'b4', agent: 'Polygraph Verifier', port: 8003, type: 'parallel' },
      { id: 'b5', agent: 'Bishop Partogram', port: 8004, type: 'parallel' },
      { id: 'b6', agent: 'RCIU Risk', port: 8005, type: 'parallel' },
      { id: 'b7', agent: 'Quantum Optimizer', port: 8006, type: 'sequential' },
      { id: 'b8', agent: 'Mother-Baby Risk', port: 8007, type: 'sequential' },
      { id: 'b9', agent: 'Clinical Narrative', port: 8008, type: 'sequential' },
      { id: 'b10', agent: 'User Engagement', port: 8009, type: 'sequential' },
    ],
  },
];

type HistoryEntry = { id: string; date: string; patient: string; workflow: string; status: string; duration: string; result: WorkflowRunResult };

function makeHistoryEntry(id: string, date: string, patient: string, workflow: string, duration: string, result: WorkflowRunResult): HistoryEntry {
  return { id, date, patient, workflow, status: 'Termine', duration, result };
}

const MOCK_HISTORY: HistoryEntry[] = [
  makeHistoryEntry('H1', '2026-02-18 14:32', 'P-2024-0847', 'Urgence CTG', '12 s', generateWorkflowDemoResult([{ agent: 'CTG Monitor', type: 'sequential' }, { agent: 'HITL Checkpoint', type: 'hitl' }, { agent: 'Clinical Narrative', type: 'sequential' }])),
  makeHistoryEntry('H2', '2026-02-18 13:15', 'P-2024-0845', 'Pipeline standard', '45 s', generateWorkflowDemoResult([{ agent: 'CTG Monitor', type: 'parallel' }, { agent: 'Bishop Partogram', type: 'parallel' }, { agent: 'RCIU Risk', type: 'parallel' }, { agent: 'HITL Checkpoint', type: 'hitl' }, { agent: 'Symbolic Reasoning', type: 'sequential' }, { agent: 'Clinical Narrative', type: 'sequential' }])),
  makeHistoryEntry('H3', '2026-02-17 16:00', 'P-2024-0841', 'Evaluation postnatale', '8 s', generateWorkflowDemoResult([{ agent: 'Apgar Transition', type: 'sequential' }, { agent: 'Mother-Baby Risk', type: 'sequential' }, { agent: 'Clinical Narrative', type: 'sequential' }])),
];

function ResultBlock({ result, compact }: { result: WorkflowRunResult; compact?: boolean }) {
  const rows = result.steps.flatMap((s) =>
    (s.result?.metrics ?? []).map((m) => ({ agent: s.agent, name: m.name, value: m.value, threshold: m.threshold, status: m.status }))
  );
  return (
    <div className="space-y-5">
      <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Résumé executif</p>
        <p className="text-slate-700 leading-relaxed">{result.summary}</p>
      </div>
      <div className="rounded-lg bg-blue-50/50 border border-blue-100 p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-blue-800">Narratif clinique</p>
        <p className="text-slate-700 leading-relaxed">{result.narrative}</p>
      </div>
      {!compact && result.steps.some((s) => s.result?.narrative) && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Detail par agent</p>
          <div className="space-y-3">
            {result.steps.filter((s) => s.result?.narrative).map((s, i) => (
              <div key={i} className="border-l-2 border-slate-200 pl-3 py-1">
                <p className="font-medium text-slate-800 text-sm">{s.agent}</p>
                <p className="text-slate-600 text-sm mt-0.5">{s.result!.narrative}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {rows.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Métriques par étape</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-slate-100 text-left">
                  <th className="px-3 py-2 font-medium text-slate-700">Agent</th>
                  <th className="px-3 py-2 font-medium text-slate-700">Métrique</th>
                  <th className="px-3 py-2 font-medium text-slate-700">Valeur</th>
                  <th className="px-3 py-2 font-medium text-slate-700">Seuil</th>
                  <th className="px-3 py-2 font-medium text-slate-700">Statut</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t border-slate-200">
                    <td className="px-3 py-2 text-slate-800">{r.agent}</td>
                    <td className="px-3 py-2 text-slate-700">{r.name}</td>
                    <td className="px-3 py-2 text-slate-700">{r.value}</td>
                    <td className="px-3 py-2 text-slate-600">{r.threshold}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${r.status === 'normal' ? 'bg-green-100 text-green-800' : r.status === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {result.steps.map((s, i) => (
          <span key={i} className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${s.status === 'success' ? 'bg-green-100 text-green-800' : s.status === 'hitl' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
            {s.agent}: {s.status === 'hitl' ? 'HITL' : s.status === 'success' ? 'Succès' : 'Échec'}
          </span>
        ))}
      </div>
      {result.references?.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Sources Harvard</p>
          <ul className="space-y-1 text-xs text-slate-600">
            {result.references.slice(0, compact ? 3 : undefined).map((ref, i) => (
              <li key={i} className="border-l-2 border-slate-200 pl-2">{ref.harvard}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function WorkflowsPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowStep[] | null>(null);
  const [runResult, setRunResult] = useState<WorkflowRunResult | null>(null);
  const [historyView, setHistoryView] = useState<HistoryEntry | null>(null);
  const resultsPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (runResult && resultsPanelRef.current) {
      resultsPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [runResult]);

  function handleRun(steps: WorkflowStep[]) {
    const result = generateWorkflowDemoResult(steps.map((s) => ({ agent: s.agent, type: s.type })));
    setRunResult(result);
  }

  function handleExecuteTemplate(steps: WorkflowStep[]) {
    const result = generateWorkflowDemoResult(steps.map((s) => ({ agent: s.agent, type: s.type })));
    setRunResult(result);
  }

  return (
    <div className="space-y-8">
      <PageBanner src="/images/anesthesia.png" alt="Bloc opératoire" title="Orchestration des workflows" subtitle="Templates prédéfinis et constructeur de workflow personnalisé" />
      <div>
        <h1 className="text-xl font-bold text-slate-900">Orchestration des workflows</h1>
        <p className="text-sm text-slate-500">Templates predefinis et constructeur de workflow personnalise.</p>
      </div>

      <section>
        <h2 className="text-base font-semibold text-slate-900 mb-3">Templates</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {TEMPLATES.map((t) => (
            <WorkflowCard
              key={t.name}
              name={t.name}
              description={t.description}
              steps={t.steps}
              onSelect={() => setSelectedTemplate(t.steps)}
              onExecute={handleExecuteTemplate}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-900 mb-3">Workflow personnalise</h2>
        <p className="text-sm text-slate-500 mb-4">Cliquez sur &quot;Lancer le workflow&quot; ou &quot;Exécuter&quot; sur un template. Les resultats de l&apos;execution s&apos;affichent dans le panneau ci-dessous (scroll automatique).</p>
        <WorkflowBuilder onRun={handleRun} />
        <div id="workflow-results" ref={resultsPanelRef} className="scroll-mt-8">
          {runResult && (
            <div className="mt-6 rounded-xl border-2 border-green-200 bg-green-50/30 p-6 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900 mb-1 flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-green-500" />
                Resultats de l&apos;execution
              </h3>
              <p className="text-xs text-slate-500 mb-4">Synthese multi-agents et metriques par etape.</p>
              <ResultBlock result={runResult} />
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-900 mb-3">Historique des executions</h2>
        <div className="card overflow-hidden !p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left font-medium text-slate-500">Date</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Patient</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Workflow</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Statut</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Duree</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_HISTORY.map((h) => (
                <tr key={h.id}>
                  <td className="px-4 py-3 text-slate-600">{h.date}</td>
                  <td className="px-4 py-3 text-slate-700">{h.patient}</td>
                  <td className="px-4 py-3 text-slate-700">{h.workflow}</td>
                  <td className="px-4 py-3"><span className="badge-ok">{h.status}</span></td>
                  <td className="px-4 py-3 text-slate-600">{h.duration}</td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => setHistoryView(h)} className="text-blue-600 hover:underline text-xs">Voir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ActionModal
        isOpen={!!historyView}
        onClose={() => setHistoryView(null)}
        title={historyView ? `${historyView.workflow} — ${historyView.date}` : ''}
        size="xl"
        actions={<button type="button" onClick={() => setHistoryView(null)} className="btn-primary">Fermer</button>}
      >
        {historyView && <ResultBlock result={historyView.result} compact />}
      </ActionModal>
    </div>
  );
}
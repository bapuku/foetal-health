'use client';

import { useState } from 'react';
import WorkflowTimeline from './WorkflowTimeline';
import type { WorkflowStep } from './WorkflowCard';

const AVAILABLE_AGENTS = [
  { name: 'CTG Monitor', port: 8000 },
  { name: 'Apgar Transition', port: 8001 },
  { name: 'Symbolic Reasoning', port: 8002 },
  { name: 'Polygraph Verifier', port: 8003 },
  { name: 'Bishop Partogram', port: 8004 },
  { name: 'RCIU Risk', port: 8005 },
  { name: 'Quantum Optimizer', port: 8006 },
  { name: 'Mother-Baby Risk', port: 8007 },
  { name: 'Clinical Narrative', port: 8008 },
  { name: 'User Engagement', port: 8009 },
];

interface WorkflowBuilderProps {
  onRun: (steps: WorkflowStep[]) => void;
}

export default function WorkflowBuilder({ onRun }: WorkflowBuilderProps) {
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [nextType, setNextType] = useState<'sequential' | 'parallel' | 'hitl'>('sequential');

  function addAgent(agent: { name: string; port: number }) {
    setSteps((s) => [
      ...s,
      { id: `${agent.port}-${Date.now()}`, agent: agent.name, port: agent.port, type: nextType },
    ]);
  }

  return (
    <div className="card space-y-4">
      <h3 className="text-base font-semibold text-slate-900">Constructeur de workflow</h3>

      <div className="flex flex-wrap gap-2">
        <span className="text-xs font-medium text-slate-500">Type du prochain noeud :</span>
        {(['sequential', 'parallel', 'hitl'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setNextType(t)}
            className={`rounded px-3 py-1.5 text-xs font-medium ${
              nextType === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t === 'hitl' ? 'HITL' : t === 'parallel' ? 'Parallele' : 'Sequential'}
          </button>
        ))}
      </div>

      <div>
        <p className="text-xs font-medium text-slate-500 mb-2">Ajouter un agent</p>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_AGENTS.map((a) => (
            <button
              key={a.port}
              type="button"
              onClick={() => addAgent(a)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50"
            >
              + {a.name}
            </button>
          ))}
        </div>
      </div>

      {steps.length > 0 && (
        <>
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">Apercu du pipeline</p>
            <WorkflowTimeline steps={steps} />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setSteps([])}
                className="text-xs text-slate-500 hover:text-red-600"
              >
                Tout effacer
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onRun(steps)}
            disabled={steps.length === 0}
            className="btn-primary"
          >
            Lancer le workflow
          </button>
        </>
      )}
    </div>
  );
}
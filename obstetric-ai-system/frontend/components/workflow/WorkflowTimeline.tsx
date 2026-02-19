'use client';

import type { WorkflowStep } from './WorkflowCard';

interface WorkflowTimelineProps {
  steps: WorkflowStep[];
}

export default function WorkflowTimeline({ steps }: WorkflowTimelineProps) {
  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                step.type === 'hitl' ? 'bg-amber-100 text-amber-800' : step.type === 'parallel' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {i + 1}
            </div>
            {i < steps.length - 1 && <div className="mt-1 h-6 w-px bg-slate-200" />}
          </div>
          <div className="flex-1 py-2">
            <p className="text-sm font-medium text-slate-800">{step.agent}</p>
            <p className="text-xs text-slate-500">:{step.port} · {step.type === 'hitl' ? 'HITL' : step.type === 'parallel' ? 'Parallele' : 'Sequential'}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

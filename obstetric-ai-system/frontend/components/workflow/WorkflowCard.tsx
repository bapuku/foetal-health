'use client';

export interface WorkflowStep {
  id: string;
  agent: string;
  port: number;
  type: 'sequential' | 'parallel' | 'hitl';
}

interface WorkflowCardProps {
  name: string;
  description: string;
  steps: WorkflowStep[];
  onSelect: () => void;
  onExecute?: (steps: WorkflowStep[]) => void;
}

export default function WorkflowCard({ name, description, steps, onSelect, onExecute }: WorkflowCardProps) {
  return (
    <div className="card transition-colors hover:border-blue-300 hover:shadow-md">
      <div className="cursor-pointer" onClick={onSelect} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onSelect()}>
        <h3 className="text-sm font-semibold text-slate-900">{name}</h3>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {steps.slice(0, 5).map((s) => (
            <span key={s.id} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {s.agent}
            </span>
          ))}
          {steps.length > 5 && <span className="text-xs text-slate-400">+{steps.length - 5}</span>}
        </div>
      </div>
      <div className="mt-3 flex gap-2 pt-3 border-t border-slate-100">
        <button type="button" onClick={(e) => { e.stopPropagation(); onSelect(); }} className="text-xs font-medium text-slate-600 hover:text-slate-900">
          Utiliser
        </button>
        <button type="button" onClick={(e) => { e.stopPropagation(); onExecute?.(steps); }} className="btn-primary text-xs py-1.5 px-3">
          Exécuter
        </button>
      </div>
    </div>
  );
}

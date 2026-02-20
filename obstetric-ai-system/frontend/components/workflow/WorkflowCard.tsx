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
  disabled?: boolean;
}

export default function WorkflowCard({ name, description, steps, onSelect, onExecute, disabled }: WorkflowCardProps) {
  return (
    <div className={`card transition-colors ${disabled ? 'opacity-60' : 'hover:border-blue-300 hover:shadow-md'}`}>
      <div>
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
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          disabled={disabled}
          className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:text-slate-400 disabled:cursor-not-allowed"
        >
          Utiliser
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onExecute?.(steps); }}
          disabled={disabled}
          className="btn-primary text-xs py-1.5 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Exécuter
        </button>
      </div>
    </div>
  );
}

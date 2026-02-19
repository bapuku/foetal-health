'use client';

interface SuggestedQuestionsProps {
  pathname: string;
  onSelect: (question: string) => void;
}

const SUGGESTIONS_BY_PATH: Record<string, string[]> = {
  '/dashboard': [
    'Quels agents sont en ligne ?',
    'Resume l\'activite recente',
    'Lancer une analyse CTG rapide',
  ],
  '/dashboard/patients': [
    'Quel est le risque de la derniere patiente ?',
    'Combien de patientes en suivi actif ?',
    'Liste les patientes a risque eleve',
  ],
  '/dashboard/ctg': [
    'Explique la classification FIGO',
    'Lancer une analyse CTG avec FHR 140',
    'Quand declencher un HITL ?',
  ],
  '/dashboard/risks': [
    'Compare les risques RCIU et cesarienne',
    'Evaluer un score Apgar 8/9',
    'Explique les features SHAP',
  ],
  '/dashboard/reports': [
    'Generer un rapport pour la patiente en cours',
    'Exporter les references EndNote',
  ],
  '/dashboard/tools': [
    'Quels outils sont disponibles ?',
    'Tester le calculateur Bishop',
  ],
  '/dashboard/skills': [
    'Quelles competences a l\'agent CTG ?',
    'Quel agent fait la verification Polygraph ?',
  ],
  '/dashboard/workflows': [
    'Lancer le pipeline standard',
    'Quelle est la difference entre urgence CTG et bilan complet ?',
  ],
};

const DEFAULT_SUGGESTIONS = [
  'Bonjour, comment puis-je vous aider ?',
  'Lancer une analyse CTG',
  'Evaluer un score Apgar',
];

export default function SuggestedQuestions({ pathname, onSelect }: SuggestedQuestionsProps) {
  const suggestions = SUGGESTIONS_BY_PATH[pathname] ?? DEFAULT_SUGGESTIONS;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-500">Suggestions</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onSelect(q)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

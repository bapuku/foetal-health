/**
 * Prompt System obstétrical v2 (export JSON du notebook PROMPTSYSTEM_AMPLIFIE).
 * Copie synchronisée : shared/prompt_system/prompt_system_v2.json → lib/data/ (build Docker frontend).
 */
import promptCfg from './data/prompt_system_v2.json';

type PromptTemplate = {
  system_prompt?: string;
  chain_of_thought?: string;
  few_shot_examples?: Array<{ input?: string; output?: string }>;
};

type PromptSpec = {
  metadata?: {
    version?: string;
    intended_use?: string;
    clinical_standards?: string[];
  };
  globals?: {
    system_language?: string;
    fhir_version?: string;
    confidence_minimum?: number;
    human_validation_required?: boolean;
  };
  spec?: {
    prompt_templates?: Record<string, PromptTemplate>;
    agents?: Array<{ id?: string; name?: string }>;
  };
};

const cfg = promptCfg as PromptSpec;

/** Préambule injecté dans l’assistant médecin (découplé du schéma JSON de sortie). */
export function buildAssistantAmplifiedPreamble(): string {
  const m = cfg.metadata ?? {};
  const g = cfg.globals ?? {};
  const stds = m.clinical_standards ?? [];
  const head = stds.slice(0, 8).map((s) => `- ${s}`).join('\n');
  const more = stds.length > 8 ? `\n... (+${stds.length - 8} autres références)` : '';
  const agents = cfg.spec?.agents ?? [];
  const agentLine =
    agents.length > 0
      ? `Architecture multi-agents (${agents.length}) : ${agents.map((a) => a.id || a.name).filter(Boolean).join(', ')}.`
      : '';

  return [
    `=== PROMPT SYSTEM OBSTÉTRICAL v${m.version ?? '2.0'} (amplifié) ===`,
    (m.intended_use ?? '').trim(),
    '',
    'Standards cliniques (aperçu) :',
    head + more,
    '',
    `Interopérabilité : FHIR ${g.fhir_version ?? 'R4'}. Langue : ${g.system_language ?? 'fr-FR'}.`,
    `Confiance minimale cible pour toute recommandation automatisée : ${g.confidence_minimum ?? 0.85}.`,
    `Validation humaine systématique pour décisions critiques : ${String(g.human_validation_required ?? true)}.`,
    '',
    agentLine,
    '',
    'Rôle assistant : tu coordonnes une synthèse alignée sur ClinicalSummaryPrompt (SOAP, triangulation, citations Harvard).',
    'Ne fournis jamais un diagnostic définitif ni une prescription sans formulation conditionnelle et référence aux guidelines.',
  ]
    .filter(Boolean)
    .join('\n');
}

export function getPromptTemplateKey(key: string): PromptTemplate | undefined {
  return cfg.spec?.prompt_templates?.[key];
}

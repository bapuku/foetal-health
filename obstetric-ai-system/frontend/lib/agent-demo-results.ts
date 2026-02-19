/**
 * Resultats demo structures pour chaque agent : narratif clinique, metriques, references Harvard.
 * Utilise par le modal agent (sidebar), workflows et pages Skills/Tools.
 */

export interface AgentMetric {
  name: string;
  value: string;
  threshold: string;
  status: 'normal' | 'warning' | 'critical';
}

export interface AgentReference {
  text: string;
  harvard: string;
}

export interface AgentPatientData {
  field: string;
  value: string;
}

export interface AgentDemoResult {
  narrative: string;
  summary: string;
  metrics: AgentMetric[];
  references: AgentReference[];
  patientData: AgentPatientData[];
}

const REF_FIGO = { text: 'Classification FIGO 2015', harvard: 'FIGO Intrapartum Fetal Monitoring (2015) FIGO consensus guidelines on intrapartum fetal monitoring. International Journal of Gynecology and Obstetrics, 131(1), 3-24.' };
const REF_HAS = { text: 'Surveillance foetale', harvard: 'HAS (2022) Surveillance foetale pendant le travail. Recommandations HAS.' };
const REF_CNGOF = { text: 'Accouchement', harvard: 'CNGOF (2021) Recommendations pour la pratique clinique : accouchement. Gynecologie Obstetrique Fertilite Senologie.' };
const REF_NICE = { text: 'Intrapartum care', harvard: 'NICE (2014) Intrapartum care for healthy women and babies. NICE Clinical Guideline 190.' };
const REF_ACOG = { text: 'Fetal monitoring', harvard: 'ACOG (2009) ACOG Practice Bulletin No. 106: Intrapartum fetal heart rate monitoring. Obstetrics and Gynecology.' };

const DEMO_RESULTS: Record<string, AgentDemoResult> = {
  'CTG Monitor': {
    narrative: 'Analyse cardiotocographique realisee selon les criteres FIGO 2015. Le trace presente une variabilite adequate et des accelerations presentes. Aucune deceleration prolongee. La ligne de base FHR est dans les normes. Conclusion : classification NORMALE. Aucune alerte HITL declenchee.',
    summary: 'CTG normal — pas d\'escalade.',
    metrics: [
      { name: 'Classification FIGO', value: 'Normal', threshold: 'Normal/Suspect/Pathologique', status: 'normal' },
      { name: 'FHR baseline (bpm)', value: '142', threshold: '110-160', status: 'normal' },
      { name: 'Variabilite STV (bpm)', value: '12', threshold: '5-25', status: 'normal' },
      { name: 'Decelerations', value: '0', threshold: 'Absentes', status: 'normal' },
    ],
    references: [REF_FIGO, REF_HAS],
    patientData: [
      { field: 'Patient', value: 'P-2024-0847 (demo)' },
      { field: 'SA', value: '38 SA' },
      { field: 'Duree trace', value: '60 min' },
    ],
  },
  'Apgar': {
    narrative: 'Evaluation de l\'adaptation neonatale a 1 et 5 minutes. Scores dans la fourchette normale. Aucun signe de detresse respiratoire ou circulatoire. Pas d\'indication a une reanimation avancee. HITL non requis.',
    summary: 'Apgar normal — pas d\'escalade pediatrique.',
    metrics: [
      { name: 'Apgar 1 min', value: '8', threshold: '7-10 normal', status: 'normal' },
      { name: 'Apgar 5 min', value: '9', threshold: '7-10 normal', status: 'normal' },
      { name: 'FC neonatale (bpm)', value: '140', threshold: '100-180', status: 'normal' },
      { name: 'Risque Apgar bas', value: 'Non', threshold: '—', status: 'normal' },
    ],
    references: [REF_CNGOF, REF_NICE],
    patientData: [
      { field: 'Naissance', value: 'N-0312 (demo)' },
      { field: 'Apgar 1 min', value: '8' },
      { field: 'Apgar 5 min', value: '9' },
    ],
  },
  'Symbolic': {
    narrative: 'Verification de conformite aux recommandations HAS 2022, FIGO 2015 et CNGOF. Les sorties des agents (CTG, Apgar, Bishop) ont ete comparees aux referentiels. Aucune deviation majeure detectee. Un ecart mineur note sur la documentation du consentement (recommandation : completer le dossier).',
    summary: 'Conforme avec une remarque mineure.',
    metrics: [
      { name: 'Conformite globale', value: 'Conforme', threshold: 'Conforme', status: 'normal' },
      { name: 'Deviations majeures', value: '0', threshold: '0', status: 'normal' },
      { name: 'Deviations mineures', value: '1', threshold: '< 3', status: 'normal' },
    ],
    references: [REF_HAS, REF_FIGO, REF_CNGOF],
    patientData: [
      { field: 'Bundle analyse', value: 'CTG + Apgar + Bishop' },
      { field: 'Referentiels', value: 'HAS, FIGO, CNGOF' },
    ],
  },
  'Polygraph': {
    narrative: 'Cross-verification des narratifs produits par les agents LLM. Coherence inter-agents elevee. Score de confiance anti-hallucination au-dessus du seuil. Aucune incoherence detectee entre les sorties CTG, Apgar et Narrative.',
    summary: 'Confiance elevee — pas d\'hallucination detectee.',
    metrics: [
      { name: 'Score confiance', value: '0.94', threshold: '> 0.85', status: 'normal' },
      { name: 'Risque hallucination', value: 'Faible', threshold: 'Faible/Moyen/Eleve', status: 'normal' },
      { name: 'Narratifs verifies', value: '3', threshold: '—', status: 'normal' },
    ],
    references: [REF_FIGO],
    patientData: [
      { field: 'Agents verifies', value: 'CTG, Apgar, Narrative' },
      { field: 'Modele', value: 'Claude Research' },
    ],
  },
  'Bishop': {
    narrative: 'Score de Bishop calcule a partir des donnees d\'examen clinique. Col favorable avec une dilatation et un effacement en phase de travail latent. Score compatible avec une maturation cervicale en cours. Phase : latent.',
    summary: 'Bishop 7/13 — phase latent.',
    metrics: [
      { name: 'Score Bishop', value: '7', threshold: '0-13', status: 'normal' },
      { name: 'Phase', value: 'Latent', threshold: 'Latent/Active', status: 'normal' },
      { name: 'Dilatation (cm)', value: '2', threshold: '—', status: 'normal' },
      { name: 'Effacement (%)', value: '50', threshold: '—', status: 'normal' },
    ],
    references: [REF_CNGOF, REF_NICE],
    patientData: [
      { field: 'Patient', value: 'P-2024-0839 (demo)' },
      { field: 'Examen', value: 'Tocolyse si besoin' },
    ],
  },
  'RCIU': {
    narrative: 'Evaluation du risque de restriction de croissance intra-uterine. Biometrie foetale et Doppler integres. Percentile de poids estime dans la fourchette basse-normale. IC 95 % pour l\'age gestationnel respecte. Surveillance renforcee recommandee.',
    summary: 'Risque RCIU faible — surveillance adaptee.',
    metrics: [
      { name: 'Risque RCIU (%)', value: '12', threshold: '< 15 faible', status: 'normal' },
      { name: 'IC 95 %', value: '8-16', threshold: '—', status: 'normal' },
      { name: 'Percentile poids', value: '18e', threshold: '> 10e', status: 'normal' },
    ],
    references: [REF_HAS, REF_CNGOF],
    patientData: [
      { field: 'Patient', value: 'P-2024-0847 (demo)' },
      { field: 'SA', value: '38 SA' },
      { field: 'Doppler', value: 'Normal' },
    ],
  },
  'Quantum': {
    narrative: 'Optimisation du timing de la naissance a partir des sorties multi-agents. Fenetre optimale estimee : prochaines 12-24 h pour maximiser la probabilite de succes (accouchement vaginal, Apgar satisfaisant). Contraintes HITL et conformite integrees.',
    summary: 'Fenetre optimale 12-24 h.',
    metrics: [
      { name: 'Probabilite succes', value: '0.82', threshold: '> 0.75', status: 'normal' },
      { name: 'Fenetre (h)', value: '12-24', threshold: '—', status: 'normal' },
      { name: 'Scenarios evalues', value: '8', threshold: '—', status: 'normal' },
    ],
    references: [REF_NICE, REF_ACOG],
    patientData: [
      { field: 'Entrees', value: 'Bundle multi-agents' },
      { field: 'Contraintes', value: 'HITL, FIGO' },
    ],
  },
  'Mom-Baby': {
    narrative: 'Correlation des risques mere-bebe effectuee. Risque maternel (cesarienne urgence) et risque neonatal (Apgar bas) croises. Correlation positive moderee. Plan de naissance et vigilance per-partum recommandes.',
    summary: 'Correlation moderee — plan de naissance adapte.',
    metrics: [
      { name: 'Risque cesarienne (%)', value: '18', threshold: '< 25', status: 'normal' },
      { name: 'Risque Apgar < 7 (%)', value: '5', threshold: '< 10', status: 'normal' },
      { name: 'Correlation', value: '0.42', threshold: '—', status: 'normal' },
    ],
    references: [REF_CNGOF, REF_HAS],
    patientData: [
      { field: 'Agents sources', value: 'CTG, Apgar, Bishop, RCIU' },
      { field: 'Patient', value: 'P-2024-0847 (demo)' },
    ],
  },
  'Narrative': {
    narrative: 'Rapport clinique structure genere selon le referentiel Harvard Cite It Right. Triangulation des donnees multi-agents (CTG, Apgar, Bishop, RCIU, Symbolic). Synthese diagnostique, recommandations et references integrees. Document pret pour export EndNote (.ris).',
    summary: 'Rapport structure avec triangulation et references.',
    metrics: [
      { name: 'Sections', value: '8', threshold: 'Complet', status: 'normal' },
      { name: 'References', value: '5', threshold: '≥ 3', status: 'normal' },
      { name: 'Triangulation', value: 'Oui', threshold: 'Oui', status: 'normal' },
    ],
    references: [REF_FIGO, REF_HAS, REF_CNGOF, REF_NICE, REF_ACOG],
    patientData: [
      { field: 'Patient', value: 'P-2024-0847 (anonymise)' },
      { field: 'Format', value: 'Harvard Cite It Right' },
    ],
  },
  'Engagement': {
    narrative: 'Messages et supports d\'education patiente generes selon le contexte (suivi prenatal, preparation accouchement). Score de satisfaction attendu base sur les retours types. Aucune alerte communication.',
    summary: 'Communication patiente adaptee au contexte.',
    metrics: [
      { name: 'Messages generes', value: '3', threshold: '—', status: 'normal' },
      { name: 'Satisfaction (attendu)', value: '0.88', threshold: '> 0.8', status: 'normal' },
      { name: 'Themes', value: 'Suivi, prepa, HITL', threshold: '—', status: 'normal' },
    ],
    references: [REF_HAS],
    patientData: [
      { field: 'Contexte', value: 'Suivi prenatal' },
      { field: 'Langue', value: 'FR' },
    ],
  },
  'Prenatal': {
    narrative: 'Suivi prenatal francais evalue selon le calendrier CSP (7 consultations obligatoires, EPP, 3 echographies). Conformite au referentiel R2122-1/R2122-2. Dépistages T21 (3 paliers HAS), DG (IADPSG) et SGB integres. Normes biologiques adaptees au trimestre.',
    summary: 'Calendrier conforme. Dépistages à jour.',
    metrics: [
      { name: 'Conformite calendrier', value: 'Conforme', threshold: 'CSP R2122-1', status: 'normal' },
      { name: 'Consultations realisees', value: '5/7', threshold: '7 obligatoires', status: 'normal' },
      { name: 'Echos', value: 'T1+T2 realisees', threshold: '3 recommandees', status: 'normal' },
      { name: 'T21', value: 'Risque < 1/1000', threshold: '3 paliers HAS', status: 'normal' },
    ],
    references: [REF_HAS, REF_CNGOF],
    patientData: [
      { field: 'Patient', value: 'P-2024-0847 (demo)' },
      { field: 'SA', value: '28 SA' },
      { field: 'Referentiel', value: 'CSP, HAS, CNGOF' },
    ],
  },
};

export function generateAgentDemoResult(agentName: string): AgentDemoResult {
  return DEMO_RESULTS[agentName] ?? {
    narrative: 'Execution de l\'agent en mode demonstration. Resultat structure pour integration clinique.',
    summary: 'Demo — voir narratif.',
    metrics: [
      { name: 'Statut', value: 'OK', threshold: '—', status: 'normal' },
    ],
    references: [REF_FIGO],
    patientData: [{ field: 'Agent', value: agentName }],
  };
}

export function getAgentNames(): string[] {
  return Object.keys(DEMO_RESULTS);
}

/** Map workflow step agent label to DEMO_RESULTS key */
export function agentNameForDemo(stepAgent: string): string {
  const map: Record<string, string> = {
    'Bishop Partogram': 'Bishop',
    'Clinical Narrative': 'Narrative',
    'Apgar Transition': 'Apgar',
    'Mother-Baby Risk': 'Mom-Baby',
    'Symbolic Reasoning': 'Symbolic',
    'Polygraph Verifier': 'Polygraph',
    'RCIU Risk': 'RCIU',
    'Quantum Optimizer': 'Quantum',
    'User Engagement': 'Engagement',
    'Prenatal Follow-up': 'Prenatal',
  };
  return map[stepAgent] ?? stepAgent;
}

export interface WorkflowStepResult {
  agent: string;
  status: 'success' | 'failure' | 'hitl';
  result?: AgentDemoResult;
}

export interface WorkflowRunResult {
  narrative: string;
  summary: string;
  steps: WorkflowStepResult[];
  references: AgentReference[];
}

export function generateWorkflowDemoResult(stepAgents: { agent: string; type: string }[]): WorkflowRunResult {
  const steps: WorkflowStepResult[] = [];
  const refsMap = new Map<string, AgentReference>();

  for (const s of stepAgents) {
    if (s.type === 'hitl') {
      steps.push({ agent: 'HITL Checkpoint', status: 'hitl' });
      continue;
    }
    const key = agentNameForDemo(s.agent);
    const result = generateAgentDemoResult(key);
    (result.references ?? []).forEach((r) => refsMap.set(r.harvard, r));
    steps.push({ agent: s.agent, status: 'success', result });
  }

  const narrative = `Synthèse multi-agents : ${steps.filter((s) => s.result).length} agent(s) exécuté(s), ${steps.filter((s) => s.status === 'hitl').length} point(s) HITL. Les sorties ont été agrégées pour produire un résumé clinique cohérent avec les références FIGO, HAS et CNGOF.`;
  const summary = steps
    .filter((s) => s.result?.summary)
    .map((s) => s.result!.summary)
    .join(' — ') || 'Workflow exécuté en mode démo.';

  return {
    narrative,
    summary,
    steps,
    references: Array.from(refsMap.values()),
  };
}

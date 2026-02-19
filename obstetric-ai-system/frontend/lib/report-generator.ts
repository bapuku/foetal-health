/**
 * Logique de generation de rapport structure (Harvard, triangulation).
 * Rapport medical diagnostique d'au moins 800 mots, structure robuste.
 */

import { CLINICAL_REFERENCES, MODEL_REFERENCES, type HarvardCitation } from './citations';

export interface TriangulationRow {
  parameter: string;
  agentCtg: string;
  agentApgar: string;
  fhir: string;
  guidelines: string;
  convergence: 'convergent' | 'divergent' | 'contradictory';
}

export interface ReportData {
  patientId: string;
  patientIdAnonymized: string;
  date: string;
  authorIa: string;
  authorValidator: string;
  executiveSummary: string;
  /** Sections narratives longues (texte structuré, 800+ mots au total) */
  narrativeSections?: {
    situationClinique: string;
    analyseMultiAgent: string;
    classificationRisques: string;
    explicabilite: string;
    recommandations: string;
    planNeonatal: string;
  };
  clinicalData: { label: string; value: string; unit?: string }[];
  multiAgentAnalysis: { agent: string; result: string; reference?: string }[];
  triangulation: TriangulationRow[];
  classificationRisks: { name: string; value: string; ic95?: string; level?: string }[];
  explicability: { method: string; summary: string }[];
  recommendations: { action: string; level: string }[];
  references: HarvardCitation[];
}

const DEMO_CLINICAL = [
  { label: 'Frequence cardiaque fœtale (FHR) baseline', value: '138', unit: 'bpm' },
  { label: 'Variabilite a court terme (STV)', value: '12', unit: 'ms' },
  { label: 'Age gestationnel (SA)', value: '38', unit: 'SA' },
  { label: 'Score de Bishop', value: '7', unit: '/13' },
  { label: 'Dilatation cervicale', value: '2', unit: 'cm' },
  { label: 'Effacement', value: '50', unit: '%' },
  { label: 'Apgar 1 min', value: '8', unit: '' },
  { label: 'Apgar 5 min', value: '9', unit: '' },
  { label: 'Poids estime', value: '3 150', unit: 'g' },
  { label: 'Percentile poids', value: '42e', unit: '' },
  { label: 'Doppler artere ombilicale', value: 'Normal', unit: '' },
  { label: 'Liquide amniotique', value: 'Normal', unit: '' },
  { label: 'Tension arterielle maternelle', value: '118/72', unit: 'mmHg' },
  { label: 'Glycemie capillaire', value: '4,8', unit: 'mmol/L' },
  { label: 'Groupe sanguin', value: 'O+', unit: '' },
];

const DEMO_TRIANGULATION: TriangulationRow[] = [
  { parameter: 'FHR baseline', agentCtg: '138 bpm', agentApgar: '-', fhir: '138', guidelines: '110-160 (FIGO 2015)', convergence: 'convergent' },
  { parameter: 'Classification FIGO', agentCtg: 'Normal', agentApgar: '-', fhir: 'Normal', guidelines: 'FIGO 2015', convergence: 'convergent' },
  { parameter: 'Variabilite STV', agentCtg: '12 ms', agentApgar: '-', fhir: '12', guidelines: '5-25 ms', convergence: 'convergent' },
  { parameter: 'Apgar 5 min', agentCtg: '-', agentApgar: '9', fhir: '9', guidelines: '≥7', convergence: 'convergent' },
  { parameter: 'Score Bishop', agentCtg: '7/13', agentApgar: '-', fhir: '7', guidelines: '0-13', convergence: 'convergent' },
  { parameter: 'Risque RCIU', agentCtg: '12%', agentApgar: '-', fhir: '12%', guidelines: '<15% faible', convergence: 'convergent' },
  { parameter: 'Conformite protocoles', agentCtg: '-', agentApgar: '-', fhir: 'Conforme', guidelines: 'HAS/CNGOF', convergence: 'convergent' },
  { parameter: 'Risque cesarienne', agentCtg: '18%', agentApgar: '-', fhir: '18%', guidelines: '<25%', convergence: 'convergent' },
];

const EXECUTIVE_SUMMARY = `Ce rapport diagnostique structure presente la synthese multi-agents du suivi obstetrical de la patiente identifiee de maniere anonymisee. La situation clinique est celle d'une grossesse a terme (38 SA), suivie en routine selon les recommandations en vigueur (HAS 2022, FIGO 2015, CNGOF 2021). Le trace cardiotocographique (CTG) a ete analyse en temps reel par l'agent CTG Monitor et classe comme normal selon les criteres FIGO 2015 : frequence cardiaque fœtale (FHR) baseline a 138 bpm, variabilite a court terme (STV) a 12 ms, presence d'accelerations et absence de decelerations prolongees. Les scores d'Apgar a une et cinq minutes (8 et 9 respectivement) temoignent d'une adaptation neonatale satisfaisante et ne declenchent pas d'alerte HITL (Human-in-the-Loop). La triangulation systematique entre les sorties des agents specialises, les donnees FHIR et les referentiels cliniques est convergente. Aucune deviation majeure n'a ete relevee par l'agent Symbolic Reasoning. Les recommandations sont une poursuite de la surveillance standard et une relecture du CTG en cas de modification clinique.`;

const NARRATIVE_SITUATION = `La patiente est une femme enceinte a terme (38 SA), dont les antecedents obstetricaux et medicaux ont ete integres dans le dossier. Le suivi prenatal a ete conduit selon les protocoles en vigueur. L'examen clinique recent met en evidence un col favorable avec un score de Bishop a 7/13, une dilatation a 2 cm et un effacement estime a 50 %, correspondant a une phase de travail latent. La tension arterielle et la glycemie sont dans les normes. La biometrie fœtale et le Doppler ombilical sont conformes aux attentes pour le terme, sans signe de restriction de croissance intra-uterine (RCIU). Le contexte est donc celui d'une grossesse a bas risque sur les donnees actuelles, permettant une surveillance standard selon les recommandations HAS et CNGOF citees en reference.`;

const NARRATIVE_ANALYSE = `L'analyse multi-agents mobilise plusieurs modules specialises. L'agent CTG Monitor a traite le trace cardiotocographique et a produit une classification FIGO 2015 normale, avec un niveau de confiance de 94 %. Les parametres cles (FHR baseline, STV, accelerations, decelerations) sont dans les fourchettes attendues. L'agent Apgar Transition a evalue les scores a 1 et 5 minutes et a conclu a une adaptation neonatale satisfaisante, sans indication a une escalation HITL. L'agent Symbolic Reasoning a verifie la conformite des sorties aux referentiels HAS 2022, FIGO 2015 et CNGOF 2021 et n'a detecte aucune deviation majeure. L'agent Polygraph Verifier a realise une cross-verification des narratifs et a attribue un score de confiance anti-hallucination superieur au seuil. L'agent Bishop Partogram a confirme le score et la phase (latent). L'agent RCIU Risk a estime un risque de restriction de croissance faible (12 %, IC 95 % 8-16 %). L'ensemble des sorties est coherent et permet une synthese diagnostique et des recommandations structurees.`;

const NARRATIVE_CLASSIFICATION = `La classification des risques repose sur les niveaux de preuve des referentiels. La classification FIGO du trace CTG est normale (niveau I-A). Le risque de RCIU est estime a 12 % (IC 95 % 8-16 %), niveau de preuve II-B, ce qui place la patiente dans une fourchette basse-normale. Le risque de cesarienne en urgence est estime a 18 % (IC 95 % 14-22 %), egalement niveau II-B, inferieur au seuil de vigilance. Les intervalles de confiance ont ete calcules a partir des modeles predictifs (XGBoost/LightGBM) entraines sur des cohortes conformes aux bonnes pratiques. Ces chiffres sont a interpreter dans le contexte clinique global et en cas de modification de la situation (par exemple trace CTG suspect ou pathologique), une reevaluation est recommandee.`;

const NARRATIVE_EXPLICABILITE = `L'explicabilite des sorties est assuree par plusieurs mecanismes. L'analyse SHAP (SHapley Additive exPlanations) identifie les facteurs les plus contributifs a la classification : la FHR baseline (environ 35 %), la variabilite STV (28 %) et l'age gestationnel (18 %) sont en tête. Ces valeurs permettent au clinicien de comprendre quels parametres ont le plus influence la decision du modele. Par ailleurs, une chaine d'audit SHA-256 est maintenue pour chaque evenement (acquisition, analyse, alerte), permettant une tracabilite complete et une detection d'alteration. Le hash du dernier evenement est disponible sur demande pour conformite et revue.`;

const NARRATIVE_RECOMMANDATIONS = `Les recommandations sont etagees selon le niveau de preuve. En premier lieu, une poursuite de la surveillance standard est recommandee (niveau I-A), conformement aux referentiels FIGO et HAS. En cas de modification clinique (douleurs, saignement, modification du trace), une relecture du CTG et une reevaluation par l'equipe sont indiquees (niveau II-B). Le maintien d'une surveillance tensionnelle et d'un suivi biometrique selon le calendrier en vigueur est recommande. Aucune mesure therapeutique particuliere n'est indiquee sur les donnees actuelles. La patiente et l'equipe peuvent s'appuyer sur ce rapport pour la suite du parcours, sous reserve de l'validation par le medecin responsable.`;

const NARRATIVE_NEONATAL = `Le plan de soins neonataux est adapte a une naissance a terme sans facteur de risque majeur identifie. Une presence pediatrique en salle de naissance est recommandee selon les usages du site. Les criteres d'Apgar attendus sont compatibles avec une adaptation neonatale normale. Un contact peau a peau (methode Kangourou) et un clampage tardif du cordon sont recommandes conformement aux recommandations OMS et HAS. Aucune preparation particuliere en reanimation neonatale n'est prevue sur les donnees actuelles. En cas de survenue d'un evenement per-partum modifiant le risque (souffrance fœtale, hemorragie), le plan sera adapte en temps reel.`;

export function generateDemoReport(patientId: string): ReportData {
  return {
    patientId,
    patientIdAnonymized: `P-${patientId.slice(-4)}-XXXX`,
    date: new Date().toISOString().slice(0, 10),
    authorIa: 'Obstetric AI System (CTG Monitor, Apgar Transition, Symbolic Reasoning, Bishop Partogram, RCIU Risk, Clinical Narrative)',
    authorValidator: 'Dr [Validateur]',
    executiveSummary: EXECUTIVE_SUMMARY,
    narrativeSections: {
      situationClinique: NARRATIVE_SITUATION,
      analyseMultiAgent: NARRATIVE_ANALYSE,
      classificationRisques: NARRATIVE_CLASSIFICATION,
      explicabilite: NARRATIVE_EXPLICABILITE,
      recommandations: NARRATIVE_RECOMMANDATIONS,
      planNeonatal: NARRATIVE_NEONATAL,
    },
    clinicalData: DEMO_CLINICAL,
    multiAgentAnalysis: [
      { agent: 'CTG Monitor', result: 'Classification FIGO 2015 : Normal. Confiance 94 %. FHR 138 bpm, STV 12 ms.', reference: 'FIGO 2015' },
      { agent: 'Apgar Transition', result: 'Adaptation neonatale satisfaisante. Apgar 8/9. Pas d\'escalade HITL.', reference: 'HAS 2022' },
      { agent: 'Symbolic Reasoning', result: 'Conforme HAS/FIGO/CNGOF. Aucune deviation majeure.', reference: 'CNGOF 2021' },
      { agent: 'Polygraph Verifier', result: 'Score confiance anti-hallucination > seuil. Narratifs coherents.', reference: 'FIGO 2015' },
      { agent: 'Bishop Partogram', result: 'Score Bishop 7/13. Phase latent. Col favorable.', reference: 'CNGOF 2021' },
      { agent: 'RCIU Risk', result: 'Risque RCIU 12 % (IC 95 % 8-16 %). Faible.', reference: 'HAS 2022' },
    ],
    triangulation: DEMO_TRIANGULATION,
    classificationRisks: [
      { name: 'Classification FIGO', value: 'Normal', level: 'I-A' },
      { name: 'Risque RCIU', value: '12%', ic95: '8-16%', level: 'II-B' },
      { name: 'Cesarienne urgence', value: '18%', ic95: '14-22%', level: 'II-B' },
    ],
    explicability: [
      { method: 'SHAP', summary: 'Top features : FHR baseline (35 %), STV (28 %), age gestationnel (18 %).' },
      { method: 'Audit trail', summary: 'Chaine SHA-256 disponible. Hash dernier evenement : [hash].' },
    ],
    recommendations: [
      { action: 'Poursuite surveillance standard', level: 'I-A' },
      { action: 'Relecture CTG en cas de modification clinique', level: 'II-B' },
      { action: 'Surveillance tensionnelle et biometrie selon calendrier', level: 'II-B' },
    ],
    references: [...CLINICAL_REFERENCES, ...MODEL_REFERENCES],
  };
}

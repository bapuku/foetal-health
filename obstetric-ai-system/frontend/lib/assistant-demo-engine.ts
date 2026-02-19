/**
 * Moteur de reponses demo structurees pour l'Assistant IA.
 * Utilise quand l'API Claude n'est pas disponible.
 */

import { CLINICAL_REFERENCES, type HarvardCitation } from './citations';
import type { TriangulationRow } from './report-generator';
import { generateAgentDemoResult } from './agent-demo-results';
import type { StructuredAIResponse } from './assistant-types';

const DEMO_TRIANGULATION: TriangulationRow[] = [
  { parameter: 'FHR', agentCtg: '138 bpm', agentApgar: '-', fhir: '138', guidelines: '110-160', convergence: 'convergent' },
  { parameter: 'Classification', agentCtg: 'Normal', agentApgar: '-', fhir: 'Normal', guidelines: 'FIGO 2015', convergence: 'convergent' },
  { parameter: 'Apgar 5 min', agentCtg: '-', agentApgar: '9', fhir: '9', guidelines: '≥7', convergence: 'convergent' },
];

function detectIntent(text: string): string {
  const t = text.toLowerCase().trim();
  if (/\b(patiente?|patient|dossier|suivi|risque\s+patiente)\b/.test(t)) return 'patient';
  if (/\b(ctg|analyse ctg|classification figo|fhr|cardio|trace)\b/.test(t)) return 'ctg';
  if (/\b(apgar|score apgar|evaluer apgar|neonatal|adaptation)\b/.test(t)) return 'apgar';
  if (/\b(risque|rciu|cesarienne|preterme|shap|matrice)\b/.test(t)) return 'risk';
  if (/\b(recherche|literature|etude|pubmed|recommandation|figo|has|cngof|nice|acog)\b/.test(t)) return 'research';
  if (/\b(bonjour|hello|salut|aide|quoi faire)\b/.test(t)) return 'greeting';
  if (/\b(bishop|surveillance\s+foetale|intrapartum|travail|cesarienne|kangourou|oms|who)\b/.test(t)) return 'general';
  return 'default';
}

function refsFromIds(ids: string[]): HarvardCitation[] {
  return ids.map((id) => CLINICAL_REFERENCES.find((c) => c.id === id)).filter(Boolean) as HarvardCitation[];
}

export function generateStructuredDemoResponse(
  message: string,
  patientContext?: { id: string; nom: string; prenom: string; sa: number; risque: string }
): StructuredAIResponse {
  const intent = detectIntent(message);
  const refs = refsFromIds(['figo2015', 'has2022', 'cngof2021', 'nice2014', 'acog2009', 'who2018', 'acog2020apgar', 'figo2018bishop', 'oms2014kangourou']);

  switch (intent) {
    case 'patient': {
      const patient = patientContext || { id: 'P-2024-0847', nom: 'Martin', prenom: 'Sophie', sa: 38, risque: 'bas' };
      return {
        summary: `Patiente ${patient.prenom} ${patient.nom} (${patient.id}) : suivi à ${patient.sa} SA, risque ${patient.risque}. Données cohérentes avec le dossier.`,
        narrative: `Contexte patient (données strictement issues du dossier) : identifiant ${patient.id}, ${patient.prenom} ${patient.nom}. Semaines d'aménorrhée ${patient.sa} SA. Niveau de risque obstétrical : ${patient.risque}. Selon les recommandations HAS (2022) et FIGO (2015), la surveillance foetale en travail et l'interprétation du CTG suivent ces référentiels. Aucune alerte HITL en attente pour cette patiente. Pour un bilan détaillé, consulter l'onglet Rapports ou lancer une analyse CTG ciblée. Références : HAS 2022, FIGO 2015, CNGOF 2021.`,
        patientContext: [
          { field: 'Identifiant', value: patient.id },
          { field: 'Patiente', value: `${patient.prenom} ${patient.nom}` },
          { field: 'SA', value: `${patient.sa} SA` },
          { field: 'Risque', value: patient.risque },
        ],
        recommendations: [
          { action: 'Poursuite surveillance selon protocole', level: 'I-A' },
          { action: 'Documentation du consentement à jour', level: 'II-B' },
        ],
        references: refsFromIds(['figo2015', 'has2022', 'cngof2021']),
      };
    }

    case 'ctg': {
      const ctg = generateAgentDemoResult('CTG Monitor');
      return {
        summary: ctg.summary,
        narrative: ctg.narrative,
        metrics: ctg.metrics.map((m) => ({ name: m.name, value: m.value, threshold: m.threshold, status: m.status })),
        patientContext: ctg.patientData,
        recommendations: [
          { action: 'Poursuite surveillance CTG selon FIGO 2015', level: 'I-A' },
          { action: 'Escalade HITL si classification pathologique', level: 'I-A' },
        ],
        references: refsFromIds(['figo2015', 'has2022']),
      };
    }

    case 'apgar': {
      const apgar = generateAgentDemoResult('Apgar');
      return {
        summary: apgar.summary,
        narrative: apgar.narrative,
        metrics: apgar.metrics,
        patientContext: apgar.patientData,
        recommendations: [
          { action: 'Score Apgar documenté à 1 et 5 min', level: 'I-A' },
          { action: 'Escalade pédiatre si Apgar ≤ 6', level: 'I-A' },
        ],
        references: refsFromIds(['cngof2021', 'nice2014', 'acog2009']),
      };
    }

    case 'risk': {
      return {
        summary: 'Risques obstétricaux (RCIU, césarienne urgence, Apgar bas, prématurité) évalués. Matrice 5×5 et rapport de risk assessment disponibles dans l\'onglet Risques.',
        narrative: 'Synthèse des risques : RCIU estimé à 12 % (IC 95 % 8-16), césarienne en urgence 18 % (14-22), Apgar <7 à 5 min 5 % (2-8), prématurité 8 % (5-11). Les données sont issues des agents RCIU, Mom-Baby et du cross-check Symbolic. La triangulation avec les recommandations FIGO, HAS et CNGOF est convergente. Pour le détail par risque et les preuves, consulter le tableau de risk assessment et la matrice 5×5 sur la page Risques.',
        metrics: [
          { name: 'RCIU', value: '12 %', threshold: '< 15 % faible', status: 'normal' },
          { name: 'Césarienne urgence', value: '18 %', threshold: '< 25 %', status: 'normal' },
          { name: 'Apgar <7 (5 min)', value: '5 %', threshold: '< 10 %', status: 'normal' },
          { name: 'Préterme', value: '8 %', threshold: '—', status: 'normal' },
        ],
        triangulation: DEMO_TRIANGULATION,
        recommendations: [
          { action: 'Surveillance foetale selon HAS 2022', level: 'I-A' },
          { action: 'Point HITL si CTG pathologique ou Apgar ≤ 6', level: 'I-A' },
        ],
        references: refs,
      };
    }

    case 'research': {
      return {
        summary: 'Références obstétricales : FIGO 2015 (monitoring intrapartum), HAS 2022, CNGOF 2021, NICE 2014, ACOG 2009. Style Harvard Cite It Right ; export EndNote (.ris) disponible.',
        narrative: 'Les recommandations utilisées par le système sont : FIGO (2015) pour la classification CTG et le monitoring fœtal en travail ; HAS (2022) pour la surveillance fœtale pendant le travail ; CNGOF (2021) pour les recommandations de pratique clinique en accouchement ; NICE (2014) pour la prise en charge intrapartum ; ACOG (2009) pour le monitoring de la fréquence cardiaque fœtale. Toutes les réponses de l\'assistant s\'appuient sur ces sources et sont formatées en Harvard Cite It Right. L\'export .ris permet l\'intégration dans EndNote ou Zotero.',
        recommendations: [
          { action: 'Exporter les références (.ris) depuis le panneau de droite', level: '—' },
          { action: 'Consulter les rapports patients pour la triangulation multi-sources', level: 'I-A' },
        ],
        references: refs,
      };
    }

    case 'general': {
      return {
        summary: 'Réponse fondée sur les recommandations obstétricales et néonatales (FIGO, HAS, CNGOF, NICE, ACOG, OMS). Narration technique, références Harvard exportables EndNote (.ris).',
        narrative: 'En obstétrique et santé maternelle-néonatale, les référentiels suivants s\'appliquent. FIGO (2015) : classification du trace CTG (Normal, Suspect, Pathologique) et surveillance foetale en travail. HAS (2022) : surveillance foetale pendant le travail, interprétation selon FIGO. CNGOF (2021) : accouchement, score de Bishop, indication de césarienne. NICE (2014) : prise en charge intrapartum. ACOG (2009, 2020) : monitoring FHR et score d\'Apgar. OMS (2014, 2018) : soins intrapartum, méthode Kangourou. Chaque affirmation est sourcée ; les références sont au format Harvard Cite It Right et exportables en .ris pour EndNote/Zotero.',
        recommendations: [
          { action: 'Consulter les guidelines citées pour le détail des recommandations', level: 'I-A' },
          { action: 'Exporter les références (.ris) pour la bibliographie', level: '—' },
        ],
        references: refs,
      };
    }

    case 'greeting': {
      return {
        summary: 'Assistant Obstetric AI : espace de travail médecin/équipe – IA générative, RAG, interrogations patients et recherche médicale obstétricale.',
        narrative: 'Bonjour. Je suis l\'assistant Obstetric AI. Vous pouvez m\'interroger sur les patientes, les situations cliniques (CTG, Apgar, risques), et la recherche médicale obstétricale. Les réponses sont structurées (résumé, narratif technique, métriques, recommandations) et sourcées en Harvard Cite It Right. Vous pouvez joindre des fichiers (PDF, images, CSV, etc.) pour enrichir le contexte (RAG). Sélectionnez une patiente dans le panneau de droite pour contextualiser les réponses.',
        recommendations: [
          { action: 'Choisir une patiente pour contextualiser', level: '—' },
          { action: 'Joindre des documents si besoin (RAG)', level: '—' },
        ],
        references: refs.slice(0, 2),
      };
    }

    default: {
      return {
        summary: 'Réponse générique : je peux vous aider sur les patientes, le CTG, l\'Apgar, les risques et la littérature obstétricale. Références Harvard ; export EndNote (.ris) disponible.',
        narrative: 'Je peux vous fournir des réponses structurées et sourcées sur : (1) le contexte d\'une patiente et son suivi (strictement fondé sur les données dossier), (2) l\'analyse CTG et la classification FIGO (2015), (3) l\'évaluation Apgar et l\'adaptation néonatale (ACOG 804, CNGOF, NICE), (4) les risques obstétricaux (RCIU, césarienne, prématurité), (5) les recommandations et la recherche (FIGO, HAS, CNGOF, NICE, ACOG, OMS). Chaque réponse inclut un résumé, un narratif technique, des métriques si pertinent, et des références au format Harvard Cite It Right, exportables en .ris.',
        recommendations: [
          { action: 'Reformuler avec un mot-clé (patient, CTG, Apgar, risque, recherche, Bishop, surveillance)', level: '—' },
        ],
        references: refs.slice(0, 5),
      };
    }
  }
}

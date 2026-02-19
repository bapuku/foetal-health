/**
 * Enrichissement du contexte patient pour l'assistant (FHIR ou mock).
 * Utilise par la route chat pour injecter un bloc "Donnees patient" dans le prompt.
 */

export interface PatientContextInput {
  id: string;
  nom: string;
  prenom: string;
  sa: number;
  risque: string;
}

/** Donnees dossier enrichies (mock) pour demo quand FHIR n'est pas disponible. Inclut suivi prenatal (DDR, DPA, groupe, serologies, T21, DG). */
const MOCK_DOSSIER: Record<string, string> = {
  'P-2024-0847': `Identite: Sophie Martin (P-2024-0847). SA 38, risque bas. Derniere visite 18/02/2026. Statut: actif.
Suivi prenatal: DDR 01/06/2025, DPA 08/03/2026. Groupe A+, Rh+. Toxoplasmose immunisee, rubeole immunisee. EPP realise. 7 consultations realisees, 3 echos (T1 T2 T3). T21 risque combine 1/2500 (palier faible). HGPO 75g normale. SGB non porteuse.
Consultations: 18/02 consultation prenatal SA 38; 11/02 suivi SA 37; 04/02 echo morphologique normale.
Analyses: CTG 18/02 Normal (FHR 138 bpm, STV 12 ms, FIGO 2015). Bishop 7/13, phase latent.
Recommandations: Suivi habituel. Prochaine consultation programmee.`,
  'P-2024-0845': `Identite: Marie Dubois (P-2024-0845). SA 36, risque moyen. Derniere visite 17/02/2026. Statut: actif.
Suivi prenatal: DDR 15/06/2025, DPA 22/03/2026. Groupe B+, Rh+. Toxo non immunisee, serologie mensuelle a jour. Rubeole immunisee. EPP realise. Consultations 1 a 6 realisees, echos T1 T2 realisees, T3 a programmer. T21 DPNI realise (negatif). HGPO a 26 SA: DG non retenu.
Consultations: 17/02 consultation; 10/02 suivi; 03/02 echo.
Analyses: CTG 17/02 Normal. Bishop 5/13. Risque RCIU estime 12%.
Recommandations: Surveillance standard. Reevaluation au prochain RDV.`,
  'P-2024-0841': `Identite: Isabelle Petit (P-2024-0841). SA 34, risque eleve. Derniere visite 16/02/2026. Statut: actif.
Suivi prenatal: DDR 01/07/2025, DPA 08/04/2026. Groupe O-, Rh-. RAI controlee, gammaglobuline anti-D a 28 SA prevue. Toxo immunisee. EPP realise. Consultations a jour. Echo T3 realisee a 32 SA (poids estime 10e percentile). T21 palier faible. HGPO: diabete gestationnel (H1 1,92 g/L), regime + autosurveillance.
Consultations: 16/02 consultation; 09/02 suivi; Doppler ombilical demande.
Analyses: CTG 16/02 Suspect. Bishop 4/13. RCIU a surveiller.
Recommandations: Surveillance renforcee. Bilan RCIU et Doppler. Controle CTG rapproche.`,
  'P-2024-0312': `Identite: Laura Simon (P-2024-0312). SA 40, risque bas. Statut: accouchee. Derniere visite 18/02/2026.
Suivi prenatal (termine): 7 consultations, EPP, 3 echos. T21 risque faible. HGPO normale. SGB negatif.
Naissance: Apgar 8 a 1 min, 9 a 5 min. Adaptation neonatale satisfaisante.
Recommandations: Suivi postnatal standard. Methode Kangourou.`,
};

/**
 * Retourne un bloc texte "Donnees patient" pour le prompt.
 * Si patientId correspond a un mock, utilise le dossier enrichi ; sinon construit a partir de patientContext.
 */
export function getEnrichedPatientContext(
  patientContext?: PatientContextInput | null,
  patientId?: string | null
): string {
  const id = patientContext?.id || patientId;
  if (!id) return '';

  const mock = MOCK_DOSSIER[id];
  if (mock) return mock;

  const p = patientContext || { id, nom: '', prenom: '', sa: 38, risque: 'bas' };
  return `Identite: ${p.prenom} ${p.nom} (${p.id}). SA ${p.sa}, risque ${p.risque}. Donnees limitees : utiliser uniquement ces elements pour les affirmations sur cette patiente.`;
}

/**
 * Types du suivi prénatal français (7 consultations obligatoires, EPP, 3 échos,
 * calendrier biologique, dépistages T21/DG/SGB, normes cliniques).
 * Référentiel : Code de la Santé Publique L2122-1, R2122-1, R2122-2, HAS, CNGOF.
 */

/** Statut d'un élément du calendrier (consultation, écho, EPP). */
export type CalendarItemStatus = 'planifiee' | 'realisee' | 'en_retard' | 'na';

/** Trimestre de grossesse (1 = avant 15 SA, 2 = 16-28 SA, 3 = 28-42 SA). */
export type Trimestre = 1 | 2 | 3;

/** Statut d'un résultat biologique. */
export type BiologicalStatus = 'normal' | 'anormal' | 'en_attente';

/** Un élément du calendrier prénatal (consultation, EPP ou échographie). */
export interface PrenatalCalendarItem {
  id: string;
  type: 'consultation' | 'epp' | 'echographie_t1' | 'echographie_t2' | 'echographie_t3';
  label: string;
  saCibleMin: number;
  saCibleMax: number;
  status: CalendarItemStatus;
  datePrevue?: string; // ISO date
  dateRealisee?: string;
  saRealisee?: number;
}

/** Calendrier complet : 7 consultations + EPP + 3 échographies. */
export interface PrenatalCalendar {
  ddr?: string; // Date des dernières règles (ISO)
  dpa?: string; // Date prévue d'accouchement (ISO)
  items: PrenatalCalendarItem[];
}

/** Examen clinique réalisé à chaque consultation. */
export interface PrenatalConsultation {
  id: string;
  date: string; // ISO
  sa: number;
  consultationNumber?: number; // 1 à 7
  /** Pression artérielle systolique (mmHg). */
  paSystolique?: number;
  /** Pression artérielle diastolique (mmHg). */
  paDiastolique?: number;
  /** Poids (kg). */
  poids?: number;
  /** Hauteur utérine (cm), à partir de 16 SA. */
  hauteurUterine?: number;
  /** Protéinurie bandelette (négatif, +, ++, etc.). */
  proteinurieBandelette?: string;
  /** Glycosurie bandelette. */
  glycosurieBandelette?: string;
  /** Bruits du cœur fœtaux (bpm). */
  bcfBpm?: number;
  /** Présentation fœtale (céphalique, siège, etc.). */
  presentationFœtale?: string;
  /** Mouvements fœtaux perçus (oui/non). */
  mouvementsFœtaux?: boolean;
  prescriptions?: string[];
  resumeClinique?: string;
}

/** Un examen biologique avec résultat et norme de référence. */
export interface BiologicalExam {
  id: string;
  type: string; // NFS, groupage, RAI, syphilis, rubéole, toxoplasmose, VIH, VHC, CMV, AgHBs, HGPO, etc.
  date: string;
  trimestre: Trimestre;
  resultatNumerique?: number;
  resultatQualitatif?: string; // positif, négatif, immunisée, etc.
  unite?: string;
  valeurMinNormale?: number;
  valeurMaxNormale?: number;
  statut: BiologicalStatus;
  commentaire?: string;
}

/** Suivi des sérologies (toxo mensuelle si non immunisée, rubéole jusqu'à 20 SA, etc.). */
export interface SerologyTracking {
  toxoplasmose: {
    immunisee: boolean;
    dernierResultat?: string;
    dernierDate?: string;
    mensuelleSiNonImmunisee: boolean;
  };
  rubeole: {
    immunisee: boolean;
    dernierResultat?: string;
    dernierDate?: string;
    controleJusqua20SA: boolean;
  };
  syphilis?: { realise: boolean; date?: string; resultat?: string };
  vih?: { propose: boolean; realise?: boolean; date?: string; resultat?: string };
  vhc?: { realise: boolean; date?: string; resultat?: string };
  cmv?: { realise: boolean; date?: string; resultat?: string }; // depuis juin 2025
  agHBs?: { realise: boolean; date?: string; resultat?: string }; // 6e mois
  rai?: { rhNegatif: boolean; dernierControle?: string; resultat?: string };
}

/** Échographie T1 (11-13+6 SA) : datation, CN, vitalité. */
export interface UltrasoundT1 {
  date: string;
  sa: number;
  lccMm?: number; // Longueur cranio-caudale (45-84 mm)
  clarteNucaleMm?: number; // ≤ 3 mm rassurant
  vitalite: boolean;
  nombreEmbryons: number;
  chorionicite?: string; // si grossesse multiple
  morphoPrecoce?: string; // membres, rachis, crâne, estomac, vessie
}

/** Échographie T2 (20-25 SA, idéalement 22 SA) : morphologique. */
export interface UltrasoundT2 {
  date: string;
  sa: number;
  bipMm?: number;
  perimetreCranienMm?: number;
  perimetreAbdominalMm?: number;
  longueurFemoraleMm?: number;
  morphologieComplete?: string; // crâne, encéphale, face, cœur, thorax, abdomen, rachis, membres
  positionPlacenta?: string;
  liquideAmniotique?: string;
}

/** Échographie T3 (30-35 SA, idéalement 32 SA) : croissance, présentation. */
export interface UltrasoundT3 {
  date: string;
  sa: number;
  poidsEstimeG?: number;
  presentation?: string; // céphalique, siège, etc.
  positionPlacenta?: string;
  liquideAmniotique?: string;
  dopplerArteresUterines?: string;
  dopplerOmbilical?: string;
}

/** Résultat d'une échographie (union des 3 types). */
export type UltrasoundResult = (
  | { type: 't1'; data: UltrasoundT1 }
  | { type: 't2'; data: UltrasoundT2 }
  | { type: 't3'; data: UltrasoundT3 }
) & { id: string };

/** Dépistage trisomie 21 : 3 paliers HAS 2017 / arrêté déc 2018. */
export interface T21Screening {
  /** Risque combiné T1 (CN + marqueurs sériques + âge). */
  risqueCombine?: number; // ex. 1/2500
  /** Palier : < 1/1000, 1/1000-1/51, >= 1/50. */
  palier?: 'faible' | 'intermediaire' | 'eleve';
  /** Si palier intermédiaire : DPNI réalisé. */
  dpniRealise?: boolean;
  dpniDate?: string;
  dpniResultat?: string; // trisomie 21 non détectée / détectée
  /** Si palier élevé : proposition caryotype. */
  caryotypePropose?: boolean;
  caryotypeRealise?: boolean;
  caryotypeResultat?: string;
  consentementEcrit?: boolean;
}

/** Diabète gestationnel : critères IADPSG (CNGOF/SFD 2010). */
export interface GestationalDiabetes {
  /** Glycémie à jeun T1 si facteurs de risque (g/L). */
  glycemieJeunT1?: number;
  /** HGPO 75 g entre 24-28 SA (g/L). */
  hgpoH0?: number;
  hgpoH1?: number;
  hgpoH2?: number;
  hgpoDate?: string;
  /** Une seule valeur ≥ seuil = DG. Seuils IADPSG : à jeun ≥ 0,92 ; H1 ≥ 1,80 ; H2 ≥ 1,53 g/L. */
  diagnosticDG?: boolean;
  commentaire?: string;
}

/** Dépistage streptocoque B (34-38 SA, idéalement 35-37). */
export interface GBSScreening {
  datePrelevement?: string;
  saPrelevement?: number;
  resultat?: 'positif' | 'negatif';
  antibioprophylaxiePrevue?: boolean;
}

/** Normes biologiques de référence adaptées à la grossesse. */
export interface ClinicalNorms {
  trimestre: Trimestre;
  hemoglobineGdL: { min: number; max: number }; // T1: 11-14, T2: 10.5-14, T3: 11-14
  plaquettesGigaL: { min: number }; // < 150 = thrombopénie
  ferritineUgL: { min: number }; // > 30 réserves suffisantes
  glycemieJeunGdL: { max: number }; // < 0,92
  hgpoSeuilsGdL: { h0: number; h1: number; h2: number }; // IADPSG
  proteinurie24hMg: { max: number }; // < 300
  tshMuiL: { min: number; max: number }; // 0,1-4,0
  /** PA normale grossesse : < 140/90. */
  paNormale: { systoliqueMax: number; diastoliqueMax: number };
}

/** Dossier prénatal complet (lié au patient). */
export interface PrenatalDossier {
  patientId: string;
  calendar: PrenatalCalendar;
  consultations: PrenatalConsultation[];
  biologicalExams: BiologicalExam[];
  serology: SerologyTracking;
  ultrasounds: UltrasoundResult[];
  t21Screening?: T21Screening;
  gestationalDiabetes?: GestationalDiabetes;
  gbsScreening?: GBSScreening;
  /** Données administratives : groupe sanguin ABO, Rh, Kell, etc. */
  groupage?: { abo: string; rhesus: string; kell?: string };
  /** Entretien prénatal précoce (EPP) réalisé. */
  eppRealise?: boolean;
  eppDate?: string;
}

/** Payload pour l'évaluation globale du dossier (agent). */
export interface PrenatalEvaluateInput {
  dossier: PrenatalDossier;
  saCourante: number;
}

/** Réponse structurée de l'agent d'évaluation. */
export interface PrenatalEvaluateOutput {
  conformeCalendrier: boolean;
  alertes: { type: string; message: string; severite: 'info' | 'warning' | 'critical' }[];
  examensEnRetard: string[];
  resultatsAnormaux: { examen: string; valeur: string; norme: string }[];
  recommandations: { action: string; level: string }[];
  narrative: string;
  fhirCarePlan?: Record<string, unknown>;
}

/** Payload pour enregistrer une consultation. */
export interface PrenatalConsultationInput {
  patientId: string;
  consultation: PrenatalConsultation;
  biologicalExams?: BiologicalExam[];
}

/** Payload pour le dépistage T21. */
export interface T21ScreeningInput {
  risqueCombine: number; // ex. 1/2500 sous forme 0.0004
  ageMaternel?: number;
  dpniResultat?: string;
}

/** Payload pour le dépistage DG (HGPO). */
export interface DiabetesScreeningInput {
  glycemieJeun?: number;
  h0: number;
  h1: number;
  h2: number;
  unite?: 'g/L' | 'mmol/L';
}

/** Payload pour le dépistage SGB. */
export interface GBSScreeningInput {
  datePrelevement: string;
  saPrelevement: number;
  resultat: 'positif' | 'negatif';
}

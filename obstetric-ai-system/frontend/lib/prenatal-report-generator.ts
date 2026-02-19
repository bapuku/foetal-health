/**
 * Générateur de rapport médico-diagnostique prénatal (structure frontend).
 * Sections : anamnèse, examen clinique, biologie, dépistages T21/DG/SGB, sérologies,
 * synthèse, conduite à tenir, traçabilité audit, références HAS/CNGOF/CSP/IADPSG.
 */

import type { HarvardCitation } from './citations';

export interface PrenatalReportData {
  patientId: string;
  patientIdAnonymized: string;
  date: string;
  sa: number;
  /** Anamnèse obstétricale (DDR, DPA, parité, antécédents) */
  anamneseObstetricale: string;
  /** Examen clinique du jour (PA, poids, HU, BCF, présentation) */
  examenClinique: string;
  /** Bilan biologique avec normes trimestre */
  bilanBiologique: string;
  /** Dépistages T21, DG, SGB */
  depistages: string;
  /** Sérologies (toxo, rubéole, VIH, VHC, AgHBs) */
  serologies: string;
  /** Synthèse en 2-3 phrases */
  synthese: string;
  /** Conduite à tenir */
  conduiteATenir: string;
  /** Tracabilité : hashes audit SHA-256, modèle IA, confiance */
  tracabilite: { method: string; summary: string }[];
  /** Références HAS 2016/2017, CSP R2122, CNGOF/SFD 2010, IADPSG */
  references: HarvardCitation[];
}

const PRENATAL_REFERENCES: HarvardCitation[] = [
  { id: 'has2016', authors: 'HAS', year: 2016, title: 'Suivi des femmes enceintes', url: 'https://www.has-sante.fr' },
  { id: 'has2017', authors: 'HAS', year: 2017, title: 'Dépistage de la trisomie 21', url: 'https://www.has-sante.fr' },
  { id: 'csp', authors: 'CSP', year: 2022, title: 'Articles R2122-1 et R2122-2', url: '' },
  { id: 'cngof2010', authors: 'CNGOF/SFD', year: 2010, title: 'Diabète gestationnel (IADPSG)', url: '' },
];

export function generatePrenatalReport(
  dossier: Record<string, unknown>,
  consultation: Record<string, unknown> | null,
  screenings: {
    t21?: { palier?: string; message?: string };
    diabetes?: { diagnostic_dg?: boolean; message?: string };
    gbs?: { message?: string; resultat?: string };
  } | null,
  norms: Record<string, unknown> | null,
  auditHashes: { inputHash?: string; outputHash?: string; auditHash?: string; modelUsed?: string }
): PrenatalReportData {
  const patientId = (dossier.patientId as string) || 'N/A';
  const sa = (consultation?.sa as number) ?? (dossier.sa_courante as number) ?? 0;
  const trimestre = sa <= 14 ? 1 : sa <= 28 ? 2 : 3;

  const anamneseObstetricale =
    `Suivi prénatal à ${sa} SA (trimestre ${trimestre}). ` +
    `DDR et DPA selon dossier. Parité et antécédents obstétricaux à compléter en consultation.`;

  const pa = consultation?.paSystolique != null && consultation?.paDiastolique != null
    ? `${consultation.paSystolique}/${consultation.paDiastolique} mmHg`
    : '—';
  const poids = consultation?.poids != null ? `${consultation.poids} kg` : '—';
  const hu = consultation?.hauteurUterine != null ? `${consultation.hauteurUterine} cm` : '—';
  const bcf = consultation?.bcfBpm != null ? `${consultation.bcfBpm} bpm` : '—';
  const examenClinique =
    `Examen clinique : PA ${pa}, poids ${poids}, hauteur utérine ${hu}, BCF ${bcf}. ` +
    `Présentation et mouvements actifs foetaux à documenter.`;

  const normesLine = norms
    ? `Normes T${trimestre} : Hb, plaquettes, ferritine, TSH, glycémie selon référentiel grossesse.`
    : 'Normes biologiques selon trimestre (HAS, CNGOF).';
  const bilanBiologique =
    `Bilan biologique du trimestre ${trimestre} : ${normesLine} ` +
    `Protéinurie, glycosurie bandelette selon protocole.`;

  const t21Line = screenings?.t21
    ? `T21 : palier ${screenings.t21.palier ?? '—'} — ${screenings.t21.message ?? ''}`
    : 'T21 : non évalué';
  const dgLine = screenings?.diabetes
    ? `DG : ${screenings.diabetes.diagnostic_dg ? 'positif' : 'négatif'} — ${screenings.diabetes.message ?? ''}`
    : 'DG : non évalué';
  const gbsLine = screenings?.gbs
    ? `SGB : ${screenings.gbs.message ?? screenings.gbs.resultat ?? '—'}`
    : 'SGB : non évalué';
  const depistages = `${t21Line}. ${dgLine}. ${gbsLine}.`;

  const serologies =
    'Sérologies : toxoplasmose (mensuelle si non immunisée), rubéole (jusqu\'à 20 SA si séronégative), ' +
    'syphilis, VIH, VHC, CMV si indiqué, AgHBs au 6e mois. Statut à vérifier dans le dossier.';

  const synthese =
    `Consultation à ${sa} SA enregistrée. Examen clinique et dépistages selon données saisies. ` +
    `Conformité au calendrier CSP et prochaines étapes à valider en consultation.`;

  const conduiteATenir =
    'Poursuite du suivi selon calendrier des 7 consultations obligatoires (CSP R2122-1/R2122-2). ' +
    'Prochaine consultation et examens selon plan de suivi. Référentiels : HAS 2016/2017, CNGOF, IADPSG.';

  const tracabilite: { method: string; summary: string }[] = [];
  if (auditHashes.auditHash) {
    tracabilite.push({
      method: 'Audit SHA-256',
      summary: `Chaîne d'audit immuable. Hash : ${auditHashes.auditHash.slice(0, 32)}…`,
    });
  }
  if (auditHashes.modelUsed) {
    tracabilite.push({
      method: 'Modèle IA',
      summary: `Rapport généré avec ${auditHashes.modelUsed}.`,
    });
  }
  if (tracabilite.length === 0) {
    tracabilite.push({ method: 'Tracabilité', summary: 'Preuve d’évaluation disponible sur demande (audit trail).' });
  }

  return {
    patientId,
    patientIdAnonymized: `P-${String(patientId).slice(-4)}-XXXX`,
    date: new Date().toISOString().slice(0, 10),
    sa,
    anamneseObstetricale,
    examenClinique,
    bilanBiologique,
    depistages,
    serologies,
    synthese,
    conduiteATenir,
    tracabilite,
    references: PRENATAL_REFERENCES,
  };
}

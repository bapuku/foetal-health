/**
 * References au format Harvard Cite It Right.
 * Compatibles export EndNote (.ris / .enw).
 */

export interface HarvardCitation {
  id: string;
  authors: string;
  year: number;
  title: string;
  journal?: string;
  volume?: string;
  number?: string;
  pages?: string;
  publisher?: string;
  url?: string;
  type: 'journal' | 'guideline' | 'book' | 'online' | 'model';
}

export const CLINICAL_REFERENCES: HarvardCitation[] = [
  {
    id: 'figo2015',
    authors: 'FIGO Intrapartum Fetal Monitoring',
    year: 2015,
    title: 'FIGO consensus guidelines on intrapartum fetal monitoring.',
    journal: 'International Journal of Gynecology and Obstetrics',
    volume: '131',
    number: '1',
    pages: '3-24',
    type: 'guideline',
  },
  {
    id: 'has2022',
    authors: 'HAS',
    year: 2022,
    title: 'Surveillance foetale pendant le travail.',
    journal: 'Recommandations HAS',
    type: 'guideline',
    url: 'https://www.has-sante.fr',
  },
  {
    id: 'cngof2021',
    authors: 'CNGOF',
    year: 2021,
    title: 'Recommendations pour la pratique clinique : accouchement.',
    journal: 'Gynecologie Obstetrique Fertilite Senologie',
    type: 'guideline',
  },
  {
    id: 'nice2014',
    authors: 'NICE',
    year: 2014,
    title: 'Intrapartum care for healthy women and babies.',
    journal: 'NICE Clinical Guideline',
    number: '190',
    type: 'guideline',
  },
  {
    id: 'acog2009',
    authors: 'ACOG',
    year: 2009,
    title: 'ACOG Practice Bulletin No. 106: Intrapartum fetal heart rate monitoring.',
    journal: 'Obstetrics and Gynecology',
    volume: '114',
    number: '1',
    pages: '192-202',
    type: 'guideline',
  },
  {
    id: 'who2018',
    authors: 'WHO',
    year: 2018,
    title: 'WHO recommendations: intrapartum care for a positive childbirth experience.',
    publisher: 'World Health Organization',
    type: 'guideline',
    url: 'https://www.who.int',
  },
  {
    id: 'rcog2017',
    authors: 'RCOG',
    year: 2017,
    title: 'Green-top Guideline No. 31: The investigation and management of the small-for-gestational-age fetus.',
    journal: 'Royal College of Obstetricians and Gynaecologists',
    type: 'guideline',
  },
  {
    id: 'cngof2019rciu',
    authors: 'CNGOF',
    year: 2019,
    title: 'Recommendations pour la pratique clinique : retard de croissance intra-uterin.',
    journal: 'Gynecologie Obstetrique Fertilite Senologie',
    volume: '47',
    pages: '96-114',
    type: 'guideline',
  },
  {
    id: 'cochrane2017ctg',
    authors: 'Alfirevic Z, Devane D and Gyte GML',
    year: 2017,
    title: 'Continuous cardiotocography (CTG) as a form of electronic fetal monitoring (EFM) for fetal assessment during labour.',
    journal: 'Cochrane Database of Systematic Reviews',
    number: '5',
    type: 'journal',
  },
  {
    id: 'nice2023postnatal',
    authors: 'NICE',
    year: 2023,
    title: 'Postnatal care up to 8 weeks after birth.',
    journal: 'NICE Guideline',
    number: 'NG194',
    type: 'guideline',
  },
  {
    id: 'acog2020apgar',
    authors: 'ACOG',
    year: 2020,
    title: 'Committee Opinion No. 804: Apgar score.',
    journal: 'Obstetrics and Gynecology',
    volume: '135',
    number: '3',
    pages: 'e141-e144',
    type: 'guideline',
  },
  {
    id: 'has2020cesarienne',
    authors: 'HAS',
    year: 2020,
    title: 'Indications et conditions de realisation de la cesarienne.',
    journal: 'Recommandations HAS',
    type: 'guideline',
  },
  {
    id: 'figo2018bishop',
    authors: 'FIGO',
    year: 2018,
    title: 'Labour and delivery: Bishop score and induction of labour.',
    journal: 'International Journal of Gynecology and Obstetrics',
    type: 'guideline',
  },
  {
    id: 'oms2014kangourou',
    authors: 'OMS',
    year: 2014,
    title: 'Methode Kangourou : guide pratique.',
    publisher: 'Organisation mondiale de la Sante',
    type: 'guideline',
  },
  {
    id: 'sfn2016neonatal',
    authors: 'Societe Francaise de Neonatologie',
    year: 2016,
    title: 'Recommandations pour la pratique : soins en salle de naissance.',
    journal: 'Archives de Pediatrie',
    type: 'guideline',
  },
  {
    id: 'has2016suivi',
    authors: 'HAS',
    year: 2016,
    title: 'Suivi et orientation des femmes enceintes en fonction des situations a risque identifiees.',
    journal: 'Recommandations HAS',
    type: 'guideline',
    url: 'https://www.has-sante.fr',
  },
  {
    id: 'has2017t21',
    authors: 'HAS',
    year: 2017,
    title: 'Depistage de la trisomie 21 par marqueurs seriques et DPNI. Strategie a 3 paliers.',
    journal: 'Recommandations HAS',
    type: 'guideline',
    url: 'https://www.has-sante.fr',
  },
  {
    id: 'csp2122',
    authors: 'Code de la Sante Publique',
    year: 2021,
    title: 'Articles L2122-1, R2122-1, R2122-2 : examens prenataux obligatoires (7 consultations).',
    publisher: 'Legifrance',
    type: 'guideline',
    url: 'https://www.legifrance.gouv.fr',
  },
  {
    id: 'cngofsfd2010dg',
    authors: 'CNGOF, SFD',
    year: 2010,
    title: 'Diabete gestationnel. Critères IADPSG (HGPO 75 g).',
    journal: 'Gynecologie Obstetrique Fertilite Senologie',
    type: 'guideline',
  },
];

export const MODEL_REFERENCES: HarvardCitation[] = [
  {
    id: 'claude2024',
    authors: 'Anthropic',
    year: 2024,
    title: 'Claude Opus 4 / Sonnet 4 - Modeles de langage.',
    type: 'model',
  },
  {
    id: 'mistral2024',
    authors: 'Mistral AI',
    year: 2024,
    title: 'Mistral Large - Modele via Hugging Face.',
    type: 'model',
  },
  {
    id: 'granite2024',
    authors: 'IBM',
    year: 2024,
    title: 'Granite Medical - Classification medicale via Hugging Face.',
    type: 'model',
  },
  {
    id: 'ctg-cnn',
    authors: 'Obstetric AI System',
    year: 2024,
    title: 'CTG-CNN - Classification FIGO cardiotocographie.',
    type: 'model',
  },
];

export function formatHarvard(c: HarvardCitation): string {
  const authYear = `${c.authors} (${c.year})`;
  if (c.journal && c.volume) {
    return `${authYear} ${c.title}. ${c.journal}, ${c.volume}${c.number ? `(${c.number})` : ''}, pp. ${c.pages ?? 'N/A'}.`;
  }
  if (c.journal) return `${authYear} ${c.title}. ${c.journal}.`;
  return `${authYear} ${c.title}.`;
}

/** Export EndNote .ris format */
export function toRis(citations: HarvardCitation[]): string {
  const lines: string[] = [];
  for (const c of citations) {
    lines.push('TY  - GEN');
    lines.push(`TI  - ${c.title}`);
    lines.push(`AU  - ${c.authors}`);
    lines.push(`PY  - ${c.year}`);
    if (c.journal) lines.push(`JO  - ${c.journal}`);
    if (c.volume) lines.push(`VL  - ${c.volume}`);
    if (c.number) lines.push(`IS  - ${c.number}`);
    if (c.pages) lines.push(`SP  - ${c.pages}`);
    if (c.url) lines.push(`UR  - ${c.url}`);
    lines.push('ER  - ');
  }
  return lines.join('\n');
}

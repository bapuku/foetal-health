/**
 * Questions de suivi proposées en fin de réponse (même thème que la requête).
 * Ordre des tests aligné sur detectIntent (assistant-demo-engine).
 */

const THG_ECLAMPSIE = [
  'Quels sont les critères de gravité de la pré-éclampsie selon ACOG 222 ?',
  'Indications et surveillance du sulfate de magnésium en prévention de l’éclampsie',
  'Syndrome HELLP : critères biologiques et conduite à tenir',
  'Hypertension gestationnelle vs pré-éclampsie : différences diagnostiques (ISSHP)',
  'Prise en charge de l’éclampsie : stabilisation maternelle et timing obstétrical (NICE NG133)',
];

const PMI = [
  'Quels examens et dépistages sont proposés en PMI pour l’enfant 0–6 ans ?',
  'Rôle de la PMI dans le soutien à l’allaitement après la maternité',
  'Coordination entre PMI, médecin traitant et pédiatre pour les vaccins',
  'Signes d’alerte chez le nouveau-né à rappeler aux parents (postnatal)',
  'Carnet de santé : quels suivis de croissance et de développement ?',
];

const ACCOUCHEMENT = [
  'Score de Bishop : interprétation avant une induction du travail',
  'Indications obstétricales d’une césarienne selon HAS 2020',
  'Gestion de la douleur et péridurale pendant le travail (CNGOF 2021)',
  'Surveillance foetale intrapartum : lien entre CTG et décision d’accouchement',
  'Recommandations OMS et NICE sur l’accompagnement pendant le travail',
];

const PRENATAL = [
  'Calendrier des 7 consultations obligatoires et contenu de l’EPP',
  'Dépistage de la trisomie 21 : les trois paliers HAS 2017',
  'HGPO et critères IADPSG du diabète gestationnel',
  'Dépistage du streptocoque B : quand et comment ?',
  'Situations à risque en grossesse et orientation HAS 2016',
];

const CTG_MONITORING = [
  'Quand classer un CTG en pathologique selon FIGO 2015 ?',
  'Différence entre décélération précoce et tardive sur le trace',
  'Rôle du HITL lors d’un CTG suspect',
  'CTG continu vs auscultation intermittente : que dit Cochrane 2017 ?',
  'Indications HAS 2022 de surveillance cardiotocographique en travail',
];

const RISKS = [
  'Comment intégrer un RCIU dans une stratification globale des risques ?',
  'Surveillance antenatale recommandée devant un petit pour l’âge gestationnel (RCOG / CNGOF)',
  'Facteurs maternels et obstétricaux à rechercher dans une évaluation des risques',
  'Lien entre risques anténatals et surveillance foetale intrapartum',
  'Prématurité : identification des facteurs de risque et prévention',
];

const APGAR = [
  'Interprétation d’un Apgar 6 à 5 minutes',
  'Limites du score Apgar pour le pronostic neurologique (ACOG 804)',
  'Conduite en salle de naissance devant un Apgar bas (SFN 2016)',
  'Soins postnatals immédiats et examen du nouveau-né (NICE NG194)',
  'Peau à peau et stabilisation thermique après la naissance (OMS)',
];

const DEFAULT = [
  'Quelles sont les causes de l’éclampsie et le lien avec la pré-éclampsie ?',
  'Rappel du suivi prénatal : 7 consultations et EPP',
  'Monitoring CTG intrapartum selon FIGO 2015 et HAS 2022',
];

export function inferFollowUpQuestions(message: string): string[] {
  const t = message
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (
    /\b(e|é)clampsie|pre[- ]?eclampsie|preeclampsia|hellp|toxemie|hypertension\s+(gestationnelle|gravidique)|hta\s+g|hgf|htg|convulsions?\b/.test(
      t
    )
  )
    return [...THG_ECLAMPSIE];
  if (
    /\bpmi\b|protection\s+maternelle|puericulture|consultation\s+pmi|carnet\s+de\s+sante|bilan\s+de\s+sante\s+enfant\b/.test(t)
  )
    return [...PMI];
  if (
    /\b(suivi\s+pre[- ]?natal|suivi\s+de\s+la\s+grossesse|suivi\s+grossesse|prenatal|7\s+consultations|sept\s+consultations|epp\b|echographie\s+|t21|dpni|diabete\s+gestationnel|hgpo|streptocoque|sgb|depistage\s+prenatal|bilan\s+prenatal)\b/.test(
      t
    )
  )
    return [...PRENATAL];
  if (
    /\b(accouchement|delivrance|peridurale|phase\s+expulsive|salle\s+de\s+naissance|voie\s+basse|induction|maturation\s+cervicale|bishop|travail\s+obstetrical)\b/.test(
      t
    )
  )
    return [...ACCOUCHEMENT];
  if (
    /\b(monitoring\s+ctg|analyse\s+ctg|cardiotocograp|cardiotocographie|ctg\b|trace\s+ctg|figo|fhr\b|efm\b|monitoring\s+foetal|surveillance\s+foetale\s+en\s+travail)\b/.test(
      t
    )
  )
    return [...CTG_MONITORING];
  if (
    /\b(risques?\s+obstetric|risk\s+assessment|rciu|preterme|shap|matrice|prediction\s+risque)\b/.test(t) ||
    /^\s*risques?\s*$/i.test(message.trim()) ||
    /\b(risque|risques)\b/.test(t)
  )
    return [...RISKS];
  if (/\b(apgar|neonatale|nouveau[- ]?ne)\b/.test(t)) return [...APGAR];
  return [...DEFAULT];
}

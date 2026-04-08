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
  const t = text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (
    /\b(é|e)clampsie|pre[- ]?eclampsie|preeclampsia|hellp|toxemie|hypertension\s+(gestationnelle|gravidique|de\s+la\s+grossesse|g(estatic|rossesse))|hta\s+(gestationnelle|gravidique|g(estatic|rossesse))|hgf|htg|convulsions?\s+(?:en|de|pendant)?\s*(?:la\s+)?grossesse|crise\s+toxemique\b/.test(
      t
    )
  )
    return 'pe_eclampsia';
  if (
    /\bpmi\b|protection\s+maternelle(\s+et\s+infantile)?|puericulture|consultation\s+pmi|centre\s+de\s+pmi|carnet\s+de\s+sante|sante\s+infantile\s+0|bilan\s+de\s+sante\s+enfant\b/.test(
      t
    )
  )
    return 'pmi';
  if (
    /\b(suivi\s+pre[- ]?natal|suivi\s+de\s+la\s+grossesse|suivi\s+grossesse|prenatal|perinatalite|7\s+consultations|sept\s+consultations|consultations?\s+obligatoires|epp\b|entretien\s+prenatal|echographie\s+(obstetricale|t1|t2|t3)|t21|dpni|diabete\s+gestationnel|hgpo|streptocoque\s+b|sgb|calendrier\s+grossesse|depistage\s+prenatal|bilan\s+prenatal)\b/.test(
      t
    )
  )
    return 'prenatal';
  if (
    /\b(accouchement|delivrance|peridurale|analgesie\s+peridurale|phase\s+expulsive|salle\s+de\s+naissance|voie\s+basse|deuxieme\s+phase|2e\s+phase|induction\s+du\s+travail|maturation\s+cervicale|bishop|travail\s+obstetrical|periode\s+d\w*expulsion)\b/.test(
      t
    )
  )
    return 'accouchement';
  if (
    /\b(monitoring\s+ctg|analyse\s+ctg|cardiotocograp|cardiotocographie|ctg\b|trace\s+ctg|classification\s+figo|fhr\b|efm\b|monitoring\s+foetal|surveillance\s+foetale\s+en\s+travail|cardio\s+foetal)\b/.test(
      t
    )
  )
    return 'ctg';
  if (/\b(apgar|score\s+d?\s*apgar|evaluer\s+apgar|adaptation\s+neonatale)\b/.test(t)) return 'apgar';
  if (/\b(patiente?|patient\b|dossier|risque\s+patiente)\b/.test(t)) return 'patient';
  if (/\b(suivi|suivre)\b.*\b(patiente|dossier|elle)\b/.test(t)) return 'patient';
  if (/\b(risques?\s+obstetric|risk\s+assessment|evaluation\s+des\s+risques|rciu|preterme|shap|matrice\s*5|prediction\s+risque)\b/.test(t) || /^\s*risques?\s*$/i.test(text.trim()))
    return 'risk';
  if (/\b(risque|risques)\b/.test(t)) return 'risk';
  if (/\b(recherche|literature|etude|pubmed|recommandation)\b/.test(t)) return 'research';
  if (/\b(bonjour|hello|salut|aide|quoi\s+faire)\b/.test(t)) return 'greeting';
  if (/\b(figo|has|cngof|nice|acog)\b/.test(t)) return 'research';
  if (/\b(surveillance\s+foetale|intrapartum|travail|cesarienne|kangourou|oms|who)\b/.test(t)) return 'general';
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
      const ragNote =
        "\n\nRéférentiels (FIGO 2015, HAS 2022, Cochrane 2017) : catégories Normal / Suspect / Pathologique ; en cas de trace pathologique ou persistant suspect, réévaluation clinique, avis senior et HITL. Le monitoring continu modifie le bilan bénéfice-risque (hausse des césariennes et instrumentations vs réduction de certains événements néonataux selon méta-analyses) — individualiser selon le niveau de risque obstétrical. Les extraits RAG « monitoring CTG » détaillent patterns, indications HAS et limites de l'EFM.";
      return {
        summary: ctg.summary,
        narrative: `${ctg.narrative}${ragNote}`,
        metrics: ctg.metrics.map((m) => ({ name: m.name, value: m.value, threshold: m.threshold, status: m.status })),
        patientContext: ctg.patientData,
        recommendations: [
          { action: 'Poursuite surveillance CTG selon FIGO 2015', level: 'I-A' },
          { action: 'Escalade HITL si classification pathologique', level: 'I-A' },
        ],
        references: refsFromIds(['figo2015', 'has2022', 'cochrane2017ctg']),
      };
    }

    case 'apgar': {
      const apgar = generateAgentDemoResult('Apgar');
      const ragNote =
        "\n\nACOG Committee Opinion 804 (2020) : l'Apgar décrit l'adaptation à la naissance à 1 et 5 minutes (et au-delà si réanimation) ; il ne constitue pas un diagnostic d'asphyxie ni un outil de pronostic neurologique isolé. SFN 2016 : intégration dans la stabilisation en salle de naissance (thermique, respiration, tonus). NICE NG194 : continuité du postnatal immédiat et information des parents. Voir extraits RAG « Apgar » pour limites et conduites associées.";
      return {
        summary: apgar.summary,
        narrative: `${apgar.narrative}${ragNote}`,
        metrics: apgar.metrics,
        patientContext: apgar.patientData,
        recommendations: [
          { action: 'Score Apgar documenté à 1 et 5 min', level: 'I-A' },
          { action: 'Escalade pédiatre si Apgar ≤ 6', level: 'I-A' },
        ],
        references: refsFromIds(['acog2020apgar', 'sfn2016neonatal', 'nice2023postnatal']),
      };
    }

    case 'risk': {
      return {
        summary: 'Risques obstétricaux (matrice, RCIU, prématurité, mode d’accouchement, adaptation néonatale) : stratification multi-facteurs alignée HAS 2016, CNGOF RCIU 2019 et RCOG 2017. Les agents du module Risques et la triangulation fournissent des probabilités indicatives.',
        narrative: 'Évaluation des risques : identification des facteurs maternels (âge, IMC, comorbidités), obstétricaux (antécédents de RCIU, mort fœtale, hémorragie, prématurité) et fœtaux (croissance, Doppler, morphologie). RCIU / petit poids : surveillance serial et timing de naissance selon CNGOF 2019 et RCOG GTG 31. Probabilités illustratives (démo) : RCIU 12 % (IC 95 % 8–16), césarienne en urgence 18 % (14–22), Apgar < 7 à 5 min 5 % (2–8), prématurité 8 % (5–11) — chiffres non transférables sans modèle calibré sur votre population. Croiser avec FIGO/HAS pour la surveillance foetale intrapartum. Détail et explicabilité (SHAP) : onglet Risques. Extraits RAG « risques obstetricaux » pour l’orientation et le RCIU.',
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
        references: refsFromIds(['has2016suivi', 'cngof2019rciu', 'rcog2017', 'figo2015', 'has2022']),
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

    case 'prenatal': {
      const prenatalRefs = refsFromIds(['has2016suivi', 'has2017t21', 'csp2122', 'cngofsfd2010dg', 'has2022']);
      return {
        summary: 'Suivi prénatal (France) : cadre légal des 7 consultations, EPP, échographies et dépistages ; repérage des situations à risque et orientation HAS 2016 ; bilans biologiques et SGB.',
        narrative: 'Le suivi prénatal combine obligations du Code de la santé publique (R2122-1 : 7 examens, premier avant 15 SA puis suivi mensuel 4e–9e mois) et l’entretien prénatal précoce obligatoire (information, violences, addictions, projet de naissance). Trois échographies sont attendues dans le parcours standard (T1 datation/CN, T2 morphologie, T3 croissance). Dépistage T21 : stratégie à 3 paliers HAS 2017 ; DG : HGPO 24–28 SA et critères IADPSG (CNGOF/SFD 2010) ; SGB : dépistage 34–38 SA. HAS 2016 : adapter la fréquence et le lieu d’accouchement si facteurs de risque. Les extraits RAG « suivi prenatal » reprennent calendrier légal, bilans sérologiques/vaccins et orientation. Références : HAS 2016, HAS 2017 T21, CSP, CNGOF/SFD 2010.',
        recommendations: [
          { action: 'Consulter l\'onglet Suivi prénatal pour le calendrier et les dépistages', level: 'I-A' },
          { action: 'Vérifier la conformité du calendrier (7 consultations + EPP + 3 échos)', level: 'I-A' },
        ],
        references: prenatalRefs,
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

    case 'accouchement': {
      const accRefs = refsFromIds(['cngof2021', 'figo2018bishop', 'has2020cesarienne', 'nice2014', 'who2018', 'has2022']);
      return {
        summary:
          'Accouchement : conduite du travail (phases, surveillance maternelle et fœtale), analgésie, maturation cervicale et induction (score de Bishop), indications de césarienne et sécurité intrapartum selon CNGOF 2021, HAS et NICE.',
        narrative:
          "CNGOF 2021 décrit la prise en charge de l'accouchement par voie basse : surveillance clinique pendant la phase latente et active, gestion de la douleur (y compris péridurale sur indication et choix de la femme), surveillance du bien-être fœtal selon HAS 2022 et interprétation FIGO 2015 du CTG. FIGO 2018 : score de Bishop et stratégie d'induction / maturation cervicale. HAS 2020 : cadre des indications et de la réalisation de la césarienne (urgences vs programme). NICE CG190 et WHO 2018 : principes de soins respectueux, compagnonnage et réduction des interventions inutiles. Contenu pédagogique ; appliquer les protocoles locaux. Extraits RAG « accouchement », « Bishop », « césarienne ».",
        recommendations: [
          { action: 'Vérifier le score de Bishop avant toute induction programmée', level: 'I-A' },
          { action: 'Documenter le consentement et le plan de naissance ; escalade si souffrance fœtale aiguë', level: 'I-A' },
        ],
        references: accRefs,
      };
    }

    case 'pmi': {
      const pmiRefs = refsFromIds(['csp_pmi', 'nice2023postnatal', 'oms2014kangourou']);
      return {
        summary:
          'PMI (Protection maternelle et infantile) : service public de prévention — consultations gratuites, suivi de la croissance et du développement de l’enfant 0–6 ans, vaccination, allaitement, orientation ; lien avec le postnatal et la médecine de ville.',
        narrative:
          "Le Code de la santé publique organise les missions de prévention et les services départementaux (articles L2111-1 et s.) : accueil des familles, évaluation de l’enfant, dépistages (croissance, développement, vision, audition selon programmes), rappels vaccinaux et coordination avec le médecin traitant, soutien à l’allaitement et prévention des accidents domestiques. Le carnet de santé structure le suivi. Après la maternité, NICE NG194 insiste sur l’information des parents, les signes d’alerte et la continuité des soins — la PMI participe à ce continuum avec l’hôpital et la ville. OMS : peau à peau et soutien à l’allaitement. Contenu informatif ; modalités selon votre département. Extraits RAG « PMI ».",
        recommendations: [
          { action: 'Orienter vers la PMI de secteur pour le carnet et les bilans de l’enfant', level: 'I-B' },
          { action: 'Coordonner avec le pédiatre / médecin traitant pour les vaccins et dépistages', level: 'I-A' },
        ],
        references: pmiRefs,
      };
    }

    case 'pe_eclampsia': {
      const peRefs = refsFromIds(['isshp2014', 'acog222pe', 'nice2019ng133', 'cngof2021']);
      return {
        summary:
          "L'éclampsie est définie par des convulsions généralisées (et/ou un coma) survenant en l'absence d'une autre cause neurologique évidente, dans un contexte de troubles hypertensifs de la grossesse (THG), le plus souvent sur pré-éclampsie sévère. Les mécanismes précis des crises restent incomplets ; la prise en charge est urgente (guidelines).",
        narrative:
          "Cadre nosologique (ISSHP 2014 ; ACOG 222) : la pré-éclampsie est un syndrome materno-fœtal lié au placenta, avec hypertension et atteinte d'organe (protéinurie ou critères alternatifs). L'éclampsie s'ajoute lors de crises convulsives ou de coma non attribuables à une autre cause. Physiopathologie (synthèse consensus) : dysfonction placentaire précoce, libération de facteurs anti-angiogéniques (sFlt-1) et déficit relatif de pro-angiogéniques (PlGF), inflammation et dysfonction endothéliale systémique ; complications vasculaires cérébrales (œdème, hyperperfusion, ischémie) et seuils de seuil convulsif mal caractérisés expliquent en partie l'apparition des crises. « Causes » au sens clinique : la grande majorité des éclampsies surviennent dans un contexte de pré-éclampsie (souvent sévère) ; des formes atypiques ou sans critères classiques complets sont décrites. Facteurs de risque associés à l'aggravation vers éclampsie incluent notamment nulliparité, antécédents de pré-éclampsie/éclampsie, maladie rénale chronique, diabète, obésité, grossesse multiple, âge extrême, retard de prise en charge de l'HTA sévère — sans liste exhaustive (NICE NG133, ACOG 222). Ce contenu est pédagogique ; toute situation réelle impose décision clinique et protocole local. Références : ISSHP 2014, ACOG PB 222 (2020), NICE NG133.",
        recommendations: [
          { action: 'Urgences obstétricales : stabilisation maternelle, prévention récidive (MgSO4 selon protocole), évaluation fœtale et timing d\'accouchement selon guidelines', level: 'I-A' },
          { action: 'Avec clé API Claude activée, réponses plus détaillées et contextualisées (RAG + littérature)', level: '—' },
        ],
        references: peRefs,
      };
    }

    default: {
      return {
        summary:
          'Réponse générique (mode démo) : précisez un thème couvert par la base RAG (suivi prénatal, monitoring CTG, risques obstétricaux, accouchement, Apgar, PMI, THG/éclampsie…) ou configurez la clé API.',
        narrative:
          'Intents démo disponibles : suivi prénatal (7 consultations, EPP, dépistages), monitoring CTG (FIGO, HAS, Cochrane), risques (RCIU, stratification), accouchement (travail, Bishop, césarienne), Apgar et adaptation néonatale, PMI et suite postnatale, dossier patiente, THG/éclampsie. Reformulez avec les mots-clés du thème ou activez ANTHROPIC_API_KEY pour le mode complet.',
        recommendations: [
          { action: 'Exemples : « suivi prénatal SGB », « monitoring CTG pathologique », « risques RCIU », « accouchement induction », « score Apgar », « consultation PMI »', level: '—' },
          { action: 'Configurer ANTHROPIC_API_KEY pour réponses JSON structurées hors démo', level: '—' },
        ],
        references: refs.slice(0, 5),
      };
    }
  }
}

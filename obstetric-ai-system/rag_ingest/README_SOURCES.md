# Base de Connaissances RAG — Santé Foetale et Obstétrique
## Catalogue Complet des Sources de Littérature (Multilingue)

**Version** : 1.0.0 | **Date** : 2026-04-08
**Usage** : Injection dans un pipeline RAG pour IA d'assistance médicale anténatale

---

## 1. BASES BIBLIOGRAPHIQUES PRIMAIRES (API programmatique)

### 1.1 PubMed / MEDLINE (NCBI E-utilities)
- **URL** : https://eutils.ncbi.nlm.nih.gov/entrez/eutils/
- **Documentation API** : https://www.ncbi.nlm.nih.gov/books/NBK25497/
- **Bulk FTP** : https://ftp.ncbi.nlm.nih.gov/pubmed/baseline/
- **Update FTP** : https://ftp.ncbi.nlm.nih.gov/pubmed/updatefiles/
- **Couverture** : 37M+ citations, anglais principal + multilingue
- **Accès** : Gratuit, API key recommandée (10 req/s vs 3/s)
- **Obtenir API key** : https://www.ncbi.nlm.nih.gov/account/settings/
- **MeSH Terms obstétriques** :
  - `"Obstetrics"[MeSH]`
  - `"Pregnancy"[MeSH]`
  - `"Fetal Monitoring"[MeSH]`
  - `"Prenatal Care"[MeSH]`
  - `"Pregnancy Complications"[MeSH]`
  - `"Pre-Eclampsia"[MeSH]`
  - `"Diabetes, Gestational"[MeSH]`
  - `"Fetal Growth Retardation"[MeSH]`
  - `"Postpartum Hemorrhage"[MeSH]`
  - `"Cardiotocography"[MeSH]`
  - `"Apgar Score"[MeSH]`
  - `"Labor, Obstetric"[MeSH]`
  - `"Cesarean Section"[MeSH]`
  - `"Ultrasonography, Prenatal"[MeSH]`
  - `"Perinatal Care"[MeSH]`
  - `"Maternal Mortality"[MeSH]`
  - `"Infant, Newborn"[MeSH]`
  - `"Placenta Diseases"[MeSH]`
  - `"Eclampsia"[MeSH]`
  - `"HELLP Syndrome"[MeSH]`
  - `"Fetal Distress"[MeSH]`
  - `"Chorioamnionitis"[MeSH]`
  - `"Streptococcal Infections"[MeSH]`
  - `"Depression, Postpartum"[MeSH]`
  - `"Venous Thromboembolism"[MeSH]`
  - `"Anemia"[MeSH] AND "Pregnancy"[MeSH]`

**Référence** : National Library of Medicine (2024) *E-utilities Quick Start*. Available at: https://www.ncbi.nlm.nih.gov/books/NBK25500/ (Accessed: 8 April 2026).

### 1.2 PubMed Central (PMC) — Full Text Open Access
- **URL** : https://www.ncbi.nlm.nih.gov/pmc/
- **API OA** : https://www.ncbi.nlm.nih.gov/pmc/tools/openftlist/
- **Bulk FTP** : https://ftp.ncbi.nlm.nih.gov/pub/pmc/oa_bulk/
- **Couverture** : 9M+ articles full text OA
- **Format** : XML JATS, PDF

### 1.3 Europe PMC
- **URL** : https://europepmc.org/
- **REST API** : https://europepmc.org/RestfulWebService
- **Documentation** : https://europepmc.org/developers
- **Bulk download** : https://europepmc.org/downloads
- **Couverture** : 43M+ citations, 10M+ full text, 6.5M+ OA
- **Langues** : Anglais principal + européennes
- **Text-mining** : Annotations maladies, gènes, organismes intégrées

**Référence** : Ferguson, C. et al. (2024) 'Europe PMC in 2023', *Nucleic Acids Research*, 52(D1), pp. D1668-D1676. doi: 10.1093/nar/gkad1085.

### 1.4 OpenAlex
- **URL** : https://openalex.org/
- **API** : https://api.openalex.org/
- **Documentation** : https://docs.openalex.org/
- **Bulk download** : https://docs.openalex.org/download-all-data/openalex-snapshot
- **Couverture** : 250M+ works, toutes disciplines, multilingue
- **Accès** : Gratuit, aucune clé API requise (politesse : mailto param)
- **Concepts obstétriques** :
  - `https://api.openalex.org/works?filter=concepts.id:C71924100` (Obstetrics)
  - `https://api.openalex.org/works?filter=concepts.id:C126322002` (Gynecology)
  - `https://api.openalex.org/works?filter=concepts.id:C2778429790` (Fetal Medicine)
- **Filtres utiles** : `is_oa:true`, `publication_year:>2019`, `language:fr|es|pt|en`

**Référence** : Priem, J., Piwowar, H. and Orr, R. (2022) 'OpenAlex: A fully-open index of scholarly works, authors, venues, institutions, and concepts', *arXiv preprint*, arXiv:2205.01833.

### 1.5 Semantic Scholar (S2ORC)
- **URL** : https://www.semanticscholar.org/
- **API** : https://api.semanticscholar.org/
- **Documentation** : https://api.semanticscholar.org/api-docs/
- **Bulk datasets (S2ORC)** : https://api.semanticscholar.org/datasets/v1/release/latest
- **Couverture** : 200M+ papers, full text machine-readable pour OA
- **API key** : Gratuite sur demande (augmente rate limits)

**Référence** : Lo, K. et al. (2020) 'S2ORC: The Semantic Scholar Open Research Corpus', *Proceedings of ACL 2020*, pp. 4969-4983.

### 1.6 CORE (Connecting Repositories)
- **URL** : https://core.ac.uk/
- **API v3** : https://api.core.ac.uk/v3/
- **Documentation** : https://core.ac.uk/docs/
- **Bulk download** : https://core.ac.uk/dataset
- **Couverture** : 300M+ metadata, 36M+ full text OA
- **Langues** : Multilingue (repositories du monde entier)

---

## 2. BASES DE REVUES SYSTÉMATIQUES ET GUIDELINES

### 2.1 Cochrane Library
- **URL** : https://www.cochranelibrary.com/
- **Search API** : https://www.cochranelibrary.com/cdsr/reviews
- **Cochrane Pregnancy & Childbirth Group** : https://pregnancy.cochrane.org/
- **Accès** : Résumés gratuits, full text par abonnement
- **Langues** : Résumés traduits en français, espagnol, etc.
- **Note** : Pas d'API REST publique officielle ; ingestion via scraping éthique des résumés OA ou via PubMed (PMID Cochrane)

### 2.2 NICE Evidence Search (UK)
- **URL** : https://www.evidence.nhs.uk/
- **Syndication API** : https://www.nice.org.uk/corporate/ecd10
- **API key** : Demande à api@nice.org.uk
- **Guidelines obstétriques clés** :
  - NG201 (Antenatal care) : https://www.nice.org.uk/guidance/ng201
  - NG133 (Hypertension in pregnancy) : https://www.nice.org.uk/guidance/ng133
  - NG229 (Fetal monitoring in labour) : https://www.nice.org.uk/guidance/ng229
  - CG190 (Intrapartum care) : https://www.nice.org.uk/guidance/cg190
  - NG25 (Preterm labour and birth) : https://www.nice.org.uk/guidance/ng25
- **Format** : JSON, HTML structuré
- **Langues** : Anglais

**Référence** : National Institute for Health and Care Excellence (2024) *NICE Syndication Service and API Guide*. London: NICE.

### 2.3 WHO IRIS (Institutional Repository)
- **URL** : https://iris.who.int/
- **REST API (DSpace)** : https://iris.who.int/server/api/
- **OAI-PMH** : https://iris.who.int/server/oai/request
- **Couverture** : Documents OMS complets, rapports, guidelines
- **Langues** : **6 langues officielles** (AR, ZH, EN, FR, RU, ES)
- **Collections clés** :
  - Maternal Health : https://iris.who.int/handle/10665/352543
  - Reproductive Health : https://iris.who.int/handle/10665/77785
  - Newborn Health : https://iris.who.int/handle/10665/255732

### 2.4 HAS (Haute Autorité de Santé — France)
- **URL** : https://www.has-sante.fr/
- **Recommandations** : https://www.has-sante.fr/jcms/fc_2875171/fr/liste-des-recommandations
- **Accès** : PDFs téléchargeables, pas d'API REST officielle
- **Ingestion** : Web scraping éthique + téléchargement PDF
- **Langues** : **Français**
- **Guides obstétriques clés** :
  - Diabète gestationnel (2010)
  - Suivi de grossesse normale
  - Accouchement normal

### 2.5 CNGOF (Collège National des Gynécologues Obstétriciens Français)
- **URL** : https://cngof.fr/
- **RPC** : https://cngof.fr/rpc/
- **Accès** : PDFs des recommandations
- **Langues** : **Français**

### 2.6 ACOG (American College of Obstetricians and Gynecologists)
- **URL** : https://www.acog.org/clinical/clinical-guidance
- **Practice Bulletins** : https://www.acog.org/clinical/clinical-guidance/practice-bulletin
- **Accès** : Résumés gratuits, full text par abonnement
- **Langues** : Anglais, certains résumés en espagnol

### 2.7 FIGO (International Federation of Gynecology and Obstetrics)
- **URL** : https://www.figo.org/
- **Guidelines** : https://www.figo.org/resources/figo-statements-and-guidelines
- **Accès** : Gratuit (PDF)
- **Langues** : Anglais, français, espagnol

### 2.8 RCOG (Royal College of Obstetricians and Gynaecologists)
- **URL** : https://www.rcog.org.uk/
- **Green-top Guidelines** : https://www.rcog.org.uk/guidance/browse-all-guidance/green-top-guidelines/
- **Accès** : Gratuit (PDF/HTML)
- **Langues** : Anglais

---

## 3. BASES MULTILINGUES SPÉCIALISÉES

### 3.1 LiSSa (Littérature Scientifique en Santé — Français)
- **URL** : https://www.lissa.fr/
- **CISMeF** : https://www.cismef.org/
- **Couverture** : 900K+ références en français
- **Sources** : PubMed français + Elsevier-Masson + revues francophones
- **Accès** : Gratuit (compte requis)
- **Langues** : **Français exclusivement**
- **Note** : Pas d'API REST publique ; ingestion via export RIS/BibTeX

**Référence** : Griffon, N. et al. (2017) 'LiSSa, Littérature Scientifique en Santé : une base de données bibliographique en français', *Revue d'Épidémiologie et de Santé Publique*, 65(Suppl 1), pp. S42-S43.

### 3.2 SciELO (Amérique Latine, Espagnol/Portugais)
- **URL** : https://www.scielo.org/
- **API** : https://search.scielo.org/ (SciELO Search)
- **OAI-PMH** : Disponible par collection nationale
- **Documentation technique** : https://scielo.readthedocs.io/
- **Couverture** : 2000+ revues OA, 16 pays
- **Langues** : **Espagnol, Portugais**, anglais
- **Collections santé** : ~29% des titres brésiliens

**Référence** : Packer, A.L. et al. (2014) 'SciELO: 15 years of open access', *D-Lib Magazine*, 20(10).

### 3.3 LILACS (Literatura Latinoamericana en Ciencias de la Salud)
- **URL** : https://lilacs.bvsalud.org/
- **API BVS** : https://wiki.bireme.org/en/index.php/LILACS
- **Couverture** : 900K+ références, Amérique Latine et Caraïbes
- **Langues** : **Espagnol, Portugais**, anglais

### 3.4 IMEMR (Index Medicus for the Eastern Mediterranean Region)
- **URL** : https://www.emro.who.int/information-resources/imemr/
- **Couverture** : Littérature médicale Méditerranée orientale
- **Langues** : **Arabe**, anglais, français

### 3.5 WPRIM (Western Pacific Region Index Medicus)
- **URL** : https://www.wprim.org/
- **Couverture** : Asie-Pacifique
- **Langues** : Multilingue (chinois, japonais, coréen, anglais)

### 3.6 AIM (African Index Medicus)
- **URL** : https://indexmedicus.afro.who.int/
- **Couverture** : Littérature médicale africaine
- **Langues** : **Anglais, français**, portugais

### 3.7 Global Index Medicus (WHO — Agrégateur)
- **URL** : https://www.globalindexmedicus.net/
- **Agrège** : LILACS + IMEMR + WPRIM + AIM + IMSEAR
- **Couverture** : Littérature médicale non-indexée dans PubMed
- **Langues** : **Toutes langues**

### 3.8 DOAJ (Directory of Open Access Journals)
- **URL** : https://doaj.org/
- **API** : https://doaj.org/api/
- **Documentation** : https://doaj.org/docs/api/
- **Couverture** : 21 000+ journaux OA, toutes disciplines
- **Filtres** : `bibjson.subject.term:obstetrics`, `bibjson.subject.term:midwifery`
- **Langues** : **Multilingue** (journaux de 130+ pays)

---

## 4. BASES DE DONNÉES CLINIQUES ET SPÉCIALISÉES

### 4.1 ClinicalTrials.gov
- **URL** : https://clinicaltrials.gov/
- **API v2** : https://clinicaltrials.gov/api/v2/studies
- **Documentation** : https://clinicaltrials.gov/data-api/api
- **Filtres** : `query.cond=pregnancy+obstetrics`, `filter.overallStatus=COMPLETED`
- **Couverture** : 500K+ essais cliniques
- **Langues** : Anglais (données internationales)

### 4.2 ICTRP (WHO International Clinical Trials Registry Platform)
- **URL** : https://trialsearch.who.int/
- **Couverture** : Registres d'essais mondiaux agrégés
- **Langues** : Multilingue

### 4.3 Epistemonikos
- **URL** : https://www.epistemonikos.org/
- **API** : https://api.epistemonikos.org/
- **Couverture** : Revues systématiques et synthèses de preuves
- **Langues** : **Anglais, espagnol** (interface multilingue)
- **Spécialité** : Excellent pour les revues systématiques obstétriques

### 4.4 TRIP Database
- **URL** : https://www.tripdatabase.com/
- **API** : Disponible (clé requise)
- **Couverture** : Clinical evidence, guidelines, revues systématiques
- **Langues** : Anglais

### 4.5 Maternal and Infant Health — AHRQ Evidence Reports
- **URL** : https://www.ahrq.gov/topics/maternal-infant-health.html
- **Accès** : PDFs gratuits
- **Langues** : Anglais

### 4.6 UpToDate (Référence clinique — Payant)
- **URL** : https://www.uptodate.com/
- **Note** : Payant, pas d'API publique ; contenu expert de haute qualité
- **Langues** : Anglais, certaines traductions

---

## 5. STANDARDS ET TERMINOLOGIES

### 5.1 SNOMED CT
- **URL** : https://www.snomed.org/
- **Browser** : https://browser.ihtsdotools.org/
- **API FHIR** : https://snowstorm.ihtsdotools.org/fhir
- **Langues** : 19 langues (dont EN, ES, FR, PT, NL, SV, ZH)

### 5.2 LOINC
- **URL** : https://loinc.org/
- **API** : https://fhir.loinc.org/
- **Téléchargement** : https://loinc.org/downloads/
- **Langues** : 18 langues

### 5.3 ICD-11
- **URL** : https://icd.who.int/
- **API** : https://icd.who.int/icdapi
- **Langues** : **43 langues**

### 5.4 MeSH (Medical Subject Headings)
- **URL** : https://meshb.nlm.nih.gov/
- **API** : https://id.nlm.nih.gov/mesh/
- **Téléchargement** : https://www.nlm.nih.gov/databases/download/mesh.html
- **Langues** : Anglais (traductions communautaires FR, ES, PT, etc.)

### 5.5 HL7 FHIR R4 — Profils Maternels
- **Maternal Health IG** : https://build.fhir.org/ig/HL7/fhir-mmm-ig/
- **IPS Pregnancy Profiles** : https://hl7.org/fhir/uv/ips/STU2/
- **US Core Pregnancy** : https://hl7.org/fhir/us/core/STU6.1/

---

## 6. RÉSUMÉ QUANTITATIF

| Source | Articles/Documents | Full Text OA | API | Langues |
|--------|-------------------|-------------|-----|---------|
| PubMed/MEDLINE | 37M+ | Via PMC | E-utilities | EN+multi |
| PMC | 9M+ | 9M+ | E-utilities | EN+multi |
| Europe PMC | 43M+ | 10M+ | REST | EN+EU |
| OpenAlex | 250M+ | 60M+ | REST | Multi |
| Semantic Scholar | 200M+ | S2ORC full text | REST | EN+multi |
| CORE | 300M+ metadata | 36M+ | REST v3 | Multi |
| Cochrane | 12K+ reviews | Résumés | — | EN (trad) |
| NICE | 2000+ guidelines | Oui | Syndication | EN |
| WHO IRIS | 100K+ docs | Oui | DSpace REST | 6 langues |
| LiSSa/CISMeF | 900K+ | Partiel | — | FR |
| SciELO | 800K+ | Oui (OA) | OAI-PMH | ES/PT |
| LILACS | 900K+ | Partiel | BVS API | ES/PT |
| Global Index Medicus | 500K+ | Partiel | — | Multi |
| DOAJ | 10M+ articles | Oui (OA) | REST | Multi |
| ClinicalTrials.gov | 500K+ essais | Oui | REST v2 | EN |
| Epistemonikos | 400K+ SR | Oui | REST | EN/ES |

**Estimation totale ingérable** : **100M+ références**, dont **20M+ full text OA** en obstétrique/santé fœtale après filtrage.

---

## Bibliographie

Ferguson, C. et al. (2024) 'Europe PMC in 2023', *Nucleic Acids Research*, 52(D1), pp. D1668-D1676.

Griffon, N. et al. (2017) 'LiSSa, Littérature Scientifique en Santé', *Revue d'Épidémiologie et de Santé Publique*, 65(Suppl 1), pp. S42-S43.

Lo, K. et al. (2020) 'S2ORC: The Semantic Scholar Open Research Corpus', *Proceedings of ACL 2020*, pp. 4969-4983.

National Library of Medicine (2024) *E-utilities Quick Start*. Bethesda: NLM.

Packer, A.L. et al. (2014) 'SciELO: 15 years of open access', *D-Lib Magazine*, 20(10).

Priem, J., Piwowar, H. and Orr, R. (2022) 'OpenAlex: A fully-open index of scholarly works', *arXiv:2205.01833*.

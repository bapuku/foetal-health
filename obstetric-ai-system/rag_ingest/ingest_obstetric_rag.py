#!/usr/bin/env python3
"""
══════════════════════════════════════════════════════════════════════════
PIPELINE D'INGESTION RAG — BASE DE CONNAISSANCES OBSTÉTRIQUE & SANTÉ FŒTALE
══════════════════════════════════════════════════════════════════════════

Usage dans Cursor :
    1. pip install -r requirements.txt
    2. Configurer .env (voir ci-dessous)
    3. python ingest_obstetric_rag.py --sources all --max-per-source 10000

Architecture :
    Sources (PubMed, OpenAlex, EuropePMC, WHO, NICE, ...)
    → Fetcher (API-specific)
    → Parser (XML/JSON → Document)
    → Chunker (RecursiveCharacterTextSplitter)
    → Embedder (sentence-transformers ou OpenAI)
    → VectorStore (ChromaDB / Qdrant / Pinecone)

Références :
    National Library of Medicine (2024) 'E-utilities Quick Start'.
    Priem, J., Piwowar, H. and Orr, R. (2022) 'OpenAlex', arXiv:2205.01833.
    Ferguson, C. et al. (2024) 'Europe PMC in 2023', Nucleic Acids Research.
    Lo, K. et al. (2020) 'S2ORC', Proceedings of ACL 2020.
══════════════════════════════════════════════════════════════════════════
"""

import os
import sys
import json
import time
import hashlib
import logging
import argparse
import xml.etree.ElementTree as ET
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional, Generator
from dataclasses import dataclass, field, asdict
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

try:
    from dotenv import load_dotenv
except ImportError:
    def load_dotenv(*_a, **_k):
        return False

# ════════════════════════════════════════════════════════════════
# CONFIGURATION
# ════════════════════════════════════════════════════════════════

@dataclass
class Config:
    """Configuration centrale du pipeline d'ingestion."""

    # ── API Keys (depuis .env ou variables d'environnement) ──
    ncbi_api_key: str = os.getenv("NCBI_API_KEY", "")
    semantic_scholar_api_key: str = os.getenv("S2_API_KEY", "")
    nice_api_key: str = os.getenv("NICE_API_KEY", "")
    core_api_key: str = os.getenv("CORE_API_KEY", "")

    # ── Paramètres d'ingestion ──
    max_per_source: int = 10000
    batch_size: int = 100
    chunk_size: int = 1500
    chunk_overlap: int = 200
    max_workers: int = 4
    rate_limit_delay: float = 0.35  # secondes entre requêtes

    # ── Vector Store ──
    vector_store: str = "chroma"  # chroma | qdrant | pinecone
    collection_name: str = "obstetric_knowledge_base"
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    # Alternative médicale recommandée :
    # embedding_model: str = "pritamdeka/S-PubMedBert-MS-MARCO"

    # ── Chemins ──
    output_dir: str = "./rag_data"
    raw_dir: str = "./rag_data/raw"
    processed_dir: str = "./rag_data/processed"
    vector_dir: str = "./rag_data/vectorstore"
    log_dir: str = "./rag_data/logs"


@dataclass
class Document:
    """Document normalisé pour le pipeline RAG."""
    id: str
    title: str
    abstract: str
    full_text: str = ""
    authors: List[str] = field(default_factory=list)
    year: int = 0
    journal: str = ""
    doi: str = ""
    pmid: str = ""
    source_db: str = ""
    language: str = "en"
    mesh_terms: List[str] = field(default_factory=list)
    url: str = ""
    license: str = ""
    metadata: Dict = field(default_factory=dict)

    @property
    def content_hash(self) -> str:
        content = f"{self.title}{self.abstract}{self.full_text}"
        return hashlib.sha256(content.encode()).hexdigest()[:16]


# ════════════════════════════════════════════════════════════════
# HTTP CLIENT AVEC RETRY
# ════════════════════════════════════════════════════════════════

def create_session(max_retries: int = 3) -> requests.Session:
    """Crée une session HTTP avec retry et backoff."""
    session = requests.Session()
    retry = Retry(
        total=max_retries,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET", "POST"]
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    session.headers.update({
        "User-Agent": "ObstetricRAG/1.0 (medical-research; contact@hospital.org)"
    })
    return session


# ════════════════════════════════════════════════════════════════
# REQUÊTES MeSH OBSTÉTRIQUES
# ════════════════════════════════════════════════════════════════

OBSTETRIC_MESH_QUERIES = [
    # ── Cœur obstétrique ──
    '"Obstetrics"[MeSH] OR "Pregnancy"[MeSH]',
    '"Prenatal Care"[MeSH] OR "Perinatal Care"[MeSH]',
    '"Fetal Monitoring"[MeSH] OR "Cardiotocography"[MeSH]',
    # ── Pathologies maternelles ──
    '"Pre-Eclampsia"[MeSH] OR "Eclampsia"[MeSH] OR "HELLP Syndrome"[MeSH]',
    '"Diabetes, Gestational"[MeSH]',
    '"Postpartum Hemorrhage"[MeSH]',
    '"Hypertension, Pregnancy-Induced"[MeSH]',
    '"Pregnancy Complications, Infectious"[MeSH]',
    '"Depression, Postpartum"[MeSH]',
    '"Venous Thromboembolism"[MeSH] AND "Pregnancy"[MeSH]',
    '"Anemia"[MeSH] AND "Pregnancy"[MeSH]',
    # ── Pathologies fœtales ──
    '"Fetal Growth Retardation"[MeSH]',
    '"Fetal Distress"[MeSH]',
    '"Ultrasonography, Prenatal"[MeSH]',
    '"Placenta Diseases"[MeSH]',
    # ── Travail et accouchement ──
    '"Labor, Obstetric"[MeSH]',
    '"Cesarean Section"[MeSH]',
    '"Labor, Induced"[MeSH]',
    '"Apgar Score"[MeSH]',
    # ── Néonatal ──
    '"Infant, Newborn"[MeSH] AND "Asphyxia Neonatorum"[MeSH]',
    '"Chorioamnionitis"[MeSH]',
    '"Streptococcal Infections"[MeSH] AND "Pregnancy"[MeSH]',
]

# Requêtes OpenAlex (concept IDs)
OPENALEX_CONCEPT_IDS = [
    "C71924100",    # Obstetrics
    "C126322002",   # Gynecology
    "C2778429790",  # Fetal medicine
    "C2776065244",  # Prenatal care
    "C2780654580",  # Pre-eclampsia
    "C2780942532",  # Gestational diabetes
    "C2779513064",  # Cardiotocography
]


# ════════════════════════════════════════════════════════════════
# FETCHERS — Un par source
# ════════════════════════════════════════════════════════════════

class PubMedFetcher:
    """
    Ingestion depuis PubMed via NCBI E-utilities.

    Référence : National Library of Medicine (2024) 'E-utilities Quick Start',
    Available at: https://www.ncbi.nlm.nih.gov/books/NBK25500/
    """

    BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"

    def __init__(self, config: Config, session: requests.Session):
        self.config = config
        self.session = session
        self.logger = logging.getLogger("PubMedFetcher")

    def search(self, query: str, max_results: int = 10000) -> List[str]:
        """ESearch — retourne une liste de PMIDs."""
        params = {
            "db": "pubmed",
            "term": query,
            "retmax": min(max_results, 10000),
            "retmode": "json",
            "sort": "relevance",
            "datetype": "pdat",
            "mindate": "2015",
            "maxdate": "2026",
        }
        if self.config.ncbi_api_key:
            params["api_key"] = self.config.ncbi_api_key

        url = f"{self.BASE_URL}/esearch.fcgi"
        resp = self.session.get(url, params=params, timeout=30)
        resp.raise_for_status()
        data = resp.json()

        pmids = data.get("esearchresult", {}).get("idlist", [])
        total = int(data.get("esearchresult", {}).get("count", 0))
        self.logger.info(f"PubMed search '{query[:50]}...' → {total} total, fetched {len(pmids)} PMIDs")
        return pmids

    def fetch_details(self, pmids: List[str]) -> List[Document]:
        """EFetch — récupère les détails des articles par batch."""
        documents = []

        for i in range(0, len(pmids), self.config.batch_size):
            batch = pmids[i:i + self.config.batch_size]
            params = {
                "db": "pubmed",
                "id": ",".join(batch),
                "retmode": "xml",
                "rettype": "abstract",
            }
            if self.config.ncbi_api_key:
                params["api_key"] = self.config.ncbi_api_key

            url = f"{self.BASE_URL}/efetch.fcgi"
            resp = self.session.get(url, params=params, timeout=60)
            resp.raise_for_status()

            docs = self._parse_pubmed_xml(resp.text)
            documents.extend(docs)

            time.sleep(self.config.rate_limit_delay)
            self.logger.info(f"  Fetched batch {i//self.config.batch_size + 1}: {len(docs)} articles")

        return documents

    def _parse_pubmed_xml(self, xml_text: str) -> List[Document]:
        """Parse le XML PubMed en Documents."""
        docs = []
        try:
            root = ET.fromstring(xml_text)
        except ET.ParseError:
            self.logger.error("Failed to parse PubMed XML")
            return docs

        for article in root.findall(".//PubmedArticle"):
            try:
                medline = article.find(".//MedlineCitation")
                pmid = medline.findtext("PMID", "")
                art = medline.find(".//Article")

                title = art.findtext("ArticleTitle", "") if art is not None else ""

                # Abstract
                abstract_parts = []
                abstract_el = art.find(".//Abstract") if art is not None else None
                if abstract_el is not None:
                    for ab_text in abstract_el.findall("AbstractText"):
                        label = ab_text.get("Label", "")
                        text = ab_text.text or ""
                        if label:
                            abstract_parts.append(f"{label}: {text}")
                        else:
                            abstract_parts.append(text)
                abstract = " ".join(abstract_parts)

                # Authors
                authors = []
                author_list = art.find(".//AuthorList") if art is not None else None
                if author_list is not None:
                    for author in author_list.findall("Author"):
                        last = author.findtext("LastName", "")
                        first = author.findtext("ForeName", "")
                        if last:
                            authors.append(f"{last}, {first}")

                # Year
                year = 0
                pub_date = art.find(".//Journal/JournalIssue/PubDate") if art is not None else None
                if pub_date is not None:
                    year_text = pub_date.findtext("Year", "0")
                    try:
                        year = int(year_text)
                    except ValueError:
                        year = 0

                # Journal
                journal = ""
                journal_el = art.find(".//Journal/Title") if art is not None else None
                if journal_el is not None:
                    journal = journal_el.text or ""

                # DOI
                doi = ""
                for eid in article.findall(".//ArticleIdList/ArticleId"):
                    if eid.get("IdType") == "doi":
                        doi = eid.text or ""
                        break

                # MeSH Terms
                mesh_terms = []
                for mesh in medline.findall(".//MeshHeadingList/MeshHeading/DescriptorName"):
                    if mesh.text:
                        mesh_terms.append(mesh.text)

                # Language
                lang = art.findtext("Language", "en") if art is not None else "en"

                doc = Document(
                    id=f"pubmed_{pmid}",
                    title=title,
                    abstract=abstract,
                    authors=authors[:10],
                    year=year,
                    journal=journal,
                    doi=doi,
                    pmid=pmid,
                    source_db="PubMed",
                    language=lang,
                    mesh_terms=mesh_terms,
                    url=f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
                )
                docs.append(doc)

            except Exception as e:
                self.logger.warning(f"Error parsing article: {e}")
                continue

        return docs

    def fetch_all(self) -> List[Document]:
        """Exécute toutes les requêtes MeSH obstétriques."""
        all_pmids = set()
        for query in OBSTETRIC_MESH_QUERIES:
            pmids = self.search(query, max_results=self.config.max_per_source)
            all_pmids.update(pmids)
            time.sleep(self.config.rate_limit_delay)

        self.logger.info(f"PubMed total unique PMIDs: {len(all_pmids)}")
        pmid_list = list(all_pmids)[:self.config.max_per_source]
        return self.fetch_details(pmid_list)


class OpenAlexFetcher:
    """
    Ingestion depuis OpenAlex API (gratuit, sans clé).

    Référence : Priem, J., Piwowar, H. and Orr, R. (2022)
    'OpenAlex: A fully-open index of scholarly works', arXiv:2205.01833.
    """

    BASE_URL = "https://api.openalex.org"

    def __init__(self, config: Config, session: requests.Session):
        self.config = config
        self.session = session
        self.logger = logging.getLogger("OpenAlexFetcher")

    def fetch_by_concept(self, concept_id: str, max_results: int = 5000,
                          language: str = None) -> List[Document]:
        """Récupère les works par concept OpenAlex."""
        documents = []
        cursor = "*"
        fetched = 0

        while fetched < max_results and cursor:
            params = {
                "filter": f"concepts.id:C{concept_id}" if not concept_id.startswith("C") else f"concepts.id:{concept_id}",
                "per_page": 200,
                "cursor": cursor,
                "select": "id,title,publication_year,doi,authorships,primary_location,abstract_inverted_index,language,open_access,concepts",
                "mailto": "obstetric-rag@research.org",
            }

            # Filtres additionnels
            filters = [f"concepts.id:{concept_id}"]
            filters.append("publication_year:>2014")
            if language:
                filters.append(f"language:{language}")
            params["filter"] = ",".join(filters)

            resp = self.session.get(f"{self.BASE_URL}/works", params=params, timeout=30)
            resp.raise_for_status()
            data = resp.json()

            results = data.get("results", [])
            if not results:
                break

            for work in results:
                doc = self._parse_work(work)
                if doc:
                    documents.append(doc)

            fetched += len(results)
            cursor = data.get("meta", {}).get("next_cursor")
            time.sleep(self.config.rate_limit_delay)

            if fetched % 1000 == 0:
                self.logger.info(f"  OpenAlex concept {concept_id}: {fetched} works fetched")

        return documents

    def _parse_work(self, work: dict) -> Optional[Document]:
        """Parse un work OpenAlex en Document."""
        try:
            # Reconstruire l'abstract depuis inverted index
            abstract = ""
            inv_index = work.get("abstract_inverted_index")
            if inv_index:
                # Reconstruire le texte
                word_positions = []
                for word, positions in inv_index.items():
                    for pos in positions:
                        word_positions.append((pos, word))
                word_positions.sort()
                abstract = " ".join(w for _, w in word_positions)

            # Authors
            authors = []
            for authorship in work.get("authorships", [])[:10]:
                name = authorship.get("author", {}).get("display_name", "")
                if name:
                    authors.append(name)

            # Journal
            journal = ""
            primary_loc = work.get("primary_location", {})
            if primary_loc and primary_loc.get("source"):
                journal = primary_loc["source"].get("display_name", "")

            # DOI
            doi = work.get("doi", "") or ""
            if doi.startswith("https://doi.org/"):
                doi = doi.replace("https://doi.org/", "")

            openalex_id = work.get("id", "").split("/")[-1]

            return Document(
                id=f"openalex_{openalex_id}",
                title=work.get("title", "") or "",
                abstract=abstract,
                authors=authors,
                year=work.get("publication_year", 0) or 0,
                journal=journal,
                doi=doi,
                source_db="OpenAlex",
                language=work.get("language", "en") or "en",
                url=work.get("id", ""),
                license=work.get("open_access", {}).get("oa_status", ""),
            )
        except Exception as e:
            self.logger.warning(f"Error parsing OpenAlex work: {e}")
            return None

    def fetch_all(self) -> List[Document]:
        """Récupère tous les concepts obstétriques."""
        all_docs = []
        seen_dois = set()

        for concept_id in OPENALEX_CONCEPT_IDS:
            docs = self.fetch_by_concept(
                concept_id,
                max_results=self.config.max_per_source // len(OPENALEX_CONCEPT_IDS)
            )
            for doc in docs:
                if doc.doi and doc.doi not in seen_dois:
                    seen_dois.add(doc.doi)
                    all_docs.append(doc)
                elif not doc.doi:
                    all_docs.append(doc)

        self.logger.info(f"OpenAlex total unique documents: {len(all_docs)}")
        return all_docs


class EuropePMCFetcher:
    """
    Ingestion depuis Europe PMC REST API.

    Référence : Ferguson, C. et al. (2024) 'Europe PMC in 2023',
    Nucleic Acids Research, 52(D1), pp. D1668-D1676.
    """

    BASE_URL = "https://www.ebi.ac.uk/europepmc/webservices/rest"

    def __init__(self, config: Config, session: requests.Session):
        self.config = config
        self.session = session
        self.logger = logging.getLogger("EuropePMCFetcher")

    QUERIES = [
        "obstetrics AND fetal monitoring",
        "pre-eclampsia pregnancy",
        "gestational diabetes mellitus",
        "postpartum hemorrhage",
        "cardiotocography CTG",
        "fetal growth restriction IUGR",
        "perinatal mental health depression",
        "pregnancy thromboembolism",
        "prenatal ultrasound Doppler",
        "neonatal resuscitation Apgar",
        "group B streptococcus pregnancy",
        "chorioamnionitis maternal infection",
    ]

    def search(self, query: str, max_results: int = 2000) -> List[Document]:
        """Search Europe PMC."""
        documents = []
        cursor_mark = "*"
        fetched = 0

        while fetched < max_results:
            params = {
                "query": query,
                "format": "json",
                "pageSize": 100,
                "cursorMark": cursor_mark,
                "resultType": "core",
                "sort": "RELEVANCE",
            }

            resp = self.session.get(f"{self.BASE_URL}/search", params=params, timeout=30)
            resp.raise_for_status()
            data = resp.json()

            results = data.get("resultList", {}).get("result", [])
            if not results:
                break

            for r in results:
                doc = Document(
                    id=f"europepmc_{r.get('id', '')}_{r.get('source', '')}",
                    title=r.get("title", ""),
                    abstract=r.get("abstractText", ""),
                    authors=[a.get("fullName", "") for a in r.get("authorList", {}).get("author", [])[:10]],
                    year=int(r.get("pubYear", 0) or 0),
                    journal=r.get("journalTitle", ""),
                    doi=r.get("doi", ""),
                    pmid=r.get("pmid", ""),
                    source_db="EuropePMC",
                    language=r.get("language", "en") or "en",
                    url=f"https://europepmc.org/article/{r.get('source', '')}/{r.get('id', '')}",
                    license=r.get("license", ""),
                )
                documents.append(doc)

            fetched += len(results)
            next_cursor = data.get("nextCursorMark")
            if next_cursor == cursor_mark:
                break
            cursor_mark = next_cursor or ""
            if not cursor_mark:
                break

            time.sleep(self.config.rate_limit_delay)

        self.logger.info(f"EuropePMC '{query[:40]}...' → {len(documents)} docs")
        return documents

    def fetch_all(self) -> List[Document]:
        all_docs = []
        seen = set()
        per_query = self.config.max_per_source // len(self.QUERIES)

        for q in self.QUERIES:
            docs = self.search(q, max_results=per_query)
            for doc in docs:
                key = doc.doi or doc.pmid or doc.title[:80]
                if key not in seen:
                    seen.add(key)
                    all_docs.append(doc)

        self.logger.info(f"EuropePMC total unique: {len(all_docs)}")
        return all_docs


class WHOIRISFetcher:
    """
    Ingestion depuis WHO IRIS (DSpace REST API).
    Documents OMS multilingues (6 langues).
    """

    BASE_URL = "https://iris.who.int/server/api"
    OAI_URL = "https://iris.who.int/server/oai/request"

    def __init__(self, config: Config, session: requests.Session):
        self.config = config
        self.session = session
        self.logger = logging.getLogger("WHOIRISFetcher")

    SEARCH_QUERIES = [
        "maternal health antenatal",
        "obstetric care guidelines",
        "fetal monitoring",
        "pregnancy complications preeclampsia",
        "gestational diabetes",
        "postpartum hemorrhage",
        "perinatal mental health",
        "neonatal resuscitation",
        "labour care guide",
        "maternal mortality",
    ]

    def search(self, query: str, max_results: int = 200) -> List[Document]:
        """Recherche via DSpace Discovery API."""
        documents = []
        params = {
            "query": query,
            "dsoType": "item",
            "size": min(max_results, 100),
            "sort": "score,DESC",
        }

        try:
            resp = self.session.get(
                f"{self.BASE_URL}/discover/search/objects",
                params=params, timeout=30
            )
            resp.raise_for_status()
            data = resp.json()

            embedded = data.get("_embedded", {})
            objects = embedded.get("searchResult", {}).get("_embedded", {}).get("objects", [])

            for obj in objects:
                item = obj.get("_embedded", {}).get("indexableObject", {})
                if not item:
                    continue

                title = ""
                abstract = ""
                language = "en"
                year = 0

                for md in item.get("metadata", {}).items() if isinstance(item.get("metadata"), dict) else []:
                    pass

                # Simplified metadata extraction
                metadata = item.get("metadata", {})
                if isinstance(metadata, dict):
                    title_vals = metadata.get("dc.title", [])
                    if title_vals:
                        title = title_vals[0].get("value", "") if isinstance(title_vals[0], dict) else str(title_vals[0])

                    abs_vals = metadata.get("dc.description.abstract", [])
                    if abs_vals:
                        abstract = abs_vals[0].get("value", "") if isinstance(abs_vals[0], dict) else str(abs_vals[0])

                    lang_vals = metadata.get("dc.language.iso", [])
                    if lang_vals:
                        language = lang_vals[0].get("value", "en") if isinstance(lang_vals[0], dict) else str(lang_vals[0])

                    date_vals = metadata.get("dc.date.issued", [])
                    if date_vals:
                        date_str = date_vals[0].get("value", "") if isinstance(date_vals[0], dict) else str(date_vals[0])
                        try:
                            year = int(date_str[:4])
                        except (ValueError, IndexError):
                            year = 0

                uuid = item.get("uuid", item.get("id", ""))

                doc = Document(
                    id=f"who_iris_{uuid}",
                    title=title,
                    abstract=abstract,
                    year=year,
                    source_db="WHO_IRIS",
                    language=language,
                    url=f"https://iris.who.int/handle/{item.get('handle', '')}",
                )
                documents.append(doc)

        except Exception as e:
            self.logger.warning(f"WHO IRIS search error: {e}")

        return documents

    def fetch_all(self) -> List[Document]:
        all_docs = []
        for q in self.SEARCH_QUERIES:
            docs = self.search(q)
            all_docs.extend(docs)
            time.sleep(self.config.rate_limit_delay * 2)

        self.logger.info(f"WHO IRIS total: {len(all_docs)}")
        return all_docs


class ClinicalTrialsFetcher:
    """
    Ingestion depuis ClinicalTrials.gov API v2.
    """

    BASE_URL = "https://clinicaltrials.gov/api/v2/studies"

    def __init__(self, config: Config, session: requests.Session):
        self.config = config
        self.session = session
        self.logger = logging.getLogger("ClinicalTrialsFetcher")

    CONDITION_QUERIES = [
        "pregnancy|obstetric",
        "pre-eclampsia|preeclampsia",
        "gestational diabetes",
        "postpartum hemorrhage",
        "fetal growth restriction",
        "cardiotocography|fetal monitoring",
        "perinatal depression|postpartum depression",
    ]

    def search(self, query: str, max_results: int = 500) -> List[Document]:
        documents = []
        page_token = None
        fetched = 0

        while fetched < max_results:
            params = {
                "query.cond": query,
                "filter.overallStatus": "COMPLETED,RECRUITING",
                "pageSize": 100,
                "format": "json",
                "fields": "NCTId,BriefTitle,OfficialTitle,BriefSummary,Condition,Phase,StartDate,CompletionDate,LeadSponsorName",
            }
            if page_token:
                params["pageToken"] = page_token

            try:
                resp = self.session.get(self.BASE_URL, params=params, timeout=30)
                resp.raise_for_status()
                data = resp.json()

                studies = data.get("studies", [])
                if not studies:
                    break

                for study in studies:
                    proto = study.get("protocolSection", {})
                    id_mod = proto.get("identificationModule", {})
                    desc_mod = proto.get("descriptionModule", {})
                    status_mod = proto.get("statusModule", {})

                    nct_id = id_mod.get("nctId", "")

                    doc = Document(
                        id=f"ctgov_{nct_id}",
                        title=id_mod.get("officialTitle", id_mod.get("briefTitle", "")),
                        abstract=desc_mod.get("briefSummary", ""),
                        year=int(str(status_mod.get("startDateStruct", {}).get("date", "0"))[:4] or 0),
                        source_db="ClinicalTrials.gov",
                        language="en",
                        url=f"https://clinicaltrials.gov/study/{nct_id}",
                        metadata={"phase": proto.get("designModule", {}).get("phases", [])},
                    )
                    documents.append(doc)

                fetched += len(studies)
                page_token = data.get("nextPageToken")
                if not page_token:
                    break

            except Exception as e:
                self.logger.warning(f"ClinicalTrials error: {e}")
                break

            time.sleep(self.config.rate_limit_delay)

        return documents

    def fetch_all(self) -> List[Document]:
        all_docs = []
        for q in self.CONDITION_QUERIES:
            docs = self.search(q)
            all_docs.extend(docs)
            time.sleep(self.config.rate_limit_delay)

        self.logger.info(f"ClinicalTrials.gov total: {len(all_docs)}")
        return all_docs


class DOAJFetcher:
    """
    Ingestion depuis DOAJ API (Directory of Open Access Journals).
    Multilingue.
    """

    BASE_URL = "https://doaj.org/api"

    def __init__(self, config: Config, session: requests.Session):
        self.config = config
        self.session = session
        self.logger = logging.getLogger("DOAJFetcher")

    SEARCH_QUERIES = [
        "obstetrics pregnancy fetal",
        "midwifery antenatal care",
        "preeclampsia gestational hypertension",
        "gestational diabetes mellitus",
        "postpartum hemorrhage",
        "perinatal mental health",
        "cardiotocography fetal monitoring",
    ]

    def search(self, query: str, max_results: int = 500) -> List[Document]:
        documents = []
        page = 1
        fetched = 0

        while fetched < max_results:
            params = {
                "page": page,
                "pageSize": 100,
            }

            try:
                resp = self.session.get(
                    f"{self.BASE_URL}/search/articles/{query}",
                    params=params, timeout=30
                )
                resp.raise_for_status()
                data = resp.json()

                results = data.get("results", [])
                if not results:
                    break

                for r in results:
                    bib = r.get("bibjson", {})

                    # Authors
                    authors = [a.get("name", "") for a in bib.get("author", [])[:10]]

                    # DOI
                    doi = ""
                    for identifier in bib.get("identifier", []):
                        if identifier.get("type") == "doi":
                            doi = identifier.get("id", "")
                            break

                    # Language
                    lang = bib.get("journal", {}).get("language", ["en"])
                    if isinstance(lang, list):
                        lang = lang[0] if lang else "en"

                    doc = Document(
                        id=f"doaj_{r.get('id', '')}",
                        title=bib.get("title", ""),
                        abstract=bib.get("abstract", ""),
                        authors=authors,
                        year=int(bib.get("year", 0) or 0),
                        journal=bib.get("journal", {}).get("title", ""),
                        doi=doi,
                        source_db="DOAJ",
                        language=lang,
                        url=bib.get("link", [{}])[0].get("url", "") if bib.get("link") else "",
                        license=bib.get("license", [{}])[0].get("type", "") if bib.get("license") else "",
                    )
                    documents.append(doc)

                fetched += len(results)
                page += 1

            except Exception as e:
                self.logger.warning(f"DOAJ error: {e}")
                break

            time.sleep(self.config.rate_limit_delay)

        return documents

    def fetch_all(self) -> List[Document]:
        all_docs = []
        per_query = self.config.max_per_source // len(self.SEARCH_QUERIES)

        for q in self.SEARCH_QUERIES:
            docs = self.search(q, max_results=per_query)
            all_docs.extend(docs)

        self.logger.info(f"DOAJ total: {len(all_docs)}")
        return all_docs


# ════════════════════════════════════════════════════════════════
# URLS STATIQUES — Guidelines et bases sans API REST
# ════════════════════════════════════════════════════════════════

STATIC_GUIDELINE_URLS = {
    "WHO": [
        {"url": "https://iris.who.int/server/api/core/bitstreams/8d39d33f-ca8b-4f57-9eda-293ee9b9bdbe/content", "title": "WHO Recommendations on Antenatal Care 2016", "lang": "en"},
        {"url": "https://iris.who.int/server/api/core/bitstreams/b2207ce1-6384-4d67-925a-881dfb2e7728/content", "title": "WHO Labour Care Guide", "lang": "en"},
        {"url": "https://apps.who.int/iris/rest/bitstreams/1090523/retrieve", "title": "WHO Maternal Health Guidelines", "lang": "en"},
    ],
    "NICE": [
        {"url": "https://www.nice.org.uk/guidance/ng201/resources/antenatal-care-pdf-66143709695941", "title": "NICE NG201 Antenatal Care", "lang": "en"},
        {"url": "https://www.nice.org.uk/guidance/ng133", "title": "NICE NG133 Hypertension in Pregnancy", "lang": "en"},
        {"url": "https://www.nice.org.uk/guidance/ng229", "title": "NICE NG229 Fetal Monitoring in Labour", "lang": "en"},
    ],
    "FIGO": [
        {"url": "https://www.sigo.it/wp-content/uploads/2024/05/Linee-Guida-FIGO_Intrapartum-Fetal-Monitoring.pdf", "title": "FIGO Intrapartum Fetal Monitoring Guidelines 2015", "lang": "en"},
    ],
    "HAS_CNGOF": [
        {"url": "https://cngof.fr/rpc/", "title": "CNGOF Recommandations pour la Pratique Clinique", "lang": "fr"},
        {"url": "https://www.has-sante.fr/jcms/fc_2875171/fr/liste-des-recommandations", "title": "HAS Liste des Recommandations", "lang": "fr"},
    ],
    "RCOG": [
        {"url": "https://www.rcog.org.uk/guidance/browse-all-guidance/green-top-guidelines/", "title": "RCOG Green-top Guidelines Index", "lang": "en"},
    ],
}


# ════════════════════════════════════════════════════════════════
# CHUNKING ET EMBEDDING
# ════════════════════════════════════════════════════════════════

class DocumentChunker:
    """Découpe les documents en chunks pour le RAG."""

    def __init__(self, chunk_size: int = 1500, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_document(self, doc: Document) -> List[Dict]:
        """Découpe un document en chunks avec métadonnées."""
        # Construire le texte complet
        text_parts = []
        if doc.title:
            text_parts.append(f"TITLE: {doc.title}")
        if doc.abstract:
            text_parts.append(f"ABSTRACT: {doc.abstract}")
        if doc.full_text:
            text_parts.append(f"FULL TEXT: {doc.full_text}")
        if doc.mesh_terms:
            text_parts.append(f"MESH TERMS: {', '.join(doc.mesh_terms)}")

        full_text = "\n\n".join(text_parts)

        if not full_text.strip():
            return []

        # Chunking
        chunks = []
        if len(full_text) <= self.chunk_size:
            chunks.append(full_text)
        else:
            start = 0
            while start < len(full_text):
                end = start + self.chunk_size
                # Trouver une fin de phrase propre
                if end < len(full_text):
                    for sep in [". ", ".\n", "\n\n", "\n", " "]:
                        last_sep = full_text[start:end].rfind(sep)
                        if last_sep > self.chunk_size // 2:
                            end = start + last_sep + len(sep)
                            break

                chunk_text = full_text[start:end].strip()
                if chunk_text:
                    chunks.append(chunk_text)

                start = end - self.chunk_overlap
                if start >= len(full_text):
                    break

        # Construire les résultats avec métadonnées
        result = []
        for i, chunk in enumerate(chunks):
            result.append({
                "id": f"{doc.id}_chunk_{i}",
                "text": chunk,
                "metadata": {
                    "doc_id": doc.id,
                    "title": doc.title[:200],
                    "authors": ", ".join(doc.authors[:3]),
                    "year": doc.year,
                    "journal": doc.journal,
                    "doi": doc.doi,
                    "pmid": doc.pmid,
                    "source_db": doc.source_db,
                    "language": doc.language,
                    "url": doc.url,
                    "mesh_terms": ", ".join(doc.mesh_terms[:10]),
                    "chunk_index": i,
                    "total_chunks": len(chunks),
                    "content_hash": doc.content_hash,
                }
            })

        return result


class VectorStoreManager:
    """Gestion du vector store (ChromaDB par défaut)."""

    def __init__(self, config: Config):
        self.config = config
        self.logger = logging.getLogger("VectorStore")

    def initialize_chroma(self):
        """Initialise ChromaDB."""
        try:
            import chromadb
            from chromadb.config import Settings

            client = chromadb.PersistentClient(
                path=self.config.vector_dir,
                settings=Settings(anonymized_telemetry=False)
            )

            collection = client.get_or_create_collection(
                name=self.config.collection_name,
                metadata={
                    "description": "Obstetric & Fetal Health Knowledge Base",
                    "created": datetime.now().isoformat(),
                    "embedding_model": self.config.embedding_model,
                    "hnsw:space": "cosine",
                }
            )

            self.logger.info(f"ChromaDB initialized: {self.config.vector_dir}")
            return client, collection

        except ImportError:
            self.logger.error("chromadb not installed. Run: pip install chromadb")
            raise

    def initialize_qdrant(self):
        """Initialise Qdrant (alternative)."""
        try:
            from qdrant_client import QdrantClient
            from qdrant_client.models import VectorParams, Distance

            client = QdrantClient(path=self.config.vector_dir)

            # Créer collection si nécessaire
            collections = [c.name for c in client.get_collections().collections]
            if self.config.collection_name not in collections:
                client.create_collection(
                    collection_name=self.config.collection_name,
                    vectors_config=VectorParams(
                        size=384,  # MiniLM-L6-v2
                        distance=Distance.COSINE,
                    )
                )

            self.logger.info(f"Qdrant initialized: {self.config.vector_dir}")
            return client

        except ImportError:
            self.logger.error("qdrant-client not installed. Run: pip install qdrant-client")
            raise

    def embed_and_store_chroma(self, chunks: List[Dict], collection):
        """Embed et stocke les chunks dans ChromaDB."""
        batch_size = 500

        for i in range(0, len(chunks), batch_size):
            batch = chunks[i:i + batch_size]

            ids = [c["id"] for c in batch]
            documents = [c["text"] for c in batch]
            metadatas = [c["metadata"] for c in batch]

            # ChromaDB gère l'embedding automatiquement avec son modèle par défaut
            # Pour un modèle custom, utiliser embedding_function
            collection.add(
                ids=ids,
                documents=documents,
                metadatas=metadatas,
            )

            self.logger.info(f"  Stored batch {i//batch_size + 1}: {len(batch)} chunks")


# ════════════════════════════════════════════════════════════════
# PIPELINE PRINCIPAL
# ════════════════════════════════════════════════════════════════

class ObstetricRAGPipeline:
    """Pipeline d'ingestion RAG complet."""

    AVAILABLE_SOURCES = [
        "pubmed", "openalex", "europepmc", "who_iris",
        "clinicaltrials", "doaj",
    ]

    def __init__(self, config: Config):
        self.config = config
        self.session = create_session()
        self.logger = logging.getLogger("Pipeline")
        self.chunker = DocumentChunker(config.chunk_size, config.chunk_overlap)
        self.vs_manager = VectorStoreManager(config)

        # Créer les répertoires
        for d in [config.output_dir, config.raw_dir, config.processed_dir,
                  config.vector_dir, config.log_dir]:
            Path(d).mkdir(parents=True, exist_ok=True)

    def _get_fetcher(self, source: str):
        """Factory de fetchers."""
        fetchers = {
            "pubmed": PubMedFetcher,
            "openalex": OpenAlexFetcher,
            "europepmc": EuropePMCFetcher,
            "who_iris": WHOIRISFetcher,
            "clinicaltrials": ClinicalTrialsFetcher,
            "doaj": DOAJFetcher,
        }
        cls = fetchers.get(source)
        if cls:
            return cls(self.config, self.session)
        raise ValueError(f"Unknown source: {source}")

    def fetch_source(self, source: str) -> List[Document]:
        """Récupère les documents d'une source."""
        self.logger.info(f"{'='*60}")
        self.logger.info(f"FETCHING: {source.upper()}")
        self.logger.info(f"{'='*60}")

        fetcher = self._get_fetcher(source)
        docs = fetcher.fetch_all()

        # Sauvegarder les données brutes
        raw_path = Path(self.config.raw_dir) / f"{source}_raw.jsonl"
        with open(raw_path, "w", encoding="utf-8") as f:
            for doc in docs:
                f.write(json.dumps(asdict(doc), ensure_ascii=False) + "\n")

        self.logger.info(f"{source}: {len(docs)} documents saved to {raw_path}")
        return docs

    def deduplicate(self, documents: List[Document]) -> List[Document]:
        """Déduplique par DOI, PMID ou hash de contenu."""
        seen = set()
        unique = []

        for doc in documents:
            keys = []
            if doc.doi:
                keys.append(f"doi:{doc.doi}")
            if doc.pmid:
                keys.append(f"pmid:{doc.pmid}")
            keys.append(f"hash:{doc.content_hash}")

            if not any(k in seen for k in keys):
                for k in keys:
                    seen.add(k)
                unique.append(doc)

        self.logger.info(f"Deduplication: {len(documents)} → {len(unique)} unique documents")
        return unique

    def run(self, sources: List[str] = None):
        """Exécute le pipeline complet."""
        if sources is None or "all" in sources:
            sources = self.AVAILABLE_SOURCES

        start_time = datetime.now()
        self.logger.info(f"Pipeline started at {start_time.isoformat()}")
        self.logger.info(f"Sources: {sources}")
        self.logger.info(f"Max per source: {self.config.max_per_source}")

        # 1. FETCH
        all_documents = []
        for source in sources:
            try:
                docs = self.fetch_source(source)
                all_documents.extend(docs)
            except Exception as e:
                self.logger.error(f"Error fetching {source}: {e}")
                continue

        self.logger.info(f"\nTotal documents fetched: {len(all_documents)}")

        # 2. DEDUPLICATE
        unique_docs = self.deduplicate(all_documents)

        # 3. CHUNK
        self.logger.info("\nChunking documents...")
        all_chunks = []
        for doc in unique_docs:
            chunks = self.chunker.chunk_document(doc)
            all_chunks.extend(chunks)

        self.logger.info(f"Total chunks: {len(all_chunks)}")

        # 4. Sauvegarder les chunks (format compatible LlamaIndex / LangChain)
        chunks_path = Path(self.config.processed_dir) / "chunks.jsonl"
        with open(chunks_path, "w", encoding="utf-8") as f:
            for chunk in all_chunks:
                f.write(json.dumps(chunk, ensure_ascii=False) + "\n")

        self.logger.info(f"Chunks saved to {chunks_path}")

        # 5. EMBED & STORE (si ChromaDB disponible)
        try:
            if self.config.vector_store == "chroma":
                client, collection = self.vs_manager.initialize_chroma()
                self.vs_manager.embed_and_store_chroma(all_chunks, collection)
                self.logger.info(f"Vector store populated: {collection.count()} total vectors")
        except ImportError:
            self.logger.warning("Vector store not available. Chunks saved as JSONL for later ingestion.")

        # 6. RAPPORT
        elapsed = (datetime.now() - start_time).total_seconds()
        report = {
            "timestamp": datetime.now().isoformat(),
            "elapsed_seconds": elapsed,
            "sources_processed": sources,
            "total_documents_fetched": len(all_documents),
            "unique_documents": len(unique_docs),
            "total_chunks": len(all_chunks),
            "languages": list(set(d.language for d in unique_docs)),
            "year_range": {
                "min": min((d.year for d in unique_docs if d.year > 0), default=0),
                "max": max((d.year for d in unique_docs if d.year > 0), default=0),
            },
            "by_source": {},
        }

        for source in sources:
            count = sum(1 for d in unique_docs if d.source_db.lower().replace("_", "").replace(" ", "")
                       in source.lower().replace("_", ""))
            report["by_source"][source] = count

        report_path = Path(self.config.output_dir) / "ingestion_report.json"
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

        self.logger.info(f"\n{'='*60}")
        self.logger.info(f"PIPELINE COMPLETE")
        self.logger.info(f"{'='*60}")
        self.logger.info(f"Documents: {len(unique_docs)}")
        self.logger.info(f"Chunks: {len(all_chunks)}")
        self.logger.info(f"Languages: {report['languages']}")
        self.logger.info(f"Elapsed: {elapsed:.1f}s")
        self.logger.info(f"Report: {report_path}")

        return report


# ════════════════════════════════════════════════════════════════
# EXPORT → Next.js knowledge-chunks (RAG lexical du frontend)
# ════════════════════════════════════════════════════════════════

def load_jsonl_chunks(path: Path) -> List[dict]:
    rows: List[dict] = []
    if not path.exists():
        return rows
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def pipeline_chunk_to_frontend_row(c: dict) -> Optional[dict]:
    """Convertit un chunk pipeline → entrée knowledge-chunks.json du frontend."""
    meta = c.get("metadata") or {}
    tid = str(c.get("id", "unk"))
    safe_id = "".join(ch if ch.isalnum() or ch in "-_" else "_" for ch in tid)[:180]
    if not safe_id:
        safe_id = "ingest_chunk"
    authors = meta.get("authors") or ""
    if not isinstance(authors, str):
        authors = str(authors)
    year = meta.get("year") or 0
    try:
        year = int(year)
    except (TypeError, ValueError):
        year = 0
    src = str(meta.get("source_db") or "RAG ingest")[:120]
    title = (meta.get("title") or "")[:400]
    text = (c.get("text") or "").strip()
    if not text:
        return None
    return {
        "id": safe_id,
        "source": src,
        "source_id": f"ing_{hashlib.md5(safe_id.encode()).hexdigest()[:12]}",
        "title": title,
        "authors": authors[:200],
        "year": year,
        "chunk_text": text[:8000],
        "metadata": {
            "type": "literature",
            "ingested": True,
            "doi": meta.get("doi") or "",
            "pmid": meta.get("pmid") or "",
            "url": meta.get("url") or "",
            "language": meta.get("language") or "",
        },
    }


def export_frontend_knowledge_chunks(
    chunks_jsonl: Path,
    out_path: Path,
    merge_from: Optional[Path] = None,
) -> tuple[int, int]:
    """
    Écrit un JSON array compatible avec frontend/data/knowledge-chunks*.json.
    Si merge_from est fourni, concatène (déduplication par id, les existants gardés).
    Retourne (nombre de chunks ingérés écrits, total lignes dans le fichier sortie).
    """
    raw = load_jsonl_chunks(chunks_jsonl)
    new_rows: List[dict] = []
    seen_new: set = set()
    for c in raw:
        row = pipeline_chunk_to_frontend_row(c)
        if row and row["id"] not in seen_new:
            seen_new.add(row["id"])
            new_rows.append(row)

    existing: List[dict] = []
    if merge_from and merge_from.exists():
        existing = json.loads(merge_from.read_text(encoding="utf-8"))
        if not isinstance(existing, list):
            existing = []

    if merge_from:
        merge_ids = {r.get("id") for r in existing if isinstance(r, dict) and r.get("id")}
        merged = list(existing)
        for r in new_rows:
            if r["id"] not in merge_ids:
                merged.append(r)
                merge_ids.add(r["id"])
        out_payload = merged
    else:
        out_payload = new_rows

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out_payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return len(new_rows), len(out_payload)


# ════════════════════════════════════════════════════════════════
# POINT D'ENTRÉE
# ════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description="Obstetric RAG Knowledge Base Ingestion Pipeline"
    )
    parser.add_argument(
        "--sources", nargs="+", default=["all"],
        choices=["all"] + ObstetricRAGPipeline.AVAILABLE_SOURCES,
        help="Sources to ingest (default: all)"
    )
    parser.add_argument(
        "--max-per-source", type=int, default=10000,
        help="Maximum documents per source (default: 10000)"
    )
    parser.add_argument(
        "--chunk-size", type=int, default=1500,
        help="Chunk size in characters (default: 1500)"
    )
    parser.add_argument(
        "--vector-store", choices=["chroma", "qdrant", "none"], default="chroma",
        help="Vector store backend (default: chroma)"
    )
    parser.add_argument(
        "--embedding-model", type=str, default="sentence-transformers/all-MiniLM-L6-v2",
        help="Embedding model (default: all-MiniLM-L6-v2)"
    )
    parser.add_argument(
        "--output-dir", type=str, default="./rag_data",
        help="Output directory (default: ./rag_data)"
    )
    parser.add_argument(
        "--verbose", "-v", action="store_true",
        help="Verbose logging"
    )
    parser.add_argument(
        "--frontend-out",
        type=str,
        default="",
        help="Chemin sortie JSON (ex: ../frontend/data/knowledge-chunks-ingested.json)",
    )
    parser.add_argument(
        "--frontend-merge",
        type=str,
        default="",
        help="Optionnel : JSON existant à fusionner (ex: ../frontend/data/knowledge-chunks.json)",
    )

    args = parser.parse_args()
    load_dotenv()

    out_base = Path(args.output_dir)
    out_base.mkdir(parents=True, exist_ok=True)
    log_dir = out_base / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)

    # Setup logging
    log_level = logging.DEBUG if args.verbose else logging.INFO
    log_file = log_dir / f"ingestion_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s [%(name)-20s] %(levelname)-8s %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler(log_file, mode="w", encoding="utf-8"),
        ],
    )

    # Config
    config = Config(
        max_per_source=args.max_per_source,
        chunk_size=args.chunk_size,
        vector_store=args.vector_store,
        embedding_model=args.embedding_model,
        output_dir=args.output_dir,
        raw_dir=f"{args.output_dir}/raw",
        processed_dir=f"{args.output_dir}/processed",
        vector_dir=f"{args.output_dir}/vectorstore",
        log_dir=f"{args.output_dir}/logs",
    )

    # Créer répertoires
    for d in [config.output_dir, config.raw_dir, config.processed_dir,
              config.vector_dir, config.log_dir]:
        Path(d).mkdir(parents=True, exist_ok=True)

    # Run
    pipeline = ObstetricRAGPipeline(config)
    report = pipeline.run(sources=args.sources)

    print(f"\n✓ Ingestion terminée : {report['unique_documents']} documents, {report['total_chunks']} chunks")
    print(f"✓ Langues : {report['languages']}")

    if args.frontend_out:
        chunks_jsonl = Path(config.processed_dir) / "chunks.jsonl"
        merge_path = Path(args.frontend_merge) if args.frontend_merge else None
        n_new, n_total = export_frontend_knowledge_chunks(
            chunks_jsonl,
            Path(args.frontend_out),
            merge_from=merge_path,
        )
        print(f"✓ Export frontend : {n_new} chunks ingérés → {args.frontend_out} (total {n_total} entrées)")


if __name__ == "__main__":
    main()

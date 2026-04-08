# Pipeline d’ingestion RAG obstétrique

Alimente la base **lexicale** du frontend Next.js (`data/knowledge-chunks-ingested.json`), utilisée par `/api/assistant/chat` et `/api/knowledge/search` avec `knowledge-chunks.json`.

## Installation

```bash
cd rag_ingest
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-min.txt          # sans Chroma
# ou
pip install -r requirements.txt             # + chromadb + sentence-transformers + pypdf
cp .env.example .env                        # optionnel : NCBI_API_KEY, etc.
```

## Test rapide (OpenAlex uniquement, sans vector store)

```bash
python ingest_obstetric_rag.py \
  --sources openalex \
  --max-per-source 40 \
  --vector-store none \
  --output-dir ./rag_data \
  --frontend-out ../frontend/data/knowledge-chunks-ingested.json
```

## Ingestion complète + Chroma

```bash
pip install -r requirements.txt
python ingest_obstetric_rag.py --sources all --max-per-source 500 \
  --vector-store chroma \
  --frontend-out ../frontend/data/knowledge-chunks-ingested.json
```

## Fusion dans un seul fichier (optionnel)

```bash
python ingest_obstetric_rag.py --sources pubmed --max-per-source 200 \
  --vector-store none \
  --frontend-out ../frontend/data/knowledge-chunks-merged.json \
  --frontend-merge ../frontend/data/knowledge-chunks.json
```

## Catalogue des sources

Voir [README_SOURCES.md](./README_SOURCES.md).

## Données générées

- `rag_data/raw/` — JSONL par source  
- `rag_data/processed/chunks.jsonl` — chunks avant export  
- `rag_data/ingestion_report.json` — rapport  
- `rag_data/vectorstore/` — Chroma si activé  

Ajoutez `rag_data/` au `.gitignore` local si vous ne versionnez pas les corpus.

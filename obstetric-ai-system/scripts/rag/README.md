# RAG Knowledge Base

- **schema.sql** : table `knowledge_chunks` (pgvector). Run once Postgres has the `vector` extension.
- **ethical-crawler.js** : agent crawler éthique permanent pour **toutes** les sources internet (Europe PMC, WHO, Cochrane, NICE, FIGO, HAS, etc.). Rate limit, User-Agent identifié, respect de robots.txt, cache disque, retry avec backoff, liste d’origines autorisées. Voir **CRAWLER_POLICY.md**.
- **ingest** : run `node scripts/rag/ingest-europe-pmc.js` depuis la racine du repo. Utilise le crawler éthique pour chaque requête. Écrit dans `frontend/data/knowledge-chunks.json`. Pour les futurs pipelines (WHO, Cochrane, PMC, NICE, FIGO), utiliser systématiquement `createEthicalCrawler()` depuis `ethical-crawler.js` au lieu de `fetch` direct.
- **Permanence** : exécuter les scripts d’ingestion en cron/scheduled job (ex. hebdo) ; le crawler s’applique à chaque run.

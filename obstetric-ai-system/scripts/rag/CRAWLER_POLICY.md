# Politique du crawler éthique

L’agent **ObstetricAI-EthicalCrawler** est le point d’accès unique pour toutes les requêtes HTTP vers des sources internet (Europe PMC, WHO, Cochrane, NICE, FIGO, etc.) dans le cadre de l’alimentation de la base de connaissances RAG.

## Principes

1. **Identification**  
   User-Agent fixe : `ObstetricAI-EthicalCrawler/1.0 (research; knowledge-base; +URL_projet)`. Les serveurs peuvent nous identifier et nous contacter.

2. **Domaines autorisés**  
   Seules les origines listées dans le module (EBI/Europe PMC, NCBI, WHO, NICE, Cochrane, FIGO, HAS, etc.) sont autorisées. Toute autre origine est refusée par défaut.

3. **Robots.txt**  
   Avant chaque GET, le crawler vérifie `robots.txt` du domaine. Si l’URL est en `Disallow`, la requête n’est pas envoyée.

4. **Rate limiting**  
   Délai minimum configurable entre deux requêtes par domaine (défaut 1 s). Aucune concurrence agressive.

5. **Cache**  
   Les réponses GET peuvent être mises en cache sur disque (`.cache/`) pour limiter les re-requêtes pendant les ingestions.

6. **Retry**  
   En cas de 429 (Too Many Requests) ou 5xx, retentative avec backoff exponentiel, puis échec propre.

7. **Audit**  
   Chaque requête (et cache hit / robots disallow) peut être journalisée dans `.crawler-audit.log` pour traçabilité.

## Utilisation

Tous les scripts d’ingestion doivent utiliser le crawler au lieu de `fetch` direct :

```js
const { createEthicalCrawler } = require('./ethical-crawler');
const crawler = createEthicalCrawler({ minDelayMs: 1500, cacheDir: './.cache' });
const res = await crawler.fetch(url);
const data = await res.json();
```

## Exécution « permanente »

- **Cron / scheduled job** : lancer les scripts d’ingestion (ex. `ingest-europe-pmc.js`) à intervalle régulier (ex. hebdo) depuis la racine du repo. Le crawler s’applique à chaque run.
- **Pas de démon** : l’agent est un module appelé à chaque exécution des scripts ; la permanence est assurée par l’usage systématique de ce module pour toute source internet.

## Fichiers générés

- `scripts/rag/.cache/` : cache des réponses (optionnel).
- `scripts/rag/.crawler-audit.log` : log des requêtes (optionnel).

À ajouter en `.gitignore` : `scripts/rag/.cache/`, `scripts/rag/.crawler-audit.log`.

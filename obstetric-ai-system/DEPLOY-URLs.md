# URLs d'accès après déploiement

Le VPS `51.77.144.54` héberge deux applications :

| Application | URL | Port |
|---|---|---|
| AEGIS CARE (médecine thérapeutique) | http://51.77.144.54 | 80 |
| **Obstetric AI (santé fœtale)** | **http://51.77.144.54:8090** | **8090** |

## Accès à Obstetric AI

Ouvrir dans le navigateur : **http://51.77.144.54:8090**

## Erreurs fréquentes

- `http://51.77.144.54` (sans port) -> ouvre AEGIS CARE, pas l'app obstétricale
- `http://frontend` -> DNS_PROBE_FINISHED_NXDOMAIN (nom Docker interne, pas un nom de domaine)

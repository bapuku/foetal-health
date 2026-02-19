# ADR-001: Choix PostgreSQL vs MongoDB pour FHIR

## Contexte
Stockage des ressources FHIR R4 et des logs d'audit.

## Décision
PostgreSQL 16 avec extension pgvector.

## Raisons
- HAPI FHIR supporte nativement PostgreSQL.
- JSONB pour champs FHIR flexibles et indexation.
- pgvector pour recherche sémantique (embeddings connaissances).
- Conformité HDS et écosystème OVH.

## Conséquences
- Schéma relationnel + JSONB; migrations avec Flyway ou manuelles.
- MongoDB écarté pour ce projet (interop HAS/FHIR orienté SQL).

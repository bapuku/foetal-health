# Runbook: Database (PostgreSQL) down

## Détection
- Alertes Prometheus/Alertmanager : `PostgresqlDown`, health check failed.
- Symptômes : erreurs 503 sur agents, timeouts FHIR.

## Actions
1. Vérifier les pods PostgreSQL : `kubectl get pods -n obs-prod -l app=postgresql`.
2. Consulter les logs : `kubectl logs -n obs-prod -l app=postgresql --tail=200`.
3. Si crash loop : vérifier PVC et événements `kubectl describe pod -n obs-prod <postgresql-pod>`.
4. Redémarrer le StatefulSet si nécessaire : `kubectl rollout restart statefulset/postgresql -n obs-prod`.
5. Si corruption : restaurer depuis le dernier backup S3 (voir runbook backup-restore).

## Escalade
- Si RTO dépassé (4h) ou perte de données : alerter responsable infrastructure et DSI.

# Dossier technique EU MDR 2017/745 - Dispositif médical Classe IIb

## Description du dispositif
Plateforme agentique d’intelligence obstétricale pour la surveillance fœto-maternelle et l’aide à la décision. Classification FIGO CTG, scores de risque (RCIU, césarienne, Apgar), conformité aux recommandations (HAS, FIGO, CNGOF).

## Gestion des risques (ISO 14971)
- Analyse AMDEC documentée.
- Risques résiduels acceptés avec justification et surveillance post-commercialisation.

## Vérification et validation
- Tests unitaires et d’intégration (pytest).
- Validation clinique : étude pilote 100 accouchements, κ > 0,8.
- Tests de performance (Locust), drift (Evidently AI).

## Post-market surveillance
- Monitoring continu des métriques (AUC, sensibilité/spécificité).
- Vigilance : déclaration ANSM sous 15 jours pour incidents graves.

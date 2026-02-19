# Conformité EU AI Act - Système à haut risque (Annexe III §5 Santé)

## Documentation technique
- Jeu de données d’entraînement et de validation documenté.
- Biais et équité : analyses par sous-groupes (âge, parité).
- Robustesse : tests adversariaux, monitoring du drift.

## Human oversight
- HITL obligatoire pour CTG pathologique et Apgar ≤ 6.
- Chaîne d’escalade et timeouts définis.

## Transparence
- Explications fournies (SHAP, GradCAM, LIME).
- Références aux guidelines (HAS, FIGO, CNGOF) dans les sorties.

## Logs
- Conservation 10 ans minimum (chaîne de hash SHA-256, stockage froid).

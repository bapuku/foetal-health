# Étude pilote clinique

## Objectif
Valider la concordance IA–cliniciens (κ > 0,8) et l’utilité en conditions réelles sur 100 accouchements (maternité niveau 2/3).

## Critères d’inclusion
- Accouchement avec monitoring CTG et données nécessaires aux agents.
- Consentement patient et accord CPP obtenus.

## Métriques
- **Concordance** : κ de Cohen (accord IA vs décision clinicien) > 0,8.
- **Sécurité** : 0 faux négatif sur CTG pathologique.
- **Utilité** : réduction du temps de décision (cible −30 %) et satisfaction cliniciens ≥ 4/5.

## Déroulement
1. Déploiement environnement staging hospitalier.
2. Formation de 10 utilisateurs (obstétriciens, sages-femmes).
3. Collecte sur 100 accouchements avec validation HITL.
4. Analyse statistique et rapport.
5. Itérations sur le système selon feedback.

## Fichiers à compléter
- `protocol.pdf` : protocole soumis au CPP.
- `consent_form.pdf` : formulaire de consentement patient.
- `analysis_template.R` ou `.py` : script d’analyse (κ, sensibilité, spécificité).

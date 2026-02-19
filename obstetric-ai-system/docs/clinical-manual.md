# Manuel utilisateur clinicien - Obstetric AI

## Usage prévu
Surveillance fœto-maternelle et aide à la décision. Ne remplace pas le jugement clinique.

## Limitations
- Aucun diagnostic final autonome.
- Aucune prescription sans approbation humaine.
- Domaine strictement obstétrical et néonatal.

## Interprétation
- **CTG** : classification FIGO 2015 (Normal/Suspect/Pathologique). Alertes si Pathologique ou Suspect selon seuils.
- **Scores de risque** : RCIU, césarienne, Apgar – à interpréter avec IC95%.
- **Explainability** : onglets SHAP/GradCAM pour comprendre les facteurs contributifs.

## Human-in-the-loop (HITL)
- CTG Pathologique → pause et notification (obstétricien).
- Apgar 5 min ≤ 6 → pause et notification (pédiatre).
- Validation obligatoire avant poursuite du parcours.

## Sécurité et confidentialité
- Données chiffrées (AES-256 au repos, TLS 1.3 en transit).
- Consentements suivis (FHIR Consent). Droit à l’effacement avec conservation de l’audit.

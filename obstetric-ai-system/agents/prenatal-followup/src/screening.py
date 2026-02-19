"""
Dépistages : T21 (3 paliers HAS 2017 / arrêté déc 2018), DG (IADPSG), SGB (34-38 SA).
"""

from typing import Any

# T21 : risque < 1/1000 = surveillance standard ; 1/1000 à 1/51 = DPNI ; >= 1/50 = caryotype
T21_SEUIL_FAIBLE = 1 / 1000   # risque <= ceci = palier faible
T21_SEUIL_ELEVE = 1 / 50      # risque >= ceci = palier élevé (caryotype direct)

# HGPO 75 g IADPSG (g/L)
HGPO_H0_MAX = 0.92
HGPO_H1_MAX = 1.80
HGPO_H2_MAX = 1.53

# SGB : fenêtre recommandée 35-37 SA
GBS_SA_MIN, GBS_SA_MAX = 34, 38


def evaluate_t21(risque_combine: float) -> dict[str, Any]:
    """
    risque_combine : probabilité (ex. 1/2500 = 0.0004).
    Retourne palier, indication DPNI, indication caryotype, message.
    """
    if risque_combine >= T21_SEUIL_ELEVE:
        return {
            "palier": "eleve",
            "indication_dpni": False,
            "indication_caryotype": True,
            "message": "Risque ≥ 1/50 : proposition directe de caryotype fœtal (amniocentèse ou biopsie villosités choriales). Consentement écrit requis.",
            "recommandation": "Consultation conseil génétique. Caryotype après 15 SA (amniocentèse) ou ~12 SA (BVC).",
        }
    if T21_SEUIL_FAIBLE < risque_combine < T21_SEUIL_ELEVE:
        return {
            "palier": "intermediaire",
            "indication_dpni": True,
            "indication_caryotype": False,
            "message": "Risque entre 1/1000 et 1/51 : proposition du DPNI (ADN libre circulant), remboursé. Consentement écrit requis.",
            "recommandation": "Proposer DPNI. Si DPNI positif, proposer caryotype.",
        }
    return {
        "palier": "faible",
        "indication_dpni": False,
        "indication_caryotype": False,
        "message": "Risque < 1/1000 : surveillance standard, pas de test supplémentaire.",
        "recommandation": "Poursuite du suivi habituel.",
    }


def evaluate_diabetes_screening(
    glycemie_jeun: float | None, h0: float, h1: float, h2: float, unite: str = "g/L"
) -> dict[str, Any]:
    """
    Critères IADPSG (CNGOF/SFD 2010). Une seule valeur dépassée = DG.
    Si unite == "mmol/L", conversion : 0.92 g/L = 5.1 mmol/L, 1.80 = 10.0, 1.53 = 8.5.
    """
    if unite == "mmol/L":
        # Convertir en g/L pour comparaison
        h0, h1, h2 = h0 / 5.55, h1 / 5.55, h2 / 5.55  # approx
        if glycemie_jeun is not None:
            glycemie_jeun = glycemie_jeun / 5.55
    anomalies = []
    if glycemie_jeun is not None and glycemie_jeun >= HGPO_H0_MAX:
        anomalies.append(f"Glycémie à jeun {glycemie_jeun:.2f} ≥ {HGPO_H0_MAX} g/L")
    if h0 >= HGPO_H0_MAX:
        anomalies.append(f"H0 {h0:.2f} ≥ {HGPO_H0_MAX} g/L")
    if h1 >= HGPO_H1_MAX:
        anomalies.append(f"H1 {h1:.2f} ≥ {HGPO_H1_MAX} g/L")
    if h2 >= HGPO_H2_MAX:
        anomalies.append(f"H2 {h2:.2f} ≥ {HGPO_H2_MAX} g/L")

    diagnostic_dg = len(anomalies) > 0
    message = "Diabète gestationnel (IADPSG) : " + "; ".join(anomalies) if diagnostic_dg else "HGPO 75 g dans les normes."
    return {
        "diagnostic_dg": diagnostic_dg,
        "anomalies": anomalies,
        "message": message,
        "seuils_IADPSG_g_L": {"h0": HGPO_H0_MAX, "h1": HGPO_H1_MAX, "h2": HGPO_H2_MAX},
        "recommandation": "Prise en charge diabétologique et diététique. Autosurveillance glycémique." if diagnostic_dg else "Surveillance standard.",
    }


def evaluate_gbs_screening(sa_prelevement: float, resultat: str) -> dict[str, Any]:
    """
    Dépistage streptocoque B : prélèvement 34-38 SA (idéal 35-37). Résultat positif → antibioprophylaxie à l'accouchement.
    """
    timing_ok = GBS_SA_MIN <= sa_prelevement <= GBS_SA_MAX
    positif = resultat.lower() in ("positif", "positive", "+")
    return {
        "timing_ok": timing_ok,
        "resultat": resultat,
        "portage": positif,
        "antibioprophylaxie_prevue": positif,
        "message": f"Prélèvement à {sa_prelevement} SA (fenêtre 34-38 SA : {'conforme' if timing_ok else 'hors fenêtre'}). SGB {'positif' if positif else 'négatif'} → {'antibiothérapie per-partum recommandée.' if positif else 'pas d\'antibiothérapie systématique.'}",
        "recommandation": "Antibiothérapie per-partum (pénicilline G ou amoxicilline) si SGB positif, selon protocole local." if positif else "Pas d'antibiothérapie préventive.",
    }

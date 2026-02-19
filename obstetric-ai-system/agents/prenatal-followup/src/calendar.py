"""
Calendrier des 7 consultations obligatoires + EPP + 3 échographies (CSP R2122-1, R2122-2).
"""

from typing import Any


# C1 avant 15 SA (idéalement avant 10 SA), puis mensuel du 4e au 9e mois
CONSULTATIONS_SA = [
    {"num": 1, "sa_min": 0, "sa_max": 15, "label": "1ère consultation (avant 15 SA)"},
    {"num": 2, "sa_min": 16, "sa_max": 20, "label": "2e consultation (4e mois)"},
    {"num": 3, "sa_min": 20, "sa_max": 24, "label": "3e consultation (5e mois)"},
    {"num": 4, "sa_min": 24, "sa_max": 28, "label": "4e consultation (6e mois)"},
    {"num": 5, "sa_min": 28, "sa_max": 32, "label": "5e consultation (7e mois)"},
    {"num": 6, "sa_min": 32, "sa_max": 36, "label": "6e consultation (8e mois)"},
    {"num": 7, "sa_min": 37, "sa_max": 42, "label": "7e consultation (9e mois)"},
]

# EPP obligatoire depuis mai 2020 (avant 4e mois en pratique)
EPP_SA = {"sa_min": 0, "sa_max": 20, "label": "Entretien prénatal précoce (EPP)"}

# 3 échographies recommandées (non strictement obligatoires mais standard)
ECHO_T1 = {"sa_min": 11, "sa_max": 13 + 6/7, "label": "Échographie T1 (datation, CN)"}
ECHO_T2 = {"sa_min": 20, "sa_max": 25, "label": "Échographie T2 (morphologique)"}
ECHO_T3 = {"sa_min": 30, "sa_max": 35, "label": "Échographie T3 (croissance)"}


def get_calendar_template() -> list[dict[str, Any]]:
    """Retourne le template du calendrier (items avec SA cibles, sans statut)."""
    items = []
    # EPP
    items.append({
        "id": "epp",
        "type": "epp",
        "label": EPP_SA["label"],
        "saCibleMin": EPP_SA["sa_min"],
        "saCibleMax": EPP_SA["sa_max"],
    })
    # 7 consultations
    for c in CONSULTATIONS_SA:
        items.append({
            "id": f"c{c['num']}",
            "type": "consultation",
            "label": c["label"],
            "consultationNumber": c["num"],
            "saCibleMin": c["sa_min"],
            "saCibleMax": c["sa_max"],
        })
    # 3 échos
    for i, e in enumerate([ECHO_T1, ECHO_T2, ECHO_T3], 1):
        items.append({
            "id": f"echo_t{i}",
            "type": f"echographie_t{i}",
            "label": e["label"],
            "saCibleMin": e["sa_min"],
            "saCibleMax": e["sa_max"],
        })
    return items


def check_calendar_compliance(
    items: list[dict[str, Any]], sa_courante: float
) -> tuple[bool, list[str], list[str]]:
    """
    Vérifie la conformité au calendrier CSP.
    items: liste d'items avec saCibleMin, saCibleMax, status, dateRealisee, etc.
    Retourne (conforme, liste_examens_en_retard, liste_recommandations).
    """
    en_retard = []
    recommandations = []
    conforme = True

    for item in items:
        sa_max = item.get("saCibleMax") or item.get("sa_cible_max")
        status = item.get("status")
        label = item.get("label") or item.get("id", "")

        if status == "realisee":
            continue
        if status == "na":
            continue

        # Si pas encore réalisé et qu'on a dépassé la fenêtre SA max
        if sa_max is not None and sa_courante > sa_max:
            en_retard.append(label)
            conforme = False
            recommandations.append(f"Réaliser au plus tôt : {label} (fenêtre dépassée).")

    return conforme, en_retard, recommandations

"""
Normes biologiques et seuils cliniques adaptés à la grossesse (France).
Référentiels : HAS, CNGOF/SFD 2010 (diabète gestationnel IADPSG), CSP.
"""

from typing import Any


def _trimestre_from_sa(sa: float) -> int:
    if sa < 15:
        return 1
    if sa < 28:
        return 2
    return 3


# Hémoglobine (g/dL) : T1 11-14, T2 10.5-14 (hémodilution), T3 11-14
HEMOGLOBINE = {
    1: {"min": 11.0, "max": 14.0},
    2: {"min": 10.5, "max": 14.0},
    3: {"min": 11.0, "max": 14.0},
}

# Plaquettes (G/L) : < 150 thrombopénie, < 100 investigation, < 75-80 CI péridurale
PLAQUETTES_MIN = 150

# Ferritine (µg/L) : > 30 réserves suffisantes
FERRITINE_MIN = 30

# Glycémie à jeun (g/L) : < 0,92 normal ; >= 0,92 DG ; >= 1,26 diabète préexistant
GLYCEMIE_JEUN_MAX_NORMALE = 0.92
GLYCEMIE_JEUN_DIABETE = 1.26

# HGPO 75 g (IADPSG) g/L : une valeur dépassée = DG
HGPO_IADPSG = {"h0": 0.92, "h1": 1.80, "h2": 1.53}

# Protéinurie 24 h (mg/24h) : >= 300 pathologique
PROTEINURIE_24H_MAX = 300

# TSH (mUI/L) : 0,1-4,0 tous trimestres (HAS 2023)
TSH = {"min": 0.1, "max": 4.0}

# Pression artérielle (mmHg) : < 140/90 normale ; >= 140/90 HTA gravidique ; >= 160/110 urgence
PA_NORMALE = {"systolique_max": 140, "diastolique_max": 90}
PA_URGENCE = {"systolique": 160, "diastolique": 110}

# Bruits du cœur fœtal (bpm) : 120-160 normal
BCF_MIN, BCF_MAX = 120, 160

# Clarté nucale (mm) : ≤ 3 mm rassurant ; ≥ 3,5 ou ≥ 99e percentile → caryotype
CN_MM_MAX_RASSURANT = 3.0
CN_MM_INDICATION_CARYOTYPE = 3.5


def get_biological_norms(sa: float) -> dict[str, Any]:
    """Retourne les normes biologiques pour la SA donnée (trimestre déduit)."""
    t = _trimestre_from_sa(sa)
    return {
        "trimestre": t,
        "hemoglobine_g_dL": HEMOGLOBINE[t],
        "plaquettes_G_L_min": PLAQUETTES_MIN,
        "ferritine_ug_L_min": FERRITINE_MIN,
        "glycemie_jeun_g_L_max": GLYCEMIE_JEUN_MAX_NORMALE,
        "hgpo_seuils_g_L": HGPO_IADPSG,
        "proteinurie_24h_mg_max": PROTEINURIE_24H_MAX,
        "tsh_mUI_L": TSH,
        "pa_normale_mmHg": PA_NORMALE,
        "bcf_bpm": {"min": BCF_MIN, "max": BCF_MAX},
    }


def evaluate_hemoglobin(value_g_dL: float, sa: float) -> tuple[str, str]:
    """Statut normal/anormal et message."""
    t = _trimestre_from_sa(sa)
    low = HEMOGLOBINE[t]["min"]
    if value_g_dL < low:
        return "anormal", f"Hémoglobine {value_g_dL} g/dL < {low} (T{t}) : anémie."
    return "normal", ""


def evaluate_plaquettes(value_G_L: float) -> tuple[str, str]:
    if value_G_L < 75:
        return "anormal", "Plaquettes < 75 G/L : contre-indication relative à la péridurale."
    if value_G_L < 100:
        return "anormal", "Plaquettes < 100 G/L : investigation nécessaire."
    if value_G_L < PLAQUETTES_MIN:
        return "anormal", "Thrombopénie < 150 G/L."
    return "normal", ""


def evaluate_glycemia_jeun(value_g_L: float) -> tuple[str, str]:
    if value_g_L >= GLYCEMIE_JEUN_DIABETE:
        return "anormal", "Glycémie à jeun ≥ 1,26 g/L : évoquer diabète préexistant."
    if value_g_L >= GLYCEMIE_JEUN_MAX_NORMALE:
        return "anormal", "Glycémie à jeun ≥ 0,92 g/L : diabète gestationnel (IADPSG)."
    return "normal", ""


def evaluate_hgpo(h0: float, h1: float, h2: float) -> tuple[bool, str]:
    """Une seule valeur dépassée = DG. Retourne (diagnostic_DG, message)."""
    seuils = HGPO_IADPSG
    anomalies = []
    if h0 >= seuils["h0"]:
        anomalies.append(f"H0 {h0} ≥ {seuils['h0']} g/L")
    if h1 >= seuils["h1"]:
        anomalies.append(f"H1 {h1} ≥ {seuils['h1']} g/L")
    if h2 >= seuils["h2"]:
        anomalies.append(f"H2 {h2} ≥ {seuils['h2']} g/L")
    if anomalies:
        return True, "Diabète gestationnel (IADPSG) : " + "; ".join(anomalies)
    return False, "HGPO 75 g dans les normes."


def evaluate_blood_pressure(pa_sys: float, pa_dia: float) -> tuple[str, str]:
    if pa_sys >= PA_URGENCE["systolique"] or pa_dia >= PA_URGENCE["diastolique"]:
        return "critical", "HTA sévère ≥ 160/110 : urgence thérapeutique."
    if pa_sys >= PA_NORMALE["systolique_max"] or pa_dia >= PA_NORMALE["diastolique_max"]:
        return "warning", "HTA gravidique ≥ 140/90 mmHg (confirmer sur 2 mesures)."
    return "normal", ""


def evaluate_proteinuria_24h(mg_24h: float) -> tuple[str, str]:
    if mg_24h >= PROTEINURIE_24H_MAX:
        return "anormal", f"Protéinurie ≥ 300 mg/24h ({mg_24h}) : pré-éclampsie si HTA."
    return "normal", ""


def evaluate_bcf(bpm: float) -> tuple[str, str]:
    if bpm < BCF_MIN or bpm > BCF_MAX:
        return "warning", f"BCF {bpm} hors fourchette 120-160 bpm."
    return "normal", ""

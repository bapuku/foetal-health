"""
Prenatal Follow-up Agent - Suivi prénatal français (7 consultations, EPP, 3 échos, dépistages).
Endpoints: evaluate, consultation, screening/t21, screening/diabetes, screening/gbs, norms.
"""
import sys
from pathlib import Path

_root = Path(__file__).resolve().parent.parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

from typing import Any, Optional

from fastapi import FastAPI
from pydantic import BaseModel, Field

from . import calendar as cal
from . import norms
from . import screening as scr

app = FastAPI(title="Prenatal Follow-up Agent", version="1.0.0")


# --- Pydantic models (align with frontend prenatal-types) ---

class PrenatalEvaluateInput(BaseModel):
    dossier: dict = Field(..., description="PrenatalDossier")
    sa_courante: float = Field(..., ge=0, le=42, description="SA courante")


class AlertItem(BaseModel):
    type: str
    message: str
    severite: str = "info"  # info | warning | critical


class PrenatalEvaluateOutput(BaseModel):
    conforme_calendrier: bool
    alertes: list[AlertItem] = []
    examens_en_retard: list[str] = []
    resultats_anormaux: list[dict] = []
    recommandations: list[dict] = []
    narrative: str
    fhir_care_plan: Optional[dict] = None


class PrenatalConsultationInput(BaseModel):
    patient_id: str
    consultation: dict
    biological_exams: Optional[list[dict]] = None


class T21ScreeningInput(BaseModel):
    risque_combine: float = Field(..., description="Probabilité ex. 1/2500 = 0.0004")
    age_maternel: Optional[int] = None
    dpni_resultat: Optional[str] = None


class DiabetesScreeningInput(BaseModel):
    glycemie_jeun: Optional[float] = None
    h0: float
    h1: float
    h2: float
    unite: str = "g/L"


class GBSScreeningInput(BaseModel):
    date_prelevement: str
    sa_prelevement: float
    resultat: str  # positif | negatif


# --- Evaluate full dossier ---

@app.post("/api/prenatal-followup/evaluate", response_model=PrenatalEvaluateOutput)
def evaluate(body: PrenatalEvaluateInput) -> PrenatalEvaluateOutput:
    dossier = body.dossier
    sa = body.sa_courante
    alertes: list[AlertItem] = []
    resultats_anormaux: list[dict] = []
    recommandations: list[dict] = []

    # Calendar compliance
    calendar = dossier.get("calendar") or {}
    items = calendar.get("items") or []
    conforme, en_retard, rec_cal = cal.check_calendar_compliance(items, sa)
    examens_en_retard = en_retard
    for r in rec_cal:
        recommandations.append({"action": r, "level": "I-A"})

    # Clinical alerts from consultations
    for c in dossier.get("consultations") or []:
        pa_sys, pa_dia = c.get("paSystolique"), c.get("paDiastolique")
        if pa_sys is not None and pa_dia is not None:
            sev, msg = norms.evaluate_blood_pressure(pa_sys, pa_dia)
            if sev != "normal":
                alertes.append(AlertItem(type="PA", message=msg, severite=sev))
        bcf = c.get("bcfBpm")
        if bcf is not None:
            st, msg = norms.evaluate_bcf(bcf)
            if st != "normal":
                alertes.append(AlertItem(type="BCF", message=msg, severite="warning"))

    # Biological results vs norms
    for exam in dossier.get("biologicalExams") or []:
        statut = exam.get("statut")
        if statut == "anormal":
            resultats_anormaux.append({
                "examen": exam.get("type", ""),
                "valeur": str(exam.get("resultatNumerique") or exam.get("resultatQualitatif", "")),
                "norme": f"{exam.get('valeurMinNormale')}-{exam.get('valeurMaxNormale')}" if exam.get("valeurMinNormale") is not None else exam.get("commentaire", ""),
            })

    narrative = _build_evaluate_narrative(conforme, examens_en_retard, alertes, resultats_anormaux, sa)
    return PrenatalEvaluateOutput(
        conforme_calendrier=conforme,
        alertes=alertes,
        examens_en_retard=examens_en_retard,
        resultats_anormaux=resultats_anormaux,
        recommandations=recommandations,
        narrative=narrative,
    )


def _build_evaluate_narrative(
    conforme: bool, en_retard: list, alertes: list, resultats_anormaux: list, sa: float
) -> str:
    parts = [f"Évaluation du suivi prénatal à {sa} SA. Calendrier CSP : {'conforme' if conforme else 'non conforme'}."]
    if en_retard:
        parts.append(f"Examens en retard : {', '.join(en_retard)}.")
    if alertes:
        parts.append("Alertes : " + "; ".join(a.message for a in alertes))
    if resultats_anormaux:
        parts.append("Résultats biologiques hors normes : " + ", ".join(r.get("examen", "") for r in resultats_anormaux))
    parts.append("Référentiels : HAS, CNGOF, CSP R2122-1/R2122-2.")
    return " ".join(parts)


# --- Consultation ---

@app.post("/api/prenatal-followup/consultation")
def submit_consultation(body: PrenatalConsultationInput) -> dict[str, Any]:
    c = body.consultation
    alertes: list[dict] = []
    pa_sys = c.get("paSystolique")
    pa_dia = c.get("paDiastolique")
    if pa_sys is not None and pa_dia is not None:
        sev, msg = norms.evaluate_blood_pressure(pa_sys, pa_dia)
        if sev != "normal":
            alertes.append({"type": "PA", "message": msg, "severite": sev})
    bcf = c.get("bcfBpm")
    if bcf is not None:
        st, msg = norms.evaluate_bcf(bcf)
        if st != "normal":
            alertes.append({"type": "BCF", "message": msg, "severite": "warning"})
    narrative = f"Consultation à {c.get('sa', '?')} SA enregistrée. Examen clinique : PA {pa_sys}/{pa_dia} mmHg, BCF {bcf} bpm. " + (
        "Alertes : " + "; ".join(a["message"] for a in alertes) if alertes else "Paramètres dans les normes."
    )
    return {"ok": True, "alertes": alertes, "narrative": narrative}


# --- Screening T21 ---

@app.post("/api/prenatal-followup/screening/t21")
def screening_t21(body: T21ScreeningInput) -> dict[str, Any]:
    out = scr.evaluate_t21(body.risque_combine)
    return {
        "palier": out["palier"],
        "indication_dpni": out["indication_dpni"],
        "indication_caryotype": out["indication_caryotype"],
        "message": out["message"],
        "recommandation": out["recommandation"],
    }


# --- Screening diabetes ---

@app.post("/api/prenatal-followup/screening/diabetes")
def screening_diabetes(body: DiabetesScreeningInput) -> dict[str, Any]:
    out = scr.evaluate_diabetes_screening(body.glycemie_jeun, body.h0, body.h1, body.h2, body.unite)
    return out


# --- Screening GBS ---

@app.post("/api/prenatal-followup/screening/gbs")
def screening_gbs(body: GBSScreeningInput) -> dict[str, Any]:
    out = scr.evaluate_gbs_screening(body.sa_prelevement, body.resultat)
    return out


# --- Norms ---

class NormsRequest(BaseModel):
    sa: float = Field(20.0, ge=0, le=42)


@app.post("/api/prenatal-followup/norms")
def post_norms(body: NormsRequest) -> dict[str, Any]:
    return norms.get_biological_norms(body.sa)


@app.get("/api/prenatal-followup/norms")
def get_norms(sa: float = 20.0) -> dict[str, Any]:
    if sa <= 0 or sa > 42:
        sa = 20.0
    return norms.get_biological_norms(sa)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "agent": "prenatal-followup"}

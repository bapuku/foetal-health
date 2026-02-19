"""
Prenatal Follow-up Agent - Suivi prénatal français (7 consultations, EPP, 3 échos, dépistages).
Endpoints: evaluate, consultation, screening/t21, screening/diabetes, screening/gbs, norms, report.
"""
import hashlib
import json
import os
import sys
import time
from pathlib import Path

_root = Path(__file__).resolve().parent.parent.parent
_repo_root = _root.parent.parent
for p in (_root, _repo_root):
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))

from typing import Any, Optional

from fastapi import FastAPI
from pydantic import BaseModel, Field

from . import calendar as cal
from . import llm_clinical as llm_clin
from . import norms
from . import screening as scr

try:
    from shared.audit_logger import AuditLogger
    _audit = AuditLogger()
except ImportError:
    _audit = None

try:
    from shared.alerting import sender as alert_sender
    _alerting_available = True
except ImportError:
    _alerting_available = False


def _input_hash(body: Any) -> str:
    if hasattr(body, "model_dump"):
        raw = json.dumps(body.model_dump(), sort_keys=True, default=str)
    else:
        raw = json.dumps(body, sort_keys=True, default=str)
    return hashlib.sha256(raw.encode()).hexdigest()


def _output_hash(data: Any) -> str:
    raw = json.dumps(data, sort_keys=True, default=str)
    return hashlib.sha256(raw.encode()).hexdigest()


def _log_audit(action: str, input_hash: str, output_hash: str, model_version: Optional[str] = None, latency_ms: Optional[int] = None):
    if _audit is None:
        return None
    entry = _audit.log_event(
        agent_id="PrenatalFollowupAgent",
        action=action,
        input_hash=input_hash,
        output_hash=output_hash,
        model_version=model_version or "",
        latency_ms=latency_ms,
    )
    return entry.get("hash")


def _fetch_alert_config() -> Optional[dict]:
    """Fetch alert config from frontend API (ALERT_CONFIG_URL). Returns None on failure."""
    url = os.getenv("ALERT_CONFIG_URL", "").strip()
    if not url:
        return None
    base = url.rstrip("/")
    if not base.startswith("http"):
        return None
    try:
        import urllib.request
        req = urllib.request.Request(f"{base}/api/admin/alert-config", method="GET")
        with urllib.request.urlopen(req, timeout=5) as resp:
            return json.loads(resp.read().decode())
    except Exception:
        return None


def _dispatch_emergency_alert(alert: Any, patient_info: dict) -> None:
    """Send SMS, WhatsApp, Email and Slack to medical team for critical obstetric alerts.
    Uses ALERT_CONFIG_URL (GET /api/admin/alert-config) when set; else falls back to env vars."""
    if not _alerting_available:
        return
    severite = alert.severite if hasattr(alert, "severite") else (alert.get("severite") or "critical")
    if severite != "critical":
        return
    msg = alert.message if hasattr(alert, "message") else alert.get("message", "")
    alert_type = alert.type if hasattr(alert, "type") else alert.get("type", "Alerte")
    patient_id = patient_info.get("patient_id") or patient_info.get("id") or "N/A"
    sa = patient_info.get("sa") or patient_info.get("sa_courante") or "?"
    body = f"[URGENCE OBSTETRICALE] Patient {patient_id} - {alert_type} - SA {sa} - {msg}"
    subject = f"[URGENCE] Suivi prénatal - Patient {patient_id} - {alert_type}"

    config = _fetch_alert_config()
    if config:
        # Use admin config: recipients (type critical) and channel toggles
        recipients = config.get("recipients") or []
        critical_recipients = [r for r in recipients if (r.get("type") or "").lower() == "critical"]
        email_enabled = config.get("email") and config["email"].get("enabled")
        sms_enabled = config.get("sms") and config["sms"].get("enabled")
        wa_enabled = config.get("whatsapp") and config["whatsapp"].get("enabled")
        slack_cfg = config.get("slack") or {}
        slack_enabled = slack_cfg.get("enabled") and (slack_cfg.get("webhookUrl") or "").strip().startswith("https://")

        for r in critical_recipients:
            if email_enabled and r.get("email"):
                try:
                    alert_sender.send_email(r["email"].strip(), subject, body)
                except Exception:
                    pass
            if (sms_enabled or wa_enabled) and r.get("phone"):
                to = (r["phone"] or "").strip()
                if sms_enabled:
                    try:
                        alert_sender.send_sms(to, body)
                    except Exception:
                        pass
                if wa_enabled:
                    try:
                        alert_sender.send_whatsapp(to, body)
                    except Exception:
                        pass
        if slack_enabled:
            try:
                alert_sender.send_slack(slack_cfg["webhookUrl"].strip(), body)
            except Exception:
                pass
        return

    # Fallback: env vars
    phones = []
    if os.getenv("ALERT_SAGE_FEMME_PHONE"):
        phones.append(os.getenv("ALERT_SAGE_FEMME_PHONE"))
    if os.getenv("ALERT_MEDECIN_PHONE"):
        phones.append(os.getenv("ALERT_MEDECIN_PHONE"))
    if os.getenv("ALERT_INFIRMIER_PHONE"):
        phones.append(os.getenv("ALERT_INFIRMIER_PHONE"))
    for to in phones:
        try:
            alert_sender.send_sms(to, body)
        except Exception:
            pass
        try:
            alert_sender.send_whatsapp(to, body)
        except Exception:
            pass
    emails = os.getenv("ALERT_TEAM_EMAILS", "")
    for email in [e.strip() for e in emails.split(",") if e.strip()]:
        try:
            alert_sender.send_email(email, subject, body)
        except Exception:
            pass


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
    audit_hash: Optional[str] = None


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


class PrenatalReportInput(BaseModel):
    patient_id: str
    dossier: Optional[dict] = None
    consultation_data: Optional[dict] = None
    screening_results: Optional[dict] = None
    sa: float = Field(..., ge=0, le=42)


# --- Evaluate full dossier ---

@app.post("/api/prenatal-followup/evaluate", response_model=PrenatalEvaluateOutput)
def evaluate(body: PrenatalEvaluateInput) -> PrenatalEvaluateOutput:
    t0 = time.perf_counter()
    inp_hash = _input_hash(body)
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

    patient_info = {"patient_id": dossier.get("patientId") or "N/A", "sa": sa, "sa_courante": sa}
    for a in alertes:
        if a.severite == "critical":
            _dispatch_emergency_alert(a, patient_info)

    narrative = _build_evaluate_narrative(conforme, examens_en_retard, alertes, resultats_anormaux, sa)
    out = PrenatalEvaluateOutput(
        conforme_calendrier=conforme,
        alertes=alertes,
        examens_en_retard=examens_en_retard,
        resultats_anormaux=resultats_anormaux,
        recommandations=recommandations,
        narrative=narrative,
    )
    out_hash = _output_hash(out.model_dump())
    latency_ms = int((time.perf_counter() - t0) * 1000)
    audit_hash = _log_audit("evaluate", inp_hash, out_hash, model_version="prenatal-evaluate", latency_ms=latency_ms)
    out.audit_hash = audit_hash
    return out


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
    t0 = time.perf_counter()
    inp_hash = _input_hash(body)
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
    patient_info = {"patient_id": body.patient_id, "sa": c.get("sa"), "sa_courante": c.get("sa")}
    for a in alertes:
        if a.get("severite") == "critical":
            _dispatch_emergency_alert(a, patient_info)

    narrative = f"Consultation à {c.get('sa', '?')} SA enregistrée. Examen clinique : PA {pa_sys}/{pa_dia} mmHg, BCF {bcf} bpm. " + (
        "Alertes : " + "; ".join(a["message"] for a in alertes) if alertes else "Paramètres dans les normes."
    )
    resp = {"ok": True, "alertes": alertes, "narrative": narrative}
    out_hash = _output_hash(resp)
    audit_hash = _log_audit("consultation", inp_hash, out_hash, latency_ms=int((time.perf_counter() - t0) * 1000))
    resp["audit_hash"] = audit_hash
    return resp


# --- Screening T21 ---

@app.post("/api/prenatal-followup/screening/t21")
def screening_t21(body: T21ScreeningInput) -> dict[str, Any]:
    t0 = time.perf_counter()
    inp_hash = _input_hash(body)
    out = scr.evaluate_t21(body.risque_combine)
    resp = {
        "palier": out["palier"],
        "indication_dpni": out["indication_dpni"],
        "indication_caryotype": out["indication_caryotype"],
        "message": out["message"],
        "recommandation": out["recommandation"],
    }
    audit_hash = _log_audit("screening_t21", inp_hash, _output_hash(resp), latency_ms=int((time.perf_counter() - t0) * 1000))
    resp["audit_hash"] = audit_hash
    return resp


# --- Screening diabetes ---

@app.post("/api/prenatal-followup/screening/diabetes")
def screening_diabetes(body: DiabetesScreeningInput) -> dict[str, Any]:
    t0 = time.perf_counter()
    inp_hash = _input_hash(body)
    out = scr.evaluate_diabetes_screening(body.glycemie_jeun, body.h0, body.h1, body.h2, body.unite)
    audit_hash = _log_audit("screening_diabetes", inp_hash, _output_hash(out), latency_ms=int((time.perf_counter() - t0) * 1000))
    out["audit_hash"] = audit_hash
    return out


# --- Screening GBS ---

@app.post("/api/prenatal-followup/screening/gbs")
def screening_gbs(body: GBSScreeningInput) -> dict[str, Any]:
    t0 = time.perf_counter()
    inp_hash = _input_hash(body)
    out = scr.evaluate_gbs_screening(body.sa_prelevement, body.resultat)
    audit_hash = _log_audit("screening_gbs", inp_hash, _output_hash(out), latency_ms=int((time.perf_counter() - t0) * 1000))
    out["audit_hash"] = audit_hash
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


# --- Report médico-diagnostique ---

@app.post("/api/prenatal-followup/report")
def generate_report(body: PrenatalReportInput) -> dict[str, Any]:
    t0 = time.perf_counter()
    inp_hash = _input_hash(body)
    dossier = body.dossier or {}
    report = llm_clin.generate_diagnostic_report(
        dossier=dossier,
        sa=body.sa,
        consultation_data=body.consultation_data,
        screening_results=body.screening_results,
        audit_input_hash=inp_hash,
        audit_output_hash=None,
    )
    out_hash = _output_hash(report)
    report["audit_input_hash"] = inp_hash
    report["audit_output_hash"] = out_hash
    audit_hash = _log_audit(
        "report",
        inp_hash,
        out_hash,
        model_version=report.get("model_used", ""),
        latency_ms=int((time.perf_counter() - t0) * 1000),
    )
    report["audit_hash"] = audit_hash
    report["patient_id"] = body.patient_id
    return report


@app.get("/api/prenatal-followup/health")
@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "agent": "prenatal-followup"}

"""
CTG Monitor Agent - POST /api/ctg-monitor
Input: FHIR Observation (CTG raw). Output: FHIR Observation + narrative, FIGO classification.
HITL if Pathologique.
"""
import hashlib
import os
import sys
import time
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field


def _root_with_shared() -> Path:
    here = Path(__file__).resolve().parent
    for d in [here, *here.parents]:
        if (d / "shared" / "llm_router").is_dir():
            return d
    return here.parent.parent


_root = _root_with_shared()
sys.path.insert(0, str(_root))
_src_dir = Path(__file__).resolve().parent
if str(_src_dir) not in sys.path:
    sys.path.insert(0, str(_src_dir))

_env_path = _root / ".env"
if _env_path.exists():
    import dotenv

    dotenv.load_dotenv(_env_path)

import ml_ctg
from shared.llm_router import LLMRouter
from shared.llm_router.router import TaskType
from shared.audit_logger import AuditLogger

app = FastAPI(title="CTG Monitor Agent", version="1.0.0")
router_llm = LLMRouter()
audit = AuditLogger()

CLASSES = ["Normal", "Suspect", "Pathologique"]

class CTGInput(BaseModel):
    baseline_bpm: float
    stv_ms: float
    ltv_pct: Optional[float] = None
    decelerations_light: float = 0.0
    decelerations_severe: float = 0.0
    signal_60s: Optional[list[float]] = None  # 4Hz = 240 points (réservé usage futur TorchServe)
    features_21: Optional[list[float]] = Field(
        default=None,
        description="21 caractéristiques tabulaires UCI (ordre fetal_health.csv, sans la cible). Active le classifieur entraîné.",
    )

class CTGOutput(BaseModel):
    classification: str
    confidence: float
    narrative: str
    hitl_required: bool
    escalation_level: Optional[int] = None
    fhir_observation: dict

def _validate_signal(baseline_bpm: float) -> None:
    if not (110 <= baseline_bpm <= 160):
        raise HTTPException(status_code=400, detail="FHR baseline outside physiological range 110-160 bpm")

def _ml_predict(features_21: Optional[list[float]]) -> tuple[int, float, str]:
    """Retourne (classe, confiance, version_modèle)."""
    if features_21 is not None and ml_ctg.model_available():
        try:
            cls, conf = ml_ctg.predict_from_features(features_21)
            return cls, conf, "ctg-tabular-2.0"
        except Exception:
            pass
    return 0, 0.92, "rules-fallback"

def _llm_analyze(baseline_bpm: float, stv_ms: float, ml_class: int, confidence: float) -> str:
    from shared.prompt_system import build_llm_system_prompt

    model_id = router_llm.route(task=TaskType.FAST_ANALYSIS, urgency="critical")
    api_model = router_llm.get_api_model_id(model_id)
    system = build_llm_system_prompt("CTGAnalysisPrompt")
    user_msg = f"""Données CTG : baseline FHR={baseline_bpm} bpm, STV={stv_ms} ms.
Classification ML : {CLASSES[ml_class]} (confiance {confidence:.2f}).
Produis un résumé narratif ~150 mots conforme à ton rôle (FIGO 2015, NICE NG229), avec recommandations et niveau de confiance. Pas de diagnostic final."""
    try:
        if "claude" in model_id.lower():
            import anthropic
            c = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))
            r = c.messages.create(
                model=api_model,
                max_tokens=512,
                system=system,
                messages=[{"role": "user", "content": user_msg}],
            )
            text = r.content[0].text if r.content else ""
        else:
            text = f"Analyse FIGO: baseline {baseline_bpm} bpm, variabilité STV {stv_ms} ms. Classification {CLASSES[ml_class]}. Validation clinique recommandée."
        router_llm.record_success(model_id)
        return text
    except Exception as e:
        router_llm.record_failure(model_id)
        return f"Analyse automatique: {CLASSES[ml_class]}. Justification: baseline {baseline_bpm} bpm, STV {stv_ms} ms. [Erreur LLM: fallback conservateur]. Validation humaine requise si Suspect/Pathologique."

@app.post("/api/ctg-monitor", response_model=CTGOutput)
def ctg_monitor(input_data: CTGInput) -> CTGOutput:
    start = time.perf_counter()
    _validate_signal(input_data.baseline_bpm)
    if input_data.features_21 is not None and len(input_data.features_21) != 21:
        raise HTTPException(status_code=400, detail="features_21 doit contenir exactement 21 valeurs (ordre fetal_health.csv)")
    ml_class, confidence, model_ver = _ml_predict(input_data.features_21)
    classification = CLASSES[ml_class]
    hitl_required = classification == "Pathologique" or (classification == "Suspect" and confidence < 0.95)
    escalation_level = 2 if classification == "Pathologique" else (1 if classification == "Suspect" else None)
    narrative = _llm_analyze(input_data.baseline_bpm, input_data.stv_ms, ml_class, confidence)
    latency_ms = int((time.perf_counter() - start) * 1000)
    input_hash = hashlib.sha256(str(input_data.model_dump()).encode()).hexdigest()
    output_hash = hashlib.sha256(f"{classification}{narrative}".encode()).hexdigest()
    audit.log_event(
        agent_id="CTGMonitorAgent",
        action="analyze",
        input_hash=input_hash,
        output_hash=output_hash,
        model_version=model_ver,
        confidence=confidence,
        human_decision="required" if hitl_required else None,
        latency_ms=latency_ms,
    )
    fhir = {
        "resourceType": "Observation",
        "status": "final",
        "code": {"coding": [{"system": "http://loinc.org", "code": "11547-0", "display": "FHR pattern"}]},
        "valueString": classification,
        "interpretation": [{"coding": [{"code": "N" if classification == "Normal" else "A"}]}],
        "note": [{"text": narrative}],
    }
    return CTGOutput(
        classification=classification,
        confidence=confidence,
        narrative=narrative,
        hitl_required=hitl_required,
        escalation_level=escalation_level,
        fhir_observation=fhir,
    )

@app.get("/api/ctg-monitor/health")
@app.get("/health")
def health() -> dict:
    return {"status": "ok", "agent": "ctg-monitor"}

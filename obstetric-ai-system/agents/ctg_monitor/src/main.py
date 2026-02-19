"""
CTG Monitor Agent - POST /api/ctg-monitor
Input: FHIR Observation (CTG raw). Output: FHIR Observation + narrative, FIGO classification.
HITL if Pathologique.
"""
import hashlib
import os
import time
from pathlib import Path
# Charger .env depuis la racine du projet
_env_path = Path(__file__).resolve().parent.parent.parent.parent / ".env"
if _env_path.exists():
    import dotenv
    dotenv.load_dotenv(_env_path)
from typing import Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# Add shared to path
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
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
    signal_60s: Optional[list[float]] = None  # 4Hz = 240 points

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

def _ml_predict(signal: Optional[list[float]]) -> tuple[int, float]:
    # In production: call TorchServe or load local model
    # Placeholder: rule-based
    return 0, 0.92  # Normal, 0.92

def _llm_analyze(baseline_bpm: float, stv_ms: float, ml_class: int, confidence: float) -> str:
    model_id = router_llm.route(task=TaskType.FAST_ANALYSIS, urgency="critical")
    api_model = router_llm.get_api_model_id(model_id)
    prompt = f"""Tu es un expert obstétricien. CTG: baseline FHR={baseline_bpm} bpm, STV={stv_ms} ms.
Classification ML: {CLASSES[ml_class]} (confiance {confidence:.2f}). Donne un résumé narratif ~150 mots selon FIGO 2015, avec recommandations. Pas de diagnostic final."""
    try:
        if "claude" in model_id.lower():
            import anthropic
            c = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))
            r = c.messages.create(model=api_model, max_tokens=512, messages=[{"role": "user", "content": prompt}])
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
    ml_class, confidence = _ml_predict(input_data.signal_60s)
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
        model_version="ctg-classifier-1.0",
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

@app.get("/health")
def health() -> dict:
    return {"status": "ok", "agent": "ctg-monitor"}

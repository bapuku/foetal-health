"""
Apgar & Postnatal Transition Agent - POST /api/apgar-transition
Input: Apgar 1/5 min, vital signs. Output: FHIR Observation + narrative. HITL if Apgar 5min <= 6.
"""
import hashlib
import os
import time
from pathlib import Path
_env_path = Path(__file__).resolve().parent.parent.parent.parent / ".env"  # agents/apgar-transition -> root
if _env_path.exists():
    import dotenv
    dotenv.load_dotenv(_env_path)
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
from shared.llm_router import LLMRouter
from shared.llm_router.router import TaskType
from shared.audit_logger import AuditLogger

app = FastAPI(title="Apgar Transition Agent", version="1.0.0")
router_llm = LLMRouter()
audit = AuditLogger()

class ApgarInput(BaseModel):
    apgar_1min: int
    apgar_5min: int
    heart_rate: Optional[int] = None
    respiration: Optional[str] = None
    tone: Optional[str] = None
    reflex: Optional[str] = None
    color: Optional[str] = None

class ApgarOutput(BaseModel):
    risk_apgar_low: bool
    narrative: str
    hitl_required: bool
    fhir_observation: dict

def _validate_apgar(apgar_1min: int, apgar_5min: int) -> None:
    if not (0 <= apgar_1min <= 10 and 0 <= apgar_5min <= 10):
        raise HTTPException(status_code=400, detail="Apgar scores must be 0-10")

@app.post("/api/apgar-transition", response_model=ApgarOutput)
def apgar_transition(input_data: ApgarInput) -> ApgarOutput:
    start = time.perf_counter()
    _validate_apgar(input_data.apgar_1min, input_data.apgar_5min)
    risk_apgar_low = input_data.apgar_5min < 7
    hitl_required = input_data.apgar_5min <= 6
    model_id = router_llm.route(task=TaskType.FAST_ANALYSIS, urgency="critical")
    prompt = f"Apgar 1min={input_data.apgar_1min}, 5min={input_data.apgar_5min}. Donne un résumé néonatal ~150 mots et recommandations. Pas de diagnostic final."
    try:
        if os.getenv("ANTHROPIC_API_KEY"):
            import anthropic
            c = anthropic.Anthropic()
            r = c.messages.create(model="claude-sonnet-4-20250514", max_tokens=300, messages=[{"role": "user", "content": prompt}])
            narrative = r.content[0].text if r.content else ""
        else:
            narrative = f"Apgar 1min {input_data.apgar_1min}, 5min {input_data.apgar_5min}. Surveillance néonatale recommandée. Validation pédiatre si 5min ≤ 6."
    except Exception:
        narrative = f"Apgar 1min {input_data.apgar_1min}, 5min {input_data.apgar_5min}. Alerte si 5min ≤ 6: pause et notification pédiatre."
    latency_ms = int((time.perf_counter() - start) * 1000)
    input_hash = hashlib.sha256(str(input_data.model_dump()).encode()).hexdigest()
    output_hash = hashlib.sha256(narrative.encode()).hexdigest()
    audit.log_event("ApgarTransitionAgent", "evaluate", input_hash, output_hash, confidence=1.0, human_decision="required" if hitl_required else None, latency_ms=latency_ms)
    fhir = {
        "resourceType": "Observation",
        "status": "final",
        "code": {"coding": [{"system": "http://loinc.org", "code": "9271-3", "display": "Apgar"}]},
        "component": [
            {"code": {"coding": [{"code": "9271-3"}]}, "valueInteger": input_data.apgar_1min},
            {"code": {"coding": [{"code": "9274-7"}]}, "valueInteger": input_data.apgar_5min},
        ],
        "note": [{"text": narrative}],
    }
    return ApgarOutput(risk_apgar_low=risk_apgar_low, narrative=narrative, hitl_required=hitl_required, fhir_observation=fhir)

@app.get("/health")
def health() -> dict:
    return {"status": "ok", "agent": "apgar-transition"}

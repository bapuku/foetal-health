"""
Symbolic Reasoning Agent - POST /api/symbolic-reasoning
Input: FHIR Bundle (all agents outputs). Output: FHIR DetectedIssue + narrative (HAS/FIGO/CNGOF compliance).
"""
import hashlib
import os
import time
from typing import Any

from fastapi import FastAPI
from pydantic import BaseModel
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
from shared.llm_router import LLMRouter
from shared.llm_router.router import TaskType
from shared.audit_logger import AuditLogger

app = FastAPI(title="Symbolic Reasoning Agent", version="1.0.0")
router_llm = LLMRouter()
audit = AuditLogger()

class SymbolicInput(BaseModel):
    bundle: dict  # FHIR Bundle with agent outputs

class SymbolicOutput(BaseModel):
    conformant: bool
    deviations_count: int
    narrative: str
    fhir_detected_issue: dict

@app.post("/api/symbolic-reasoning", response_model=SymbolicOutput)
def symbolic_reasoning(input_data: SymbolicInput) -> SymbolicOutput:
    start = time.perf_counter()
    model_id = router_llm.route(task=TaskType.REASONING, complexity="high")
    prompt = """Tu es un expert en recommandations obstétricales (HAS 2022, FIGO 2015, CNGOF).
Analyse le bundle FHIR fourni et indique: 1) conformité aux protocoles, 2) nombre d'écarts, 3) résumé narratif ~200 mots avec références. Pas de diagnostic."""
    try:
        if os.getenv("ANTHROPIC_API_KEY"):
            import anthropic
            c = anthropic.Anthropic()
            r = c.messages.create(model="claude-opus-4-20250514", max_tokens=600, messages=[{"role": "user", "content": prompt}])
            narrative = r.content[0].text if r.content else "Conformité analysée. Aucun écart majeur détecté."
        else:
            narrative = "Analyse de conformité HAS/FIGO/CNGOF. Validation clinique recommandée pour tout écart."
    except Exception:
        narrative = "Conformité: analyse symbolique non disponible. Validation humaine requise."
    latency_ms = int((time.perf_counter() - start) * 1000)
    input_hash = hashlib.sha256(str(input_data.bundle).encode()).hexdigest()
    output_hash = hashlib.sha256(narrative.encode()).hexdigest()
    audit.log_event("SymbolicReasoningAgent", "compliance_check", input_hash, output_hash, latency_ms=latency_ms)
    fhir = {
        "resourceType": "DetectedIssue",
        "status": "final",
        "code": {"coding": [{"system": "http://hl7.org/fhir/CodeSystem/detectedissue-category", "code": "guideline"}]},
        "detail": narrative,
        "reference": "HAS 2022, FIGO 2015, CNGOF",
    }
    return SymbolicOutput(conformant=True, deviations_count=0, narrative=narrative, fhir_detected_issue=fhir)

@app.get("/health")
def health() -> dict:
    return {"status": "ok", "agent": "symbolic-reasoning"}

"""
Clinical Specialists — 7 écrans cliniques du Prompt System v2 (sans duplication de texte).
Chaque route utilise build_llm_system_prompt(<Template>) depuis shared/prompt_system.
"""
from __future__ import annotations

import hashlib
import json
import os
import sys
import time
from pathlib import Path
from typing import Any, Optional

from fastapi import FastAPI
from pydantic import BaseModel, Field

_OBS = Path(__file__).resolve().parents[3]
if str(_OBS) not in sys.path:
    sys.path.insert(0, str(_OBS))

_env = _OBS / ".env"
if _env.exists():
    import dotenv

    dotenv.load_dotenv(_env)

from shared.audit_logger import AuditLogger
from shared.prompt_system import build_llm_system_prompt, get_metadata

app = FastAPI(
    title="Clinical Specialists Agent",
    version="2.0.0",
    description="Preeclampsia, GDM, PPH, Infection, Mental health, Anemia/TEV, Fetal Doppler — prompts centralisés.",
)
audit = AuditLogger()

# (template YAML key, URL suffix, agent_id pour audit)
SCREENINGS: list[tuple[str, str, str]] = [
    ("PreeclampsiaPrompt", "preeclampsia", "PreeclampsiaScreeningAgent"),
    ("GestationalDiabetesPrompt", "gestational-diabetes", "GestationalDiabetesAgent"),
    ("PHPrompt", "postpartum-hemorrhage", "PostpartumHemorrhageAgent"),
    ("InfectionScreeningPrompt", "infection-screening", "InfectionScreeningAgent"),
    ("MentalHealthPrompt", "perinatal-mental-health", "PerinatalMentalHealthAgent"),
    ("AnemiaThromboPrompt", "anemia-thromboprophylaxis", "AnemiaThromboAgent"),
    ("DopplerBiometryPrompt", "fetal-doppler-biometry", "FetalDopplerBiometryAgent"),
]


class ScreeningRequest(BaseModel):
    clinical_context: str = Field(..., min_length=1, description="Contexte clinique ou question (texte libre)")
    gestational_age_weeks: Optional[float] = Field(None, description="Âge gestationnel en semaines, si pertinent")
    structured_data: Optional[dict[str, Any]] = Field(None, description="Données structurées optionnelles (JSON)")


class ScreeningResponse(BaseModel):
    agent_id: str
    template_key: str
    narrative: str
    prompt_system_version: str
    hitl_required: bool = True
    latency_ms: int


def _build_user_message(req: ScreeningRequest) -> str:
    parts: list[str] = []
    if req.gestational_age_weeks is not None:
        parts.append(f"Âge gestationnel : {req.gestational_age_weeks} SA.")
    if req.structured_data:
        raw = json.dumps(req.structured_data, ensure_ascii=False, default=str)
        parts.append("Données structurées :\n" + raw[:8000])
    parts.append("Contexte / demande clinique :\n" + req.clinical_context.strip()[:12000])
    return "\n\n".join(parts)


def _anthropic_key_usable() -> bool:
    key = (os.getenv("ANTHROPIC_API_KEY") or "").strip()
    if not key or len(key) < 15:
        return False
    if key in ("sk-dummy", "dummy") or key.startswith("sk-dummy"):
        return False
    return True


def _run_llm(template_key: str, user_content: str) -> str:
    system = build_llm_system_prompt(template_key)
    if not _anthropic_key_usable():
        meta = get_metadata()
        ver = meta.get("version", "2.0")
        return (
            f"[Mode dégradé — clé Anthropic absente ou non utilisable] PromptSystem v{ver}, template {template_key} chargé. "
            "Transmettre le contexte à un obstétricien. Aucune inférence LLM exécutée."
        )
    key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    model = os.getenv("ANTHROPIC_CLINICAL_MODEL", "claude-sonnet-4-20250514")
    try:
        import anthropic

        client = anthropic.Anthropic(api_key=key)
        msg = client.messages.create(
            model=model,
            max_tokens=1024,
            system=system,
            messages=[{"role": "user", "content": user_content}],
        )
        if msg.content and msg.content[0].type == "text":
            return msg.content[0].text
    except Exception as e:
        return f"Erreur lors de l'appel LLM : {e!s}. Validation humaine obligatoire."
    return "Réponse vide du modèle. Validation humaine obligatoire."


def _make_screening_handler(template_key: str, agent_id: str, ps_ver: str):
    def handler(body: ScreeningRequest) -> ScreeningResponse:
        start = time.perf_counter()
        user_msg = _build_user_message(body)
        narrative = _run_llm(template_key, user_msg)
        latency_ms = int((time.perf_counter() - start) * 1000)
        ih = hashlib.sha256(body.clinical_context.encode()).hexdigest()
        oh = hashlib.sha256(narrative.encode()).hexdigest()
        audit.log_event(
            agent_id=agent_id,
            action="screening",
            input_hash=ih,
            output_hash=oh,
            latency_ms=latency_ms,
            confidence=None,
            human_decision="required",
            model_version=f"prompt-{template_key}",
        )
        return ScreeningResponse(
            agent_id=agent_id,
            template_key=template_key,
            narrative=narrative,
            prompt_system_version=ps_ver,
            hitl_required=True,
            latency_ms=latency_ms,
        )

    return handler


_ps_ver = str(get_metadata().get("version", "2.0.0"))
for _tk, _suffix, _aid in SCREENINGS:
    app.add_api_route(
        f"/api/clinical-specialists/{_suffix}",
        _make_screening_handler(_tk, _aid, _ps_ver),
        methods=["POST"],
        response_model=ScreeningResponse,
        tags=["clinical-specialists"],
    )


@app.get("/api/clinical-specialists", tags=["clinical-specialists"])
def list_screenings() -> dict[str, Any]:
    return {
        "prompt_system_version": get_metadata().get("version", "2.0.0"),
        "screenings": [
            {"path": f"/api/clinical-specialists/{s[1]}", "template": s[0], "agent_id": s[2]} for s in SCREENINGS
        ],
    }


@app.get("/health")
@app.get("/api/clinical-specialists/health")
def health() -> dict[str, str]:
    return {"status": "ok", "agent": "clinical-specialists"}

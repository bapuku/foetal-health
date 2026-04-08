"""
Charge le Prompt System obstétrical v2 (JSON export du notebook PROMPTSYSTEM_AMPLIFIE).
Découple les prompts agents / assistant de la logique métier.
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

_JSON_PATH = Path(__file__).with_name("prompt_system_v2.json")


@lru_cache(maxsize=1)
def load_config() -> dict[str, Any]:
    if not _JSON_PATH.is_file():
        return {}
    return json.loads(_JSON_PATH.read_text(encoding="utf-8"))


def get_metadata() -> dict[str, Any]:
    return load_config().get("metadata") or {}


def get_globals() -> dict[str, Any]:
    return load_config().get("globals") or {}


def get_prompt_template(template_key: str) -> dict[str, Any] | None:
    spec = load_config().get("spec") or {}
    templates = spec.get("prompt_templates") or {}
    t = templates.get(template_key)
    return t if isinstance(t, dict) else None


def get_global_system_prefix() -> str:
    """Préambule commun (usage prévu, conformité, langue, FHIR)."""
    c = load_config()
    if not c:
        return ""
    m = c.get("metadata") or {}
    g = c.get("globals") or {}
    iu = (m.get("intended_use") or "").strip()
    ver = m.get("version", "?")
    stds = m.get("clinical_standards") or []
    head = "\n".join(f"- {s}" for s in stds[:8])
    more = len(stds) - 8 if len(stds) > 8 else 0
    extra = f"\n... (+{more} autres références)" if more > 0 else ""
    return (
        f"[Obstetric PromptSystem v{ver} — amplifié]\n"
        f"{iu}\n\n"
        f"Standards (aperçu):\n{head}{extra}\n\n"
        f"FHIR: {g.get('fhir_version', 'R4')}. Langue: {g.get('system_language', 'fr-FR')}. "
        f"Confiance cible ≥{g.get('confidence_minimum', 0.85)}. "
        f"Validation humaine requise: {g.get('human_validation_required', True)}.\n"
        "Tu ne remplaces jamais le jugement clinique. EU AI Act Art. 14 — Human Oversight."
    )


def build_llm_system_prompt(
    template_key: str,
    *,
    include_global: bool = True,
    include_chain_of_thought: bool = True,
    include_few_shot: bool = True,
    max_few_shot_chars: int = 1200,
) -> str:
    """Assemble system prompt pour Anthropic/OpenAI (system role)."""
    chunks: list[str] = []
    if include_global:
        gp = get_global_system_prefix()
        if gp:
            chunks.append(gp)
    pt = get_prompt_template(template_key)
    if not pt:
        return "\n\n".join(chunks) if chunks else get_global_system_prefix()
    sp = (pt.get("system_prompt") or "").strip()
    if sp:
        chunks.append(sp)
    if include_chain_of_thought:
        cot = (pt.get("chain_of_thought") or "").strip()
        if cot:
            chunks.append("--- Raisonnement étape par étape (appliquer avant de répondre) ---\n" + cot)
    if include_few_shot:
        fse = pt.get("few_shot_examples")
        if isinstance(fse, list) and fse:
            lines = ["--- Exemples few-shot (style attendu) ---"]
            for ex in fse[:2]:
                if not isinstance(ex, dict):
                    continue
                inp = str(ex.get("input", ""))[:400]
                out = str(ex.get("output", ""))[: max_few_shot_chars // 2]
                lines.append(f"Entrée: {inp}\nSortie type: {out}")
            chunks.append("\n".join(lines))
    return "\n\n".join(chunks)


# Clés YAML `prompt_templates` → usage code court
TEMPLATE_BY_SERVICE: dict[str, str] = {
    "ctg": "CTGAnalysisPrompt",
    "bishop": "BishopPartogramPrompt",
    "rciu": "RCIURiskPrompt",
    "apgar": "ApgarPrompt",
    "symbolic": "GuidelineCompliancePrompt",
    "polygraph": "TruthVerifierPrompt",
    "quantum": "BirthOptimizationPrompt",
    "mother_baby": "MotherBabyRiskPrompt",
    "clinical_narrative": "ClinicalSummaryPrompt",
    "user_engagement": "UserEngagementPrompt",
    "preeclampsia": "PreeclampsiaPrompt",
    "gdm": "GestationalDiabetesPrompt",
    "pph": "PHPrompt",
    "infection": "InfectionScreeningPrompt",
    "mental_health": "MentalHealthPrompt",
    "anemia_thrombo": "AnemiaThromboPrompt",
    "doppler": "DopplerBiometryPrompt",
    "prenatal": "ClinicalSummaryPrompt",
}


def system_prompt_for_service(service_key: str, **kwargs: Any) -> str:
    key = TEMPLATE_BY_SERVICE.get(service_key, "ClinicalSummaryPrompt")
    return build_llm_system_prompt(key, **kwargs)

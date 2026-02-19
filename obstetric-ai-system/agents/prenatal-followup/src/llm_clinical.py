"""
LLM-powered clinical narrative and diagnostic report for prenatal follow-up.
Uses shared LLM router (Opus 4.5, Sonnet 4.5, GPT-5.2, Mistral). Fallback to rule-based narrative.
"""
import json
import os
from typing import Any, Optional

try:
    from shared.llm_router import LLMRouter
    from shared.llm_router.router import TaskType
    _router_available = True
except ImportError:
    _router_available = False


def _call_anthropic(prompt: str, model_id: str, api_model: str, max_tokens: int = 1024) -> str:
    import anthropic
    key = os.getenv("ANTHROPIC_API_KEY", "")
    if not key:
        return ""
    c = anthropic.Anthropic(api_key=key)
    r = c.messages.create(
        model=api_model,
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": prompt}],
    )
    return r.content[0].text if r.content else ""


def _call_openai(prompt: str, model_id: str, api_model: str, max_tokens: int = 1024) -> str:
    from openai import OpenAI
    key = os.getenv("OPENAI_API_KEY", "")
    if not key:
        return ""
    client = OpenAI(api_key=key)
    r = client.chat.completions.create(
        model=api_model if api_model != "gpt-5.2" else "gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=max_tokens,
    )
    if r.choices and r.choices[0].message.content:
        return r.choices[0].message.content
    return ""


def generate_clinical_narrative(context: dict, task_type: str = "prenatal_analysis") -> str:
    """
    Generate a clinical narrative from context using LLM (Opus 4.5 / Sonnet 4.5).
    Fallback: rule-based narrative if LLM fails or is unavailable.
    """
    fallback = _build_fallback_narrative(context)
    if not _router_available:
        return fallback

    router = LLMRouter()
    task = TaskType.PRENATAL_ANALYSIS if task_type == "prenatal_analysis" else TaskType.FAST_ANALYSIS
    model_id = router.route(task=task, urgency="normal", complexity="medium")
    api_model = router.get_api_model_id(model_id)

    sa = context.get("sa_courante") or context.get("sa") or 0
    conforme = context.get("conforme_calendrier", True)
    alertes = context.get("alertes") or []
    en_retard = context.get("examens_en_retard") or []
    resultats_anormaux = context.get("resultats_anormaux") or []

    prompt = f"""Tu es un médecin obstétricien. Rédige un narratif clinique concis (~200 mots) pour un suivi prénatal français.
Contexte :
- SA : {sa}
- Calendrier CSP : {'conforme' if conforme else 'non conforme'}
- Examens en retard : {', '.join(en_retard) if en_retard else 'aucun'}
- Alertes : {'; '.join(a.get('message', a) if isinstance(a, dict) else str(a) for a in alertes) if alertes else 'aucune'}
- Résultats anormaux : {', '.join(r.get('examen', '') for r in resultats_anormaux) if resultats_anormaux else 'aucun'}

Référentiels : HAS 2016/2017, CNGOF, CSP R2122-1/R2122-2. Style technique, pas de diagnostic final, recommandations factuelles."""

    try:
        if "claude" in model_id.lower():
            text = _call_anthropic(prompt, model_id, api_model, max_tokens=512)
        elif "gpt" in model_id.lower():
            text = _call_openai(prompt, model_id, api_model, max_tokens=512)
        else:
            text = ""
        if text and len(text.strip()) > 50:
            router.record_success(model_id)
            return text.strip()
    except Exception:
        router.record_failure(model_id)
    return fallback


def _build_fallback_narrative(context: dict) -> str:
    sa = context.get("sa_courante") or context.get("sa") or 0
    conforme = context.get("conforme_calendrier", True)
    alertes = context.get("alertes") or []
    en_retard = context.get("examens_en_retard") or []
    resultats_anormaux = context.get("resultats_anormaux") or []
    parts = [
        f"Évaluation du suivi prénatal à {sa} SA. Calendrier CSP : {'conforme' if conforme else 'non conforme'}."
    ]
    if en_retard:
        parts.append(f"Examens en retard : {', '.join(en_retard)}.")
    if alertes:
        msgs = [a.get("message", str(a)) if isinstance(a, dict) else str(a) for a in alertes]
        parts.append("Alertes : " + "; ".join(msgs))
    if resultats_anormaux:
        parts.append("Résultats hors normes : " + ", ".join(r.get("examen", "") for r in resultats_anormaux))
    parts.append("Référentiels : HAS, CNGOF, CSP R2122-1/R2122-2.")
    return " ".join(parts)


def generate_diagnostic_report(
    dossier: dict,
    sa: float,
    consultation_data: Optional[dict] = None,
    screening_results: Optional[dict] = None,
    audit_input_hash: Optional[str] = None,
    audit_output_hash: Optional[str] = None,
) -> dict[str, Any]:
    """
    Generate a structured medico-diagnostic report for one prenatal visit.
    Sections: anamnèse, examen clinique, biologie, dépistages, synthèse, conduite à tenir.
    Includes audit trail references. Returns dict compatible with FHIR DiagnosticReport.
    """
    fallback_sections = _build_fallback_report_sections(
        dossier, sa, consultation_data, screening_results
    )
    if not _router_available:
        return _report_dict(fallback_sections, sa, audit_input_hash, audit_output_hash, model_used="rule-based")

    router = LLMRouter()
    model_id = router.route(task=TaskType.PRENATAL_ANALYSIS, urgency="normal")
    api_model = router.get_api_model_id(model_id)

    ctx = {
        "dossier": dossier,
        "sa": sa,
        "consultation": consultation_data or {},
        "screenings": screening_results or {},
    }
    prompt = f"""Génère un rapport médico-diagnostique structuré pour une consultation de suivi prénatal (SA {sa}).
Données : {json.dumps(ctx, ensure_ascii=False, default=str)[:3000]}

Produis un JSON avec exactement les clés suivantes (texte en français) :
- anamnese_obstetricale : DDR, DPA, parité, antécédents pertinents
- examen_clinique : PA, poids, hauteur utérine, BCF, présentation, mouvements actifs
- bilan_biologique : résumé bilan avec normes trimestre
- depistages : T21 (palier), diabète gestationnel (HGPO), SGB
- serologies : toxo, rubéole, VIH, VHC, AgHBs si pertinent
- synthese : en 2-3 phrases
- conduite_a_tenir : prochaines étapes et recommandations

Références : HAS 2016/2017, CSP R2122, CNGOF/SFD 2010, IADPSG. Réponds uniquement avec le JSON, sans markdown."""

    try:
        if "claude" in model_id.lower():
            text = _call_anthropic(prompt, model_id, api_model, max_tokens=1500)
        elif "gpt" in model_id.lower():
            text = _call_openai(prompt, model_id, api_model, max_tokens=1500)
        else:
            text = ""
        if text:
            text = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            try:
                sections = json.loads(text)
                if isinstance(sections, dict):
                    router.record_success(model_id)
                    return _report_dict(
                        sections, sa, audit_input_hash, audit_output_hash,
                        model_used=model_id,
                    )
            except json.JSONDecodeError:
                pass
        router.record_failure(model_id)
    except Exception:
        router.record_failure(model_id)

    return _report_dict(
        fallback_sections, sa, audit_input_hash, audit_output_hash,
        model_used="rule-based",
    )


def _build_fallback_report_sections(
    dossier: dict,
    sa: float,
    consultation_data: Optional[dict],
    screening_results: Optional[dict],
) -> dict[str, str]:
    c = consultation_data or {}
    s = screening_results or {}
    return {
        "anamnese_obstetricale": f"Suivi prénatal à {sa} SA. Données dossier : consultations, calendrier CSP.",
        "examen_clinique": f"PA {c.get('paSystolique')}/{c.get('paDiastolique')} mmHg, BCF {c.get('bcfBpm')} bpm, poids {c.get('poids')} kg, HU {c.get('hauteurUterine')} cm.",
        "bilan_biologique": "Bilan selon normes du trimestre (Hb, plaquettes, ferritine, TSH, glycémie).",
        "depistages": f"T21 : {s.get('t21', {}).get('palier', 'N/A')}; DG : {s.get('diabetes', {}).get('message', 'N/A')}; SGB : {s.get('gbs', {}).get('message', 'N/A')}.",
        "serologies": "Toxoplasmose, rubéole, VIH, VHC, AgHBs selon statut immunitaire.",
        "synthese": f"Consultation à {sa} SA enregistrée. Conformité au calendrier et dépistages à vérifier.",
        "conduite_a_tenir": "Poursuite du suivi selon calendrier CSP. Prochaine consultation selon plan.",
    }


def _report_dict(
    sections: dict[str, str],
    sa: float,
    audit_input_hash: Optional[str],
    audit_output_hash: Optional[str],
    model_used: str,
) -> dict[str, Any]:
    return {
        "sections": sections,
        "sa": sa,
        "audit_input_hash": audit_input_hash,
        "audit_output_hash": audit_output_hash,
        "model_used": model_used,
        "fhir_diagnostic_report": {
            "resourceType": "DiagnosticReport",
            "status": "final",
            "code": {"coding": [{"system": "http://loinc.org", "code": "57076-5", "display": "Pregnancy summary"}]},
            "effectiveDateTime": None,
            "conclusion": sections.get("synthese", ""),
            "presentedForm": [
                {"contentType": "text/plain", "data": f"Rapport suivi prénatal {sa} SA. {sections.get('synthese', '')}"}
            ],
            "extension": [
                {"url": "http://example.org/audit-input-hash", "valueString": audit_input_hash or ""},
                {"url": "http://example.org/audit-output-hash", "valueString": audit_output_hash or ""},
                {"url": "http://example.org/model-used", "valueString": model_used},
            ],
        },
    }

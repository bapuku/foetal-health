"""Unit tests for Prenatal Follow-up Agent.

Run from repo root with agent deps installed:
  pip install -r agents/prenatal-followup/requirements.txt
  pytest tests/agents/test_prenatal_agent.py -v
"""
import sys
from pathlib import Path
root = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(root))
sys.path.insert(0, str(root / "agents" / "prenatal-followup"))

from src.main import app
from fastapi.testclient import TestClient

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["agent"] == "prenatal-followup"


def test_norms_get():
    r = client.get("/api/prenatal-followup/norms?sa=20")
    assert r.status_code == 200
    data = r.json()
    assert "trimestre" in data
    assert data["trimestre"] == 2
    assert "hemoglobine_g_dL" in data
    assert "pa_normale_mmHg" in data


def test_norms_post():
    r = client.post("/api/prenatal-followup/norms", json={"sa": 30})
    assert r.status_code == 200
    data = r.json()
    assert data["trimestre"] == 3


def test_evaluate_normal_pregnancy():
    dossier = {
        "calendar": {
            "items": [
                {"id": "c1", "label": "1ère consultation", "saCibleMax": 15, "status": "realisee"},
                {"id": "c2", "label": "2e", "saCibleMax": 20, "status": "realisee"},
                {"id": "c3", "label": "3e", "saCibleMax": 24, "status": "realisee"},
            ],
        },
        "consultations": [],
        "biologicalExams": [],
    }
    r = client.post("/api/prenatal-followup/evaluate", json={"dossier": dossier, "sa_courante": 22})
    assert r.status_code == 200
    data = r.json()
    assert "conforme_calendrier" in data
    assert "narrative" in data
    assert "alertes" in data


def test_evaluate_with_hta_alert():
    dossier = {
        "calendar": {"items": []},
        "consultations": [
            {"paSystolique": 150, "paDiastolique": 95, "bcfBpm": 140},
        ],
        "biologicalExams": [],
    }
    r = client.post("/api/prenatal-followup/evaluate", json={"dossier": dossier, "sa_courante": 28})
    assert r.status_code == 200
    data = r.json()
    assert any(a.get("type") == "PA" for a in data.get("alertes", []))


def test_consultation():
    r = client.post(
        "/api/prenatal-followup/consultation",
        json={
            "patient_id": "P-001",
            "consultation": {
                "date": "2026-02-19",
                "sa": 28,
                "paSystolique": 118,
                "paDiastolique": 72,
                "poids": 70,
                "bcfBpm": 145,
            },
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert data.get("ok") is True
    assert "narrative" in data


def test_screening_t21_low_risk():
    r = client.post("/api/prenatal-followup/screening/t21", json={"risque_combine": 0.0004})  # 1/2500
    assert r.status_code == 200
    data = r.json()
    assert data["palier"] == "faible"
    assert data["indication_caryotype"] is False
    assert data["indication_dpni"] is False


def test_screening_t21_intermediate():
    r = client.post("/api/prenatal-followup/screening/t21", json={"risque_combine": 0.005})  # 1/200, entre 1/1000 et 1/51
    assert r.status_code == 200
    data = r.json()
    assert data["palier"] == "intermediaire"
    assert data["indication_dpni"] is True


def test_screening_t21_high():
    r = client.post("/api/prenatal-followup/screening/t21", json={"risque_combine": 0.05})  # 1/20
    assert r.status_code == 200
    data = r.json()
    assert data["palier"] == "eleve"
    assert data["indication_caryotype"] is True


def test_screening_diabetes_normal():
    r = client.post(
        "/api/prenatal-followup/screening/diabetes",
        json={"h0": 0.85, "h1": 1.5, "h2": 1.2},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["diagnostic_dg"] is False


def test_screening_diabetes_positive():
    r = client.post(
        "/api/prenatal-followup/screening/diabetes",
        json={"h0": 0.9, "h1": 1.9, "h2": 1.4},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["diagnostic_dg"] is True
    assert "IADPSG" in data.get("message", "") or "Diabète" in data.get("message", "")


def test_screening_gbs_negative():
    r = client.post(
        "/api/prenatal-followup/screening/gbs",
        json={"date_prelevement": "2026-02-01", "sa_prelevement": 36, "resultat": "negatif"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["timing_ok"] is True
    assert data["antibioprophylaxie_prevue"] is False


def test_screening_gbs_positive():
    r = client.post(
        "/api/prenatal-followup/screening/gbs",
        json={"date_prelevement": "2026-02-01", "sa_prelevement": 36, "resultat": "positif"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["antibioprophylaxie_prevue"] is True


def test_evaluate_with_audit_hash():
    dossier = {"calendar": {"items": []}, "consultations": [], "biologicalExams": []}
    r = client.post("/api/prenatal-followup/evaluate", json={"dossier": dossier, "sa_courante": 20})
    assert r.status_code == 200
    data = r.json()
    assert "audit_hash" in data
    assert data["audit_hash"] is None or (isinstance(data["audit_hash"], str) and len(data["audit_hash"]) > 10)


def test_report_generation():
    r = client.post(
        "/api/prenatal-followup/report",
        json={
            "patient_id": "P-TEST",
            "dossier": {},
            "consultation_data": {"sa": 28, "paSystolique": 120, "paDiastolique": 75},
            "screening_results": {},
            "sa": 28,
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert "sections" in data
    assert "sa" in data
    assert data["sa"] == 28
    assert "model_used" in data
    assert "audit_hash" in data or "audit_input_hash" in data


def test_emergency_alert_dispatch():
    """Critical HTA triggers alert; with mock we could assert send_sms/send_email called."""
    dossier = {
        "calendar": {"items": []},
        "consultations": [{"paSystolique": 170, "paDiastolique": 115, "bcfBpm": 140}],
        "biologicalExams": [],
    }
    r = client.post("/api/prenatal-followup/evaluate", json={"dossier": dossier, "sa_courante": 28})
    assert r.status_code == 200
    data = r.json()
    assert any(a.get("severite") == "critical" for a in data.get("alertes", []))


def test_llm_narrative_fallback():
    """Evaluate returns a narrative (LLM or rule-based fallback)."""
    dossier = {"calendar": {"items": []}, "consultations": [], "biologicalExams": []}
    r = client.post("/api/prenatal-followup/evaluate", json={"dossier": dossier, "sa_courante": 28})
    assert r.status_code == 200
    data = r.json()
    assert "narrative" in data
    assert isinstance(data["narrative"], str)
    assert len(data["narrative"]) > 20
    assert "SA" in data["narrative"] or "calendrier" in data["narrative"].lower()

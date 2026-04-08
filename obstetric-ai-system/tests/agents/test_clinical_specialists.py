"""Tests Clinical Specialists (Prompt System v2, mode dégradé sans clé API)."""
import sys
from pathlib import Path
from unittest import mock

import pytest
from fastapi.testclient import TestClient

root = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(root))

from agents.clinical_specialists.src.main import app, SCREENINGS  # noqa: E402

client = TestClient(app)


@pytest.fixture(autouse=True)
def _force_degraded_llm():
    """Évite les appels Anthropic (clé .env invalide ou absente en CI)."""
    with mock.patch(
        "agents.clinical_specialists.src.main._anthropic_key_usable",
        return_value=False,
    ):
        yield


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["agent"] == "clinical-specialists"


def test_list_screenings():
    r = client.get("/api/clinical-specialists")
    assert r.status_code == 200
    data = r.json()
    assert len(data["screenings"]) == len(SCREENINGS)
    assert data["screenings"][0]["template"] == "PreeclampsiaPrompt"


@pytest.mark.parametrize(
    "suffix,template",
    [
        ("preeclampsia", "PreeclampsiaPrompt"),
        ("gestational-diabetes", "GestationalDiabetesPrompt"),
        ("postpartum-hemorrhage", "PHPrompt"),
        ("infection-screening", "InfectionScreeningPrompt"),
        ("perinatal-mental-health", "MentalHealthPrompt"),
        ("anemia-thromboprophylaxis", "AnemiaThromboPrompt"),
        ("fetal-doppler-biometry", "DopplerBiometryPrompt"),
    ],
)
def test_each_screening_degraded_without_api_key(suffix: str, template: str):
    r = client.post(
        f"/api/clinical-specialists/{suffix}",
        json={"clinical_context": "Patient test: PA 140/90 à 34 SA, pas de protéinurie."},
    )
    assert r.status_code == 200
    out = r.json()
    assert out["template_key"] == template
    assert out["hitl_required"] is True
    assert "narrative" in out
    assert out["agent_id"]
    # Sans clé API : message dégradé explicite
    assert "Mode dégradé" in out["narrative"] or "ANTHROPIC" in out["narrative"]

"""Unit tests for CTG Monitor Agent."""
import pytest
from fastapi.testclient import TestClient
import sys
from pathlib import Path
root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root))
from agents.ctg_monitor.src.main import app

client = TestClient(app)

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["agent"] == "ctg-monitor"

def test_ctg_classification_normal():
    r = client.post("/api/ctg-monitor", json={
        "baseline_bpm": 140,
        "stv_ms": 12,
        "decelerations_light": 0,
        "decelerations_severe": 0,
    })
    assert r.status_code == 200
    data = r.json()
    assert data["classification"] in ["Normal", "Suspect", "Pathologique"]
    assert 0 <= data["confidence"] <= 1
    assert "narrative" in data
    assert "fhir_observation" in data

def test_ctg_validation_rejects_out_of_range():
    r = client.post("/api/ctg-monitor", json={
        "baseline_bpm": 80,
        "stv_ms": 12,
    })
    assert r.status_code == 400

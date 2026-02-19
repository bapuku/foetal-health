"""Locust load test: 50 patients simultaneous, latency targets."""
from locust import HttpUser, task, between

class ObstetricUser(HttpUser):
    wait_time = between(1, 3)
    host = "http://ctg-monitor.obs-prod.svc.cluster.local:8000"

    @task(10)
    def health(self):
        self.client.get("/health")

    @task(5)
    def ctg_monitor(self):
        self.client.post("/api/ctg-monitor", json={
            "baseline_bpm": 135,
            "stv_ms": 10,
            "decelerations_light": 0.01,
            "decelerations_severe": 0,
        })

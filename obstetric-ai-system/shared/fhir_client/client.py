"""
FHIR R4 client for HAPI FHIR Server.
"""
import os
from typing import Any, Optional

FHIR_BASE_URL = os.getenv("FHIR_BASE_URL", "http://hapi-fhir.obs-fhir.svc.cluster.local:8080/fhir")


class FHIRClient:
    def __init__(self, base_url: Optional[str] = None):
        self.base_url = (base_url or FHIR_BASE_URL).rstrip("/")

    def get(self, resource_type: str, resource_id: str) -> dict:
        import urllib.request
        url = f"{self.base_url}/{resource_type}/{resource_id}"
        req = urllib.request.Request(url, headers={"Accept": "application/fhir+json"})
        with urllib.request.urlopen(req) as resp:
            import json
            return json.loads(resp.read().decode())

    def create(self, resource: dict) -> dict:
        import urllib.request
        import json
        url = f"{self.base_url}/{resource['resourceType']}"
        data = json.dumps(resource).encode()
        req = urllib.request.Request(url, data=data, method="POST", headers={"Content-Type": "application/fhir+json", "Accept": "application/fhir+json"})
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())

    def search(self, resource_type: str, params: Optional[dict] = None) -> dict:
        import urllib.request
        import urllib.parse
        q = "&".join(f"{k}={v}" for k, v in (params or {}).items())
        url = f"{self.base_url}/{resource_type}?{q}"
        req = urllib.request.Request(url, headers={"Accept": "application/fhir+json"})
        with urllib.request.urlopen(req) as resp:
            import json
            return json.loads(resp.read().decode())

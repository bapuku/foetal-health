"""
Audit trail with SHA-256 hash chain (tamper-evident).
"""
import hashlib
import json
import os
from datetime import datetime, timezone
from typing import Any, Optional

class AuditLogger:
    def __init__(self, storage_path: Optional[str] = None):
        self.storage_path = storage_path or os.getenv("AUDIT_STORAGE_PATH", "/tmp/audit")
        self._last_hash: Optional[str] = None

    def _sha256(self, data: str) -> str:
        return hashlib.sha256(data.encode()).hexdigest()

    def get_last_hash(self) -> Optional[str]:
        return self._last_hash

    def log_event(
        self,
        agent_id: str,
        action: str,
        input_hash: str,
        output_hash: str,
        model_version: Optional[str] = None,
        confidence: Optional[float] = None,
        human_decision: Optional[str] = None,
        latency_ms: Optional[int] = None,
    ) -> dict:
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "agent_id": agent_id,
            "action": action,
            "input_hash": input_hash,
            "output_hash": output_hash,
            "model_version": model_version or "",
            "confidence": confidence,
            "human_decision": human_decision,
            "latency_ms": latency_ms,
            "previous_hash": self._last_hash,
        }
        payload = json.dumps(entry, sort_keys=True)
        current_hash = self._sha256(payload)
        entry["hash"] = current_hash
        self._last_hash = current_hash
        os.makedirs(self.storage_path, exist_ok=True)
        path = os.path.join(self.storage_path, f"audit_{current_hash[:16]}.json")
        with open(path, "w") as f:
            json.dump(entry, f, indent=2)
        return entry

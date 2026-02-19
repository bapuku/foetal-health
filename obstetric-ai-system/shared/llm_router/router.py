"""
Multi-LLM router: route to optimal model by task, urgency, complexity.
Circuit breaker per provider; fallback chain.
"""
from enum import Enum
from typing import Any, Optional

class TaskType(str, Enum):
    REASONING = "reasoning"
    FAST_ANALYSIS = "fast_analysis"
    RESEARCH = "research"
    MULTIMODAL = "multimodal"
    FHIR_EXTRACTION = "fhir_extraction"
    EU_SOVEREIGN = "eu_sovereign"
    PRENATAL_ANALYSIS = "prenatal_analysis"
    DEFAULT = "default"

class LLMRouter:
    MODELS = {
        "claude-opus-4-5": {"tier": "premium", "latency_ms": 6000, "task": TaskType.REASONING},
        "claude-sonnet-4-5": {"tier": "standard+", "latency_ms": 1800, "task": TaskType.FAST_ANALYSIS},
        "claude-sonnet-4": {"tier": "standard", "latency_ms": 1500, "task": TaskType.FAST_ANALYSIS},
        "gpt-4o": {"tier": "multimodal", "latency_ms": 3000, "task": TaskType.MULTIMODAL},
        "gpt-5.2": {"tier": "ultra", "latency_ms": 8000, "task": TaskType.REASONING},
        "o3": {"tier": "ultra", "latency_ms": 15000, "task": TaskType.REASONING},
        "mistral-large": {"tier": "eu-sovereign", "latency_ms": 2000, "task": TaskType.EU_SOVEREIGN},
        "granite-medical": {"tier": "fhir", "latency_ms": 500, "task": TaskType.FHIR_EXTRACTION},
    }
    FALLBACK_CHAIN = ["claude-opus-4-5", "claude-sonnet-4-5", "claude-sonnet-4", "mistral-large"]
    # Map logical model id to API model string for providers
    API_MODEL_IDS = {
        "claude-opus-4-5": "claude-opus-4-5-20251101",
        "claude-sonnet-4-5": "claude-sonnet-4-20250514",
        "claude-sonnet-4": "claude-sonnet-4-20250514",
    }

    def __init__(self, failure_threshold: int = 3, reset_timeout_seconds: int = 60):
        self._failures: dict[str, int] = {}
        self._circuit_open: dict[str, float] = {}
        self.failure_threshold = failure_threshold
        self.reset_timeout = reset_timeout_seconds

    def route(
        self,
        task: TaskType = TaskType.DEFAULT,
        urgency: str = "normal",
        has_images: bool = False,
        complexity: str = "medium",
        data_sovereignty_eu: bool = False,
    ) -> str:
        if data_sovereignty_eu:
            return self._try_model("mistral-large")
        if has_images:
            return self._try_model("gpt-4o")
        if task == TaskType.FHIR_EXTRACTION:
            return self._try_model("granite-medical")
        if task == TaskType.PRENATAL_ANALYSIS:
            return self._try_model("claude-opus-4-5")
        if task == TaskType.FAST_ANALYSIS or urgency == "critical":
            return self._try_model("claude-sonnet-4-5")
        if task == TaskType.REASONING and complexity == "high":
            return self._try_model("o3")
        if task == TaskType.RESEARCH:
            return self._try_model("claude-opus-4-5")
        return self._try_model("claude-opus-4-5")

    def get_api_model_id(self, model_id: str) -> str:
        """Resolve logical model id to provider API model string."""
        return self.API_MODEL_IDS.get(model_id, model_id)

    def _try_model(self, model_id: str) -> str:
        import time
        if model_id in self._circuit_open:
            if time.time() - self._circuit_open[model_id] < self.reset_timeout:
                for fallback in self.FALLBACK_CHAIN:
                    if fallback != model_id and fallback not in self._circuit_open:
                        return fallback
            else:
                del self._circuit_open[model_id]
        return model_id

    def record_success(self, model_id: str) -> None:
        self._failures[model_id] = 0

    def record_failure(self, model_id: str) -> None:
        import time
        self._failures[model_id] = self._failures.get(model_id, 0) + 1
        if self._failures[model_id] >= self.failure_threshold:
            self._circuit_open[model_id] = time.time()


def route_llm(
    task: str = "default",
    urgency: str = "normal",
    has_images: bool = False,
    complexity: str = "medium",
) -> str:
    router = LLMRouter()
    task_enum = TaskType(task) if task in [t.value for t in TaskType] else TaskType.DEFAULT
    return router.route(task=task_enum, urgency=urgency, has_images=has_images, complexity=complexity)

"""Re-export for TorchServe / legacy imports; canonical definition is ``shared.ctg_model``."""
from shared.ctg_model.classifier import (  # noqa: F401
    CTGClassifier,
    INPUT_CHANNELS,
    INPUT_LEN,
    NUM_CLASSES,
    build_ctg_classifier,
)

__all__ = ["CTGClassifier", "INPUT_CHANNELS", "INPUT_LEN", "NUM_CLASSES", "build_ctg_classifier"]

"""Load tabular CTG classifier (fetal_health.csv features) for inference."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

import numpy as np
import torch

_MODEL: Optional[torch.nn.Module] = None
_PREPROC: Optional[dict] = None
_DEVICE = torch.device("cpu")


def _model_dir() -> Path:
    return Path(__file__).resolve().parent.parent / "model"


def _rows_to_sequences(X: np.ndarray, input_len: int) -> np.ndarray:
    n, n_feat = X.shape
    out = np.zeros((n, 1, input_len), dtype=np.float32)
    for i in range(n):
        row = X[i]
        for t in range(input_len):
            out[i, 0, t] = row[t % n_feat]
    return out


def model_available() -> bool:
    d = _model_dir()
    return (d / "ctg_classifier.pt").is_file() and (d / "preprocessor.json").is_file()


def _load() -> None:
    global _MODEL, _PREPROC
    if _MODEL is not None and _PREPROC is not None:
        return
    d = _model_dir()
    w_path = d / "ctg_classifier.pt"
    p_path = d / "preprocessor.json"
    if not w_path.is_file() or not p_path.is_file():
        raise FileNotFoundError("CTG model weights or preprocessor missing under model/")
    _PREPROC = json.loads(p_path.read_text(encoding="utf-8"))
    from shared.ctg_model.classifier import build_ctg_classifier

    ilen = int(_PREPROC["input_len"])
    m = build_ctg_classifier(input_len=ilen)
    try:
        state = torch.load(w_path, map_location=_DEVICE, weights_only=True)
    except TypeError:
        state = torch.load(w_path, map_location=_DEVICE)
    m.load_state_dict(state)
    m.eval()
    _MODEL = m.to(_DEVICE)


def predict_from_features(values: list[float]) -> tuple[int, float]:
    """Returns (class_index 0..2, confidence = max softmax)."""
    _load()
    assert _PREPROC is not None and _MODEL is not None
    cols = _PREPROC["feature_columns"]
    if len(values) != len(cols):
        raise ValueError(f"Expected {len(cols)} features, got {len(values)}")
    mean = np.array(_PREPROC["scaler_mean"], dtype=np.float32)
    scale = np.array(_PREPROC["scaler_scale"], dtype=np.float32)
    x = np.asarray(values, dtype=np.float32).reshape(1, -1)
    x = (x - mean) / np.maximum(scale, 1e-8)
    seq = _rows_to_sequences(x, int(_PREPROC["input_len"]))
    with torch.no_grad():
        logits = _MODEL(torch.from_numpy(seq).to(_DEVICE))
        proba = torch.softmax(logits, dim=-1)[0]
    conf = float(proba.max().item())
    cls = int(proba.argmax().item())
    return cls, conf

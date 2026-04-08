#!/usr/bin/env python3
"""Train CTG classifier on fetal_health.csv (UCI-style tabular features).

Improvements over the baseline script:
- Stratified train/validation split and held-out metrics (accuracy, F1 weighted).
- Per-feature standardization fit on the training set only.
- Class-weighted cross-entropy for imbalanced Normal / Suspect / Pathological.
- Mini-batch training with AdamW, optional LR scheduling, early stopping.
- Persists weights + preprocessor JSON for the ctg_monitor agent.
"""
from __future__ import annotations

import argparse
import json
import random
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# Repo paths (obstetric-ai-system root must be on path for ``shared.ctg_model``)
_ML_DIR = Path(__file__).resolve().parent
_OBS_ROOT = _ML_DIR.parent
sys.path.insert(0, str(_OBS_ROOT))
from shared.ctg_model.classifier import build_ctg_classifier, INPUT_LEN  # noqa: E402


def _repo_root() -> Path:
    return _ML_DIR.parent.parent


def _default_data_path() -> Path:
    return _repo_root() / "fetal_health.csv"


def _default_out_dir() -> Path:
    return _ML_DIR.parent / "agents" / "ctg_monitor" / "model"


def load_csv(path: Path) -> tuple[pd.DataFrame, np.ndarray, list[str]]:
    """Load CSV; supports ``;`` or ``,`` separators. Returns X frame, y int 0..2, feature names."""
    text = path.read_text(encoding="utf-8", errors="replace")
    sep = ";" if text.count(";") > text.count(",") else ","
    df = pd.read_csv(path, sep=sep)
    target_col = "fetal_health"
    if target_col not in df.columns:
        raise ValueError(f"Missing column {target_col!r} in {path}")
    # 1=normal, 2=suspect, 3=pathological -> 0,1,2
    y = (df[target_col].astype(int) - 1).to_numpy()
    feat_cols = [c for c in df.columns if c != target_col]
    X = df[feat_cols].astype(np.float32)
    return X, y, feat_cols


def rows_to_sequences(X: np.ndarray, input_len: int = INPUT_LEN) -> np.ndarray:
    """Repeat each feature row along time to match the 1D-CNN+LSTM input (B, 1, T)."""
    n, n_feat = X.shape
    out = np.zeros((n, 1, input_len), dtype=np.float32)
    for i in range(n):
        row = X[i]
        for t in range(input_len):
            out[i, 0, t] = row[t % n_feat]
    return out


def set_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def main() -> None:
    p = argparse.ArgumentParser(description="Train CTG classifier on fetal_health.csv")
    p.add_argument("--data", type=Path, default=None, help="Path to fetal_health.csv")
    p.add_argument("--out-dir", type=Path, default=None, help="Directory for model.pt + preprocessor.json")
    p.add_argument("--epochs", type=int, default=120)
    p.add_argument("--batch-size", type=int, default=64)
    p.add_argument("--lr", type=float, default=1e-3)
    p.add_argument("--weight-decay", type=float, default=0.02)
    p.add_argument("--val-size", type=float, default=0.2)
    p.add_argument("--patience", type=int, default=25, help="Early stopping patience (epochs)")
    p.add_argument("--seed", type=int, default=42)
    p.add_argument("--mlflow-uri", default="")
    args = p.parse_args()

    data_path = args.data or _default_data_path()
    out_dir = args.out_dir or _default_out_dir()
    out_dir.mkdir(parents=True, exist_ok=True)

    if not data_path.is_file():
        raise FileNotFoundError(f"Dataset not found: {data_path}")

    set_seed(args.seed)

    if args.mlflow_uri:
        try:
            import mlflow

            mlflow.set_tracking_uri(args.mlflow_uri)
            mlflow.set_experiment("ctg_classifier")
            mlflow.start_run()
        except Exception as e:
            print(f"[warn] MLflow disabled: {e}", flush=True)

    X_df, y, feature_columns = load_csv(data_path)
    X_np = X_df.to_numpy()
    X_tr, X_va, y_tr, y_va = train_test_split(
        X_np, y, test_size=args.val_size, random_state=args.seed, stratify=y
    )

    scaler = StandardScaler()
    X_tr_s = scaler.fit_transform(X_tr).astype(np.float32)
    X_va_s = scaler.transform(X_va).astype(np.float32)

    seq_tr = rows_to_sequences(X_tr_s)
    seq_va = rows_to_sequences(X_va_s)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    X_tr_t = torch.from_numpy(seq_tr).to(device)
    y_tr_t = torch.from_numpy(y_tr.astype(np.int64)).to(device)
    X_va_t = torch.from_numpy(seq_va).to(device)
    y_va_t = torch.from_numpy(y_va.astype(np.int64)).to(device)

    model = build_ctg_classifier().to(device)

    counts = np.bincount(y_tr, minlength=3)
    class_weights = (len(y_tr) / (3 * np.maximum(counts, 1))).astype(np.float32)
    criterion = nn.CrossEntropyLoss(weight=torch.from_numpy(class_weights).to(device))

    opt = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=args.weight_decay)
    sched = torch.optim.lr_scheduler.ReduceLROnPlateau(opt, mode="min", factor=0.5, patience=8)

    n = len(X_tr_t)
    best_val = float("inf")
    best_state: dict | None = None
    stale = 0

    for epoch in range(args.epochs):
        model.train()
        perm = torch.randperm(n, device=device)
        epoch_loss = 0.0
        steps = 0
        for start in range(0, n, args.batch_size):
            idx = perm[start : start + args.batch_size]
            xb = X_tr_t[idx]
            yb = y_tr_t[idx]
            opt.zero_grad(set_to_none=True)
            logits = model(xb)
            loss = criterion(logits, yb)
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            opt.step()
            epoch_loss += loss.item()
            steps += 1

        model.eval()
        with torch.no_grad():
            val_logits = model(X_va_t)
            val_loss = criterion(val_logits, y_va_t).item()
        sched.step(val_loss)

        if (epoch + 1) % 5 == 0 or epoch == 0:
            avg_tr = epoch_loss / max(steps, 1)
            print(f"Epoch {epoch + 1}/{args.epochs} train_loss={avg_tr:.4f} val_loss={val_loss:.4f}", flush=True)

        if val_loss < best_val - 1e-5:
            best_val = val_loss
            best_state = {k: v.detach().cpu().clone() for k, v in model.state_dict().items()}
            stale = 0
        else:
            stale += 1
            if stale >= args.patience:
                print(f"Early stop at epoch {epoch + 1} (best val_loss={best_val:.4f})", flush=True)
                break

    if best_state is not None:
        model.load_state_dict(best_state)

    model.eval()
    with torch.no_grad():
        pred = model(X_va_t).argmax(dim=-1).cpu().numpy()
    acc = accuracy_score(y_va, pred)
    f1w = f1_score(y_va, pred, average="weighted", zero_division=0)
    print(f"Validation accuracy={acc:.4f} weighted_f1={f1w:.4f}", flush=True)

    weights_path = out_dir / "ctg_classifier.pt"
    preproc_path = out_dir / "preprocessor.json"
    metrics_path = out_dir / "training_metrics.json"

    torch.save(model.state_dict(), weights_path)

    preproc = {
        "feature_columns": feature_columns,
        "scaler_mean": scaler.mean_.astype(float).tolist(),
        "scaler_scale": scaler.scale_.astype(float).tolist(),
        "num_classes": 3,
        "input_len": INPUT_LEN,
        "class_names": ["Normal", "Suspect", "Pathologique"],
        "train_rows": int(len(y_tr)),
        "val_rows": int(len(y_va)),
        "data_path": str(data_path.resolve()),
    }
    preproc_path.write_text(json.dumps(preproc, indent=2), encoding="utf-8")

    metrics = {
        "val_accuracy": float(acc),
        "val_f1_weighted": float(f1w),
        "best_val_loss": float(best_val),
        "epochs_ran": int(epoch + 1),
    }
    metrics_path.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(f"Saved {weights_path}", flush=True)
    print(f"Saved {preproc_path}", flush=True)

    if args.mlflow_uri:
        try:
            import mlflow

            mlflow.log_params(
                {
                    "epochs": args.epochs,
                    "batch_size": args.batch_size,
                    "lr": args.lr,
                    "weight_decay": args.weight_decay,
                    "seed": args.seed,
                }
            )
            mlflow.log_metrics({"val_accuracy": acc, "val_f1_weighted": f1w, "best_val_loss": best_val})
            mlflow.end_run()
        except Exception:
            pass


if __name__ == "__main__":
    main()

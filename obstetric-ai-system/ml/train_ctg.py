#!/usr/bin/env python3
"""Train CTG classifier on fetal_health.csv. Log to MLflow."""
import argparse
import numpy as np
import pandas as pd
import torch
from pathlib import Path

# Add parent for imports
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
from models.ctg_classifier import build_ctg_classifier, INPUT_LEN

def load_csv(path: str) -> tuple:
    df = pd.read_csv(path, sep=';')
    # fetal_health: 1=normal, 2=suspect, 3=pathological -> 0,1,2
    y = (df["fetal_health"].astype(int) - 1).values
    # Use time-series-like features: repeat row to form pseudo-sequence (in production use real FHR)
    cols = [c for c in df.columns if c != "fetal_health"]
    X = df[cols].values.astype(np.float32)
    # Pad/truncate to INPUT_LEN
    seq_len = min(INPUT_LEN, X.shape[1])
    X_seq = np.zeros((len(X), 1, INPUT_LEN), dtype=np.float32)
    for i in range(len(X)):
        row = X[i]
        for t in range(INPUT_LEN):
            X_seq[i, 0, t] = row[t % len(row)]
    return torch.from_numpy(X_seq), torch.from_numpy(y).long()

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--data", default="fetal_health.csv")
    p.add_argument("--epochs", type=int, default=5)
    p.add_argument("--lr", type=float, default=1e-3)
    p.add_argument("--mlflow-uri", default="http://localhost:5000")
    args = p.parse_args()
    try:
        import mlflow
        mlflow.set_tracking_uri(args.mlflow_uri)
        mlflow.set_experiment("ctg_classifier")
    except Exception:
        pass
    X, y = load_csv(args.data)
    model = build_ctg_classifier()
    opt = torch.optim.AdamW(model.parameters(), lr=args.lr)
    for epoch in range(args.epochs):
        model.train()
        opt.zero_grad()
        out = model(X)
        loss = torch.nn.functional.cross_entropy(out, y)
        loss.backward()
        opt.step()
        print(f"Epoch {epoch+1} loss={loss.item():.4f}")
    torch.save(model.state_dict(), "ctg_classifier.pt")
    print("Saved ctg_classifier.pt")

if __name__ == "__main__":
    main()

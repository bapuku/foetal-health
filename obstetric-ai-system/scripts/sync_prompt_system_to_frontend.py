#!/usr/bin/env python3
"""Copie prompt_system_v2.json vers frontend/lib/data/ après édition du YAML/JSON source."""
from pathlib import Path

root = Path(__file__).resolve().parent.parent
src = root / "shared" / "prompt_system" / "prompt_system_v2.json"
dst = root / "frontend" / "lib" / "data" / "prompt_system_v2.json"
dst.parent.mkdir(parents=True, exist_ok=True)
dst.write_bytes(src.read_bytes())
print(f"Copied {src} -> {dst} ({dst.stat().st_size} bytes)")

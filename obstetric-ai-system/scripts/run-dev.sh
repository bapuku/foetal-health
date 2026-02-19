#!/bin/bash
# Lancer le développement complet : backend (agents) + frontend
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== Obstetric AI - Développement complet ==="
echo "Racine: $ROOT"
echo ""

# 1. Venv Python
if [ ! -d ".venv" ]; then
  echo "Création venv..."
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install -q -r requirements-dev.txt

# 2. Backend - CTG Monitor (port 8000)
echo "Démarrage CTG Monitor sur http://localhost:8000"
PYTHONPATH=. uvicorn agents.ctg_monitor.src.main:app --host 0.0.0.0 --port 8000 &
CTG_PID=$!
sleep 2

# 3. Backend - Apgar (port 8001)
echo "Démarrage Apgar Transition sur http://localhost:8001"
PYTHONPATH=. uvicorn src.main:app --host 0.0.0.0 --port 8001 --app-dir agents/apgar-transition &
APGAR_PID=$!
sleep 1

# 4. Frontend
echo "Démarrage Frontend Next.js sur http://localhost:3000"
cd frontend
if [ ! -d "node_modules" ]; then
  npm install
fi
npm run dev &
FRONT_PID=$!
cd "$ROOT"

echo ""
echo "=== Services démarrés ==="
echo "  Frontend:    http://localhost:3000"
echo "  CTG Monitor: http://localhost:8000  (docs: http://localhost:8000/docs)"
echo "  Apgar:       http://localhost:8001 (docs: http://localhost:8001/docs)"
echo ""
echo "Arrêter: kill $CTG_PID $APGAR_PID $FRONT_PID"
wait

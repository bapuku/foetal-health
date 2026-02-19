#!/usr/bin/env bash
# ============================================================
#  Obstetric AI System - Arrêt propre de tous les services
#  Usage :  ./stop.sh
# ============================================================
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
PIDFILE="$ROOT/.pids"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC}  $1"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }

echo ""
echo -e "${BOLD}${CYAN}  Obstetric AI System - Arrêt des services${NC}"
echo ""

stopped=0

# Arrêt via le fichier .pids
if [ -f "$PIDFILE" ]; then
  while IFS= read -r pid; do
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null
      ok "Arrêté PID $pid"
      stopped=$((stopped + 1))
    fi
  done < "$PIDFILE"
  rm -f "$PIDFILE"
fi

# Arrêt des uvicorn restants liés au projet
for pid in $(pgrep -f "uvicorn.*agents\." 2>/dev/null || true); do
  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null
    ok "Arrêté uvicorn PID $pid"
    stopped=$((stopped + 1))
  fi
done

# Arrêt du frontend Next.js sur le port 3000
for pid in $(lsof -t -i :3000 2>/dev/null || true); do
  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null
    ok "Arrêté frontend PID $pid (port 3000)"
    stopped=$((stopped + 1))
  fi
done

# Arrêt des ports 8000-8009
for port in $(seq 8000 8009); do
  for pid in $(lsof -t -i :"$port" 2>/dev/null || true); do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null
      ok "Arrêté PID $pid (port $port)"
      stopped=$((stopped + 1))
    fi
  done
done

echo ""
if [ "$stopped" -gt 0 ]; then
  ok "Tous les services arrêtés ($stopped processus)"
else
  info "Aucun service en cours d'exécution"
fi
echo ""

#!/usr/bin/env bash
# ============================================================
#  Obstetric AI System - Lancement automatique complet
#  Usage :  ./start.sh          (lance tout)
#           ./start.sh backend  (backend uniquement)
#           ./start.sh frontend (frontend uniquement)
# ============================================================
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

PIDFILE="$ROOT/.pids"
LOGDIR="$ROOT/logs"
mkdir -p "$LOGDIR"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC}  $1"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
err()   { echo -e "${RED}[ERR]${NC}   $1"; }

banner() {
  echo ""
  echo -e "${BOLD}${CYAN}=====================================================${NC}"
  echo -e "${BOLD}${CYAN}   Obstetric AI System - Lancement automatique${NC}"
  echo -e "${BOLD}${CYAN}=====================================================${NC}"
  echo ""
}

# ── Nettoyage des anciens processus ──────────────────────────
cleanup_old() {
  if [ -f "$PIDFILE" ]; then
    warn "Processus précédents détectés, arrêt..."
    while IFS= read -r pid; do
      kill "$pid" 2>/dev/null && info "Arrêté PID $pid" || true
    done < "$PIDFILE"
    rm -f "$PIDFILE"
    sleep 1
  fi
}

# ── 1. Credentials (.env) ───────────────────────────────────
check_credentials() {
  if [ ! -f "$ROOT/.env" ]; then
    warn "Fichier .env introuvable - lancement de la configuration..."
    bash "$ROOT/scripts/setup-credentials.sh"
  else
    ok ".env trouvé"
    if grep -q "HUGGINGFACE_HUB_TOKEN=$" "$ROOT/.env" && grep -q "ANTHROPIC_API_KEY=$" "$ROOT/.env"; then
      warn "Les clés API sont vides dans .env"
      echo -e "  Exécutez ${BOLD}./run-setup-credentials.sh${NC} pour les configurer"
    fi
  fi
}

# ── 2. Environnement Python ─────────────────────────────────
setup_python() {
  info "Configuration de l'environnement Python..."
  if [ ! -d "$ROOT/.venv" ]; then
    info "Création du virtualenv..."
    python3 -m venv "$ROOT/.venv"
    ok "Virtualenv créé"
  fi
  source "$ROOT/.venv/bin/activate"
  ok "Virtualenv activé (.venv)"

  info "Installation des dépendances Python..."
  pip install -q --upgrade pip 2>/dev/null
  pip install -q -r "$ROOT/requirements-dev.txt" 2>/dev/null
  ok "Dépendances Python installées"
}

# ── 3. Lancement des agents backend ─────────────────────────
# Agents avec tirets (nom de dossier) : --app-dir obligatoire
# Agent ctg_monitor (underscore) : import classique PYTHONPATH
start_agent() {
  local name="$1"
  local dir="$2"
  local port="$3"

  if lsof -i :"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    warn "$name déjà en cours sur le port $port, ignoré"
    return
  fi

  local logfile="$LOGDIR/${name}.log"

  if [ "$dir" = "ctg_monitor" ]; then
    PYTHONPATH="$ROOT" nohup "$ROOT/.venv/bin/uvicorn" \
      "agents.ctg_monitor.src.main:app" \
      --host 0.0.0.0 --port "$port" \
      > "$logfile" 2>&1 &
  else
    PYTHONPATH="$ROOT" nohup "$ROOT/.venv/bin/uvicorn" \
      "src.main:app" \
      --host 0.0.0.0 --port "$port" \
      --app-dir "$ROOT/agents/$dir" \
      > "$logfile" 2>&1 &
  fi

  local pid=$!
  echo "$pid" >> "$PIDFILE"
  ok "$name  ->  port $port  (PID $pid, log: logs/${name}.log)"
}

start_backend() {
  info "Lancement des 10 agents backend..."
  echo ""

  start_agent "ctg-monitor"        "ctg_monitor"       8000
  start_agent "apgar-transition"   "apgar-transition"   8001
  start_agent "symbolic-reasoning" "symbolic-reasoning"  8002
  start_agent "polygraph-verifier" "polygraph-verifier"  8003
  start_agent "bishop-partogram"   "bishop-partogram"    8004
  start_agent "rciu-risk"          "rciu-risk"           8005
  start_agent "quantum-optimizer"  "quantum-optimizer"   8006
  start_agent "mother-baby-risk"   "mother-baby-risk"    8007
  start_agent "clinical-narrative" "clinical-narrative"  8008
  start_agent "user-engagement"    "user-engagement"     8009

  echo ""
}

# ── 4. Frontend Next.js ──────────────────────────────────────
setup_frontend() {
  info "Configuration du frontend Next.js..."

  if [ ! -d "$ROOT/frontend/node_modules" ]; then
    info "Installation des dépendances npm..."
    (cd "$ROOT/frontend" && npm install --silent 2>/dev/null)
    ok "Dépendances npm installées"
  else
    ok "node_modules déjà présent"
  fi

  if [ ! -f "$ROOT/frontend/.env.local" ]; then
    info "Création de frontend/.env.local depuis .env..."
    grep "^NEXT_PUBLIC_" "$ROOT/.env" > "$ROOT/frontend/.env.local" 2>/dev/null || true
  fi
}

start_frontend() {
  if lsof -i :3000 -sTCP:LISTEN >/dev/null 2>&1; then
    warn "Frontend déjà en cours sur le port 3000, ignoré"
    return
  fi

  local logfile="$LOGDIR/frontend.log"
  (cd "$ROOT/frontend" && nohup npx next dev --port 3000 > "$logfile" 2>&1 &)
  local pid=$!
  echo "$pid" >> "$PIDFILE"
  ok "Frontend Next.js  ->  port 3000  (PID $pid, log: logs/frontend.log)"
}

# ── 5. Health checks ────────────────────────────────────────
health_checks() {
  echo ""
  info "Health checks (attente 5s pour le démarrage)..."
  sleep 5

  local agents=(
    "CTG Monitor:8000"
    "Apgar Transition:8001"
    "Symbolic Reasoning:8002"
    "Polygraph Verifier:8003"
    "Bishop Partogram:8004"
    "RCIU Risk:8005"
    "Quantum Optimizer:8006"
    "Mother-Baby Risk:8007"
    "Clinical Narrative:8008"
    "User Engagement:8009"
  )

  local all_ok=1
  for entry in "${agents[@]}"; do
    local name="${entry%%:*}"
    local port="${entry##*:}"
    if curl -s -o /dev/null -w "" --max-time 2 "http://localhost:${port}/health" 2>/dev/null; then
      ok "$name (port $port) - UP"
    else
      err "$name (port $port) - DOWN  (voir logs/${name// /-}.log)"
      all_ok=0
    fi
  done

  echo ""
  if [ "$all_ok" = "1" ]; then
    ok "Tous les agents sont UP"
  else
    warn "Certains agents ne répondent pas encore, vérifier les logs dans $LOGDIR/"
  fi
}

# ── 6. Résumé final ─────────────────────────────────────────
summary() {
  echo ""
  echo -e "${BOLD}${GREEN}=====================================================${NC}"
  echo -e "${BOLD}${GREEN}   Système lancé avec succès !${NC}"
  echo -e "${BOLD}${GREEN}=====================================================${NC}"
  echo ""
  echo -e "  ${BOLD}Frontend${NC}           : ${CYAN}http://localhost:3000${NC}"
  echo -e "  ${BOLD}CTG Monitor API${NC}    : ${CYAN}http://localhost:8000/docs${NC}"
  echo -e "  ${BOLD}Apgar API${NC}          : ${CYAN}http://localhost:8001/docs${NC}"
  echo -e "  ${BOLD}Symbolic Reasoning${NC} : ${CYAN}http://localhost:8002/docs${NC}"
  echo -e "  ${BOLD}Polygraph Verifier${NC} : ${CYAN}http://localhost:8003/docs${NC}"
  echo -e "  ${BOLD}Bishop Partogram${NC}   : ${CYAN}http://localhost:8004/docs${NC}"
  echo -e "  ${BOLD}RCIU Risk${NC}          : ${CYAN}http://localhost:8005/docs${NC}"
  echo -e "  ${BOLD}Quantum Optimizer${NC}  : ${CYAN}http://localhost:8006/docs${NC}"
  echo -e "  ${BOLD}Mother-Baby Risk${NC}   : ${CYAN}http://localhost:8007/docs${NC}"
  echo -e "  ${BOLD}Clinical Narrative${NC} : ${CYAN}http://localhost:8008/docs${NC}"
  echo -e "  ${BOLD}User Engagement${NC}    : ${CYAN}http://localhost:8009/docs${NC}"
  echo ""
  echo -e "  ${BOLD}Logs${NC}               : ${CYAN}$LOGDIR/${NC}"
  echo -e "  ${BOLD}Arrêter tout${NC}       : ${CYAN}./stop.sh${NC}"
  echo ""
}

# ── Main ─────────────────────────────────────────────────────
MODE="${1:-all}"
banner
cleanup_old

case "$MODE" in
  backend)
    check_credentials
    setup_python
    start_backend
    health_checks
    ;;
  frontend)
    setup_frontend
    start_frontend
    ;;
  all|*)
    check_credentials
    setup_python
    start_backend
    setup_frontend
    start_frontend
    health_checks
    summary
    ;;
esac

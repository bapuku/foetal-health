#!/usr/bin/env bash
# ============================================================================
# Build → Commit (si changements) → Push → Redéploiement VPS
# Usage: ./release.sh [--no-push] [--no-deploy]
#   --no-push   : build + commit uniquement (pas de push)
#   --no-deploy : build + commit + push, sans lancer deploy.sh
#
# VPS : si le dépôt GitHub est privé, configurer sur le VPS une clé SSH
#       (deploy key) ou GIT_SSH_COMMAND avec token pour que git clone fonctionne.
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()  { echo -e "${BLUE}[INFO]${NC} $*"; }
ok()    { echo -e "${GREEN}[OK]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }

DO_PUSH=true
DO_DEPLOY=true
for arg in "$@"; do
  case "$arg" in
    --no-push)   DO_PUSH=false ;;
    --no-deploy) DO_DEPLOY=false ;;
  esac
done

# ── 1. Build frontend ───────────────────────────────────
info "Building frontend..."
cd frontend
npm run build
cd ..
ok "Frontend build OK"

# ── 2. Git commit (si changements) ──────────────────────
if ! git diff --quiet 2>/dev/null || ! git diff --cached --quiet 2>/dev/null; then
  info "Uncommitted changes detected. Staging and committing..."
  git add -A
  git status --short
  git commit -m "release: build and deploy $(date +%Y-%m-%d_%H:%M)"
  ok "Committed."
else
  info "No local changes to commit."
fi

# ── 3. Push ────────────────────────────────────────────
if [ "$DO_PUSH" = true ]; then
  info "Pushing to origin..."
  git push origin main
  ok "Pushed."
else
  warn "Skipping push (--no-push)."
fi

# ── 4. Deploy VPS ──────────────────────────────────────
if [ "$DO_DEPLOY" = true ]; then
  info "Deploying to VPS (SSH + pull + docker compose up --build)..."
  ./deploy.sh
  ok "Deploy finished."
else
  warn "Skipping deploy (--no-deploy). Run ./deploy.sh to deploy."
fi

echo ""
ok "Done: build + push + deploy."

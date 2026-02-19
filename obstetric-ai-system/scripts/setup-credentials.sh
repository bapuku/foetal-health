#!/usr/bin/env bash
# Script automatique pour saisir et enregistrer les credentials (génère .env)
# Mistral et IBM Granite sont utilisés via Hugging Face (HUGGINGFACE_HUB_TOKEN).
#
# Usage (depuis le terminal) :
#   cd "/Users/spialpha/Library/Mobile Documents/com~apple~CloudDocs/AGENTIC MEDTECH/FOETAL HEALTH/obstetric-ai-system"
#   ./run-setup-credentials.sh
#
# Ou : ./scripts/setup-credentials.sh
# Ou avec variables d'environnement : ANTHROPIC_API_KEY=sk-... ./scripts/setup-credentials.sh

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
ENV_FILE="$ROOT/.env"

echo "=============================================="
echo "  Obstetric AI - Configuration des credentials"
echo "=============================================="
echo "Fichier de sortie: $ENV_FILE"
echo "  - Claude (Anthropic), OpenAI : clés API respectives"
echo "  - Mistral, Granite : via Hugging Face (HUGGINGFACE_HUB_TOKEN)"
echo ""

# Mode non-interactif si au moins ANTHROPIC_API_KEY est défini (ex: CI ou export)
if [ -n "$ANTHROPIC_API_KEY" ] && [ -z "${PS1:-}" ]; then
  USE_DEFAULTS=1
elif [ -n "$ANTHROPIC_API_KEY" ] && ! [ -t 0 ]; then
  USE_DEFAULTS=1
else
  USE_DEFAULTS=0
fi

prompt_val() {
  local key="$1"
  local prompt="$2"
  local secret="${3:-0}"
  local default="${4:-}"
  local val=""
  if [ -n "${!key}" ]; then
    val="${!key}"
  elif [ "$USE_DEFAULTS" = "1" ] && [ -n "$default" ]; then
    val="$default"
  elif [ "$USE_DEFAULTS" = "1" ]; then
    val=""
  else
    if [ -n "$default" ]; then
      read -r -p "$prompt [$default] (Enter = garder): " input
      val="${input:-$default}"
    else
      if [ "$secret" = "1" ]; then
        read -r -s -p "$prompt: " val
        echo ""
      else
        read -r -p "$prompt: " val
      fi
    fi
  fi
  echo "$val"
}

# Collecte
ANTHROPIC=$(prompt_val "ANTHROPIC_API_KEY" "ANTHROPIC_API_KEY (Claude)" 1 "")
OPENAI=$(prompt_val "OPENAI_API_KEY" "OPENAI_API_KEY (OpenAI)" 1 "")
HF_TOKEN=$(prompt_val "HUGGINGFACE_HUB_TOKEN" "HUGGINGFACE_HUB_TOKEN (Mistral + Granite via Hugging Face)" 1 "")
FHIR_URL=$(prompt_val "FHIR_BASE_URL" "FHIR_BASE_URL" 0 "http://localhost:8080/fhir")
[ -z "$FHIR_URL" ] && FHIR_URL="http://localhost:8080/fhir"
AUDIT_PATH=$(prompt_val "AUDIT_STORAGE_PATH" "AUDIT_STORAGE_PATH" 0 "./audit_logs")
[ -z "$AUDIT_PATH" ] && AUDIT_PATH="./audit_logs"
CTG_URL=$(prompt_val "NEXT_PUBLIC_CTG_API_URL" "NEXT_PUBLIC_CTG_API_URL" 0 "http://localhost:8000")
[ -z "$CTG_URL" ] && CTG_URL="http://localhost:8000"
APGAR_URL=$(prompt_val "NEXT_PUBLIC_APGAR_API_URL" "NEXT_PUBLIC_APGAR_API_URL" 0 "http://localhost:8001")
[ -z "$APGAR_URL" ] && APGAR_URL="http://localhost:8001"

# Écriture .env
mkdir -p "$(dirname "$ENV_FILE")"
{
  echo "# Généré par scripts/setup-credentials.sh - Ne pas commiter"
  echo "# Mistral et IBM Granite : via Hugging Face (HUGGINGFACE_HUB_TOKEN)"
  echo ""
  echo "ANTHROPIC_API_KEY=$ANTHROPIC"
  echo "OPENAI_API_KEY=$OPENAI"
  echo "HUGGINGFACE_HUB_TOKEN=$HF_TOKEN"
  echo "FHIR_BASE_URL=$FHIR_URL"
  echo "AUDIT_STORAGE_PATH=$AUDIT_PATH"
  echo ""
  echo "NEXT_PUBLIC_CTG_API_URL=$CTG_URL"
  echo "NEXT_PUBLIC_APGAR_API_URL=$APGAR_URL"
  echo "NEXT_PUBLIC_FHIR_BASE_URL=$FHIR_URL"
} > "$ENV_FILE"
chmod 600 "$ENV_FILE" 2>/dev/null || true

# Frontend: .env.local pour Next.js
FRONTEND_ENV="$ROOT/frontend/.env.local"
{
  echo "# Généré par setup-credentials.sh - Ne pas commiter"
  echo "NEXT_PUBLIC_CTG_API_URL=$CTG_URL"
  echo "NEXT_PUBLIC_APGAR_API_URL=$APGAR_URL"
  echo "NEXT_PUBLIC_FHIR_BASE_URL=$FHIR_URL"
} > "$FRONTEND_ENV"
chmod 600 "$FRONTEND_ENV" 2>/dev/null || true

echo ""
echo "Credentials enregistrés dans:"
echo "  - $ENV_FILE (backend)"
echo "  - $FRONTEND_ENV (frontend Next.js)"
echo "Mistral / Granite : utiliser HUGGINGFACE_HUB_TOKEN (https://huggingface.co/settings/tokens)"
echo "Les agents Python chargent .env au démarrage. Redémarrer le frontend pour NEXT_PUBLIC_*."

#!/usr/bin/env bash
# Raccourci pour lancer la configuration des credentials depuis la racine du projet.
# Usage (depuis le terminal) :
#   cd "chemin/vers/obstetric-ai-system"
#   ./run-setup-credentials.sh
cd "$(dirname "$0")"
exec bash ./scripts/setup-credentials.sh

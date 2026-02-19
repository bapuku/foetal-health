# Configuration des credentials depuis le terminal

Mistral et IBM Granite sont utilisés **via Hugging Face** (token : `HUGGINGFACE_HUB_TOKEN`).  
Obtenir un token : https://huggingface.co/settings/tokens

## Commande à exécuter

Ouvrez votre terminal, puis copiez-collez :

```bash
cd "/Users/spialpha/Library/Mobile Documents/com~apple~CloudDocs/AGENTIC MEDTECH/FOETAL HEALTH/obstetric-ai-system"
./run-setup-credentials.sh
```

Ou directement le script :

```bash
cd "/Users/spialpha/Library/Mobile Documents/com~apple~CloudDocs/AGENTIC MEDTECH/FOETAL HEALTH/obstetric-ai-system"
./scripts/setup-credentials.sh
```

## Avec bash explicitement

```bash
cd "/Users/spialpha/Library/Mobile Documents/com~apple~CloudDocs/AGENTIC MEDTECH/FOETAL HEALTH/obstetric-ai-system"
bash scripts/setup-credentials.sh
```

## Données demandées

- **ANTHROPIC_API_KEY** (Claude)
- **OPENAI_API_KEY** (OpenAI)
- **HUGGINGFACE_HUB_TOKEN** (Mistral + Granite via Hugging Face)
- URLs (valeurs par défaut proposées)

## Résultat

- Création de `.env` (racine) et `frontend/.env.local`.
- Vous pouvez relancer le script pour modifier les valeurs.

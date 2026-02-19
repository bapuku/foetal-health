# Obstetric AI System - Santé Fœtale et Intelligence Obstétricale

Système agentique pour la surveillance fœto-maternelle, conforme EU MDR Classe IIb et EU AI Act (haut risque).

## Structure

- **terraform/** – Infrastructure OVH (MKS, storage, KMS)
- **k8s/base/** – Manifests Kubernetes (PostgreSQL, HAPI FHIR, Redis, MinIO, NATS, Airflow, MLflow, TorchServe, Network Policies, cert-manager, ESO, monitoring)
- **agents/** – 10 microservices (CTG Monitor, Apgar, Symbolic Reasoning, Polygraph, Bishop, RCIU, Quantum Optimizer, Mother-Baby Risk, Clinical Narrative, User Engagement)
- **shared/** – LLM router, FHIR client, audit logger (SHA-256 hash chain), anonymization (k-anonymity, differential privacy), FHIR Consent
- **orchestrator/dags/** – DAG Airflow (pipeline avec HITL)
- **frontend/** – Next.js 15 (CTGChart, RiskDashboard, ExplainabilityView, auth)
- **ml/** – Modèles CTG (PyTorch), Cesarean (XGBoost), entraînement, Feast feature repo
- **feast/feature_repo/** – Définitions de features (maternal, fetal, labor)
- **tests/** – Pytest (CTG agent), fixtures FHIR, Locust
- **docs/** – ADR, manuel clinicien, runbooks, EU MDR, EU AI Act, pilote, certification
- **.github/workflows/ci.yml** – CI (test, Bandit, Safety, build Docker, Trivy)
- **argocd/applications/** – ArgoCD Application production

## Configurer les credentials (script à exécuter dans le terminal)

Mistral et IBM Granite : **via Hugging Face** (`HUGGINGFACE_HUB_TOKEN`). Token : https://huggingface.co/settings/tokens

**Commande à exécuter dans le terminal :**

```bash
cd "/Users/spialpha/Library/Mobile Documents/com~apple~CloudDocs/AGENTIC MEDTECH/FOETAL HEALTH/obstetric-ai-system"
./run-setup-credentials.sh
```

Ou depuis la racine du projet :

```bash
./scripts/setup-credentials.sh
```

Le script demande : Anthropic, OpenAI, **Hugging Face** (Mistral + Granite), puis les URLs. Il crée :

- **`.env`** (backend) : `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `HUGGINGFACE_HUB_TOKEN`, `FHIR_BASE_URL`, etc.
- **`frontend/.env.local`** : `NEXT_PUBLIC_CTG_API_URL`, `NEXT_PUBLIC_APGAR_API_URL` pour le frontend.

Sans interaction (CI ou déjà en env) :

```bash
ANTHROPIC_API_KEY=sk-... HUGGINGFACE_HUB_TOKEN=hf_... ./scripts/setup-credentials.sh
```

Les agents Python chargent `.env` au démarrage (python-dotenv). Ne jamais commiter `.env` ni `frontend/.env.local`.

## Lancer tout automatiquement (une seule commande)

```bash
cd "/Users/spialpha/Library/Mobile Documents/com~apple~CloudDocs/AGENTIC MEDTECH/FOETAL HEALTH/obstetric-ai-system"
./start.sh
```

Le script `start.sh` fait tout automatiquement :
1. Vérifie/crée `.env` (credentials)
2. Crée le virtualenv Python + installe les dépendances
3. Lance les **10 agents backend** (ports 8000-8009)
4. Installe les deps frontend + lance **Next.js** (port 3000)
5. Effectue des health checks sur tous les agents

**Modes :**
- `./start.sh` -- tout (backend + frontend)
- `./start.sh backend` -- agents uniquement
- `./start.sh frontend` -- frontend uniquement

**Arrêter tout :**
```bash
./stop.sh
```

**URLs :**
| Service             | URL                          |
|---------------------|------------------------------|
| Frontend            | http://localhost:3000         |
| CTG Monitor API     | http://localhost:8000/docs    |
| Apgar Transition    | http://localhost:8001/docs    |
| Symbolic Reasoning  | http://localhost:8002/docs    |
| Polygraph Verifier  | http://localhost:8003/docs    |
| Bishop Partogram    | http://localhost:8004/docs    |
| RCIU Risk           | http://localhost:8005/docs    |
| Quantum Optimizer   | http://localhost:8006/docs    |
| Mother-Baby Risk    | http://localhost:8007/docs    |
| Clinical Narrative  | http://localhost:8008/docs    |
| User Engagement     | http://localhost:8009/docs    |

Logs : `logs/` (un fichier par agent + frontend)

## Démarrage rapide (production / K8s)

1. **Infrastructure** : `cd terraform && terraform init && terraform plan -var-file=terraform.tfvars`
2. **K8s** : `kubectl apply -k k8s/base` (après configuration du cluster et secrets)
3. **Agents** : construire les images et déployer les services (voir helm/ ou k8s/overlays)
4. **Tests** : `pytest tests/ -v` (depuis la racine du projet)

## Conformité

- Audit trail : SHA-256 hash chain (shared/audit_logger)
- Anonymisation : k-anonymity (k≥5), differential privacy ε=1.0 (shared/anonymization)
- Consentement : FHIR Consent (shared/fhir_consent)
- HITL : CTG pathologique, Apgar 5min ≤ 6 (pause + notification)

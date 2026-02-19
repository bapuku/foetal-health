# Administration, observabilité et alertes

## Interface d’administration

L’interface d’administration est accessible depuis le menu latéral : **Administration** → `/dashboard/admin`.

Elle comporte trois onglets :

1. **Observabilité** – État des services (métriques), liens vers Grafana, Prometheus, journaux (ELK).
2. **Connexions APIs hôpital** – Configuration FHIR (URL, type d’auth), HL7 (endpoint), autres APIs (PACS, labo).
3. **Alertes** – Configuration des canaux SMS (Twilio), email (SendGrid ou SMTP), WhatsApp (Twilio), et destinataires par type d’alerte (critique, HITL, info). Test d’envoi depuis l’interface.

Les clés API (Twilio, SendGrid) ne doivent **jamais** être exposées au navigateur : elles sont utilisées uniquement côté serveur (API routes Next.js et module Python `shared/alerting`).

---

## Variables d’environnement

### Observabilité (optionnel)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_GRAFANA_URL` | URL Grafana (liens dans l’onglet Observabilité). |
| `NEXT_PUBLIC_PROMETHEUS_URL` | URL Prometheus (liens + requêtes métriques côté serveur). |
| `NEXT_PUBLIC_LOGS_URL` | URL des journaux (ex. Kibana). |
| `PROMETHEUS_URL` | URL Prometheus utilisée côté serveur pour récupérer les métriques (si différente de la publique). |

### Email (SendGrid ou SMTP)

| Variable | Description |
|----------|-------------|
| `SENDGRID_API_KEY` | Clé API SendGrid (prioritaire si définie). |
| `ALERT_FROM_EMAIL` | Adresse expéditrice des alertes (ex. `alerts@hopital.example`). |
| `ALERT_FROM_NAME` | Nom affiché (ex. `Obstetric AI`). |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | Alternative à SendGrid (SMTP générique). |

### SMS et WhatsApp (Twilio)

| Variable | Description |
|----------|-------------|
| `TWILIO_ACCOUNT_SID` | Account SID Twilio. |
| `TWILIO_AUTH_TOKEN` | Token d’authentification Twilio. |
| `TWILIO_SMS_FROM` | Numéro expéditeur SMS (ex. `+33...`). |
| `TWILIO_WHATSAPP_FROM` | Canal WhatsApp expéditeur (ex. `whatsapp:+33...`). |

---

## Module Python `shared/alerting`

Les agents backend (CTG, Apgar, etc.) peuvent envoyer des alertes via le module partagé :

```python
from shared.alerting import send_email, send_sms, send_whatsapp

# Email
send_email("medecin@hopital.example", "Alerte CTG pathologique", "Patient X, CTG pathologique non validé > 2 min.")

# SMS
send_sms("+33612345678", "Obstetric AI: CTG pathologique - Patient X")

# WhatsApp
send_whatsapp("+33612345678", "Obstetric AI: Apgar bas - escalade HITL.")
```

Les variables d’environnement listées ci-dessus doivent être définies dans l’environnement d’exécution des agents (ou dans `.env` chargé par python-dotenv).

---

## API routes Next.js (admin)

- `GET/POST /api/admin/connections` – Lecture/écriture de la config des connexions (FHIR, HL7, autres). Stockage en mémoire (pour persistance durable, brancher une base ou des secrets manager).
- `GET/POST /api/admin/alert-config` – Configuration des canaux d’alerte et des destinataires.
- `GET /api/admin/observability` – Métriques et URLs Grafana/Prometheus/Logs.
- `POST /api/admin/send-test-alert` – Envoi d’un message de test (body : `{ "channel": "email" | "sms" | "whatsapp", "target": "email ou numéro" }`). Utilise les variables d’environnement côté serveur ; ne pas exposer les clés au client.

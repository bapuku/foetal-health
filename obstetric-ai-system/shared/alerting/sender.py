"""
Envoi d'alertes par email (SendGrid / SMTP), SMS et WhatsApp (Twilio).
Les clés et secrets doivent être définis via variables d'environnement (jamais en dur).
"""
import os
from typing import Optional


def send_email(
    to: str,
    subject: str,
    body_plain: str,
    *,
    from_email: Optional[str] = None,
    body_html: Optional[str] = None,
) -> bool:
    """
    Envoie un email via SendGrid (prioritaire) ou SMTP.
    Env: SENDGRID_API_KEY, ou SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD.
    """
    from_email = from_email or os.getenv("ALERT_FROM_EMAIL", "alerts@localhost")

    if os.getenv("SENDGRID_API_KEY"):
        return _send_email_sendgrid(to, from_email, subject, body_plain, body_html)
    if os.getenv("SMTP_HOST"):
        return _send_email_smtp(to, from_email, subject, body_plain, body_html)
    return False


def _send_email_sendgrid(
    to: str,
    from_email: str,
    subject: str,
    body_plain: str,
    body_html: Optional[str],
) -> bool:
    import urllib.request
    import json

    key = os.getenv("SENDGRID_API_KEY")
    if not key:
        return False
    payload = {
        "personalizations": [{"to": [{"email": to}]}],
        "from": {"email": from_email, "name": os.getenv("ALERT_FROM_NAME", "Obstetric AI")},
        "subject": subject,
        "content": [{"type": "text/plain", "value": body_plain}],
    }
    if body_html:
        payload["content"].append({"type": "text/html", "value": body_html})
    req = urllib.request.Request(
        "https://api.sendgrid.com/v3/mail/send",
        data=json.dumps(payload).encode(),
        method="POST",
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"},
    )
    try:
        with urllib.request.urlopen(req) as _:
            return True
    except Exception:
        return False


def _send_email_smtp(
    to: str,
    from_email: str,
    subject: str,
    body_plain: str,
    body_html: Optional[str],
) -> bool:
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    host = os.getenv("SMTP_HOST")
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASSWORD")
    if not host or not user or not password:
        return False
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = from_email
    msg["To"] = to
    msg.attach(MIMEText(body_plain, "plain"))
    if body_html:
        msg.attach(MIMEText(body_html, "html"))
    try:
        with smtplib.SMTP(host, port) as s:
            s.starttls()
            s.login(user, password)
            s.sendmail(from_email, [to], msg.as_string())
        return True
    except Exception:
        return False


def send_sms(to: str, body: str) -> bool:
    """
    Envoie un SMS via Twilio.
    Env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_FROM.
    """
    return _send_twilio_message(to=to, body=body, from_=os.getenv("TWILIO_SMS_FROM"), channel="sms")


def send_whatsapp(to: str, body: str) -> bool:
    """
    Envoie un message WhatsApp via Twilio.
    Env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM (ex: whatsapp:+33...).
    """
    from_ = os.getenv("TWILIO_WHATSAPP_FROM")
    if not from_:
        return False
    if not to.startswith("whatsapp:"):
        to = f"whatsapp:{to}"
    return _send_twilio_message(to=to, body=body, from_=from_, channel="whatsapp")


def _send_twilio_message(to: str, body: str, from_: Optional[str], channel: str) -> bool:
    import urllib.request
    import urllib.parse
    import base64

    sid = os.getenv("TWILIO_ACCOUNT_SID")
    token = os.getenv("TWILIO_AUTH_TOKEN")
    if not sid or not token or not from_:
        return False
    url = f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json"
    data = urllib.parse.urlencode({"To": to, "From": from_, "Body": body}).encode()
    req = urllib.request.Request(
        url,
        data=data,
        method="POST",
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": "Basic " + base64.b64encode(f"{sid}:{token}".encode()).decode(),
        },
    )
    try:
        with urllib.request.urlopen(req) as _:
            return True
    except Exception:
        return False


def send_slack(webhook_url: str, text: str) -> bool:
    """
    Envoie un message vers un canal Slack via Webhook entrant.
    webhook_url: URL du webhook Slack (Incoming Webhooks).
    """
    import urllib.request
    import json

    if not webhook_url or not webhook_url.strip().startswith("https://"):
        return False
    payload = json.dumps({"text": text}).encode()
    req = urllib.request.Request(
        webhook_url.strip(),
        data=payload,
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as _:
            return True
    except Exception:
        return False

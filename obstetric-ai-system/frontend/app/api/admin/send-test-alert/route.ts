import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { channel, target } = await request.json();
    if (!target || typeof target !== 'string') {
      return NextResponse.json({ error: 'Destinataire requis (email ou numéro)' }, { status: 400 });
    }
    if (!['email', 'sms', 'whatsapp'].includes(channel)) {
      return NextResponse.json({ error: 'Canal invalide (email, sms, whatsapp)' }, { status: 400 });
    }

    const message = `[Obstetric AI] Test alerte ${channel} - ${new Date().toISOString()}`;

    if (channel === 'email') {
      const key = process.env.SENDGRID_API_KEY;
      if (!key) {
        return NextResponse.json({ error: 'SENDGRID_API_KEY non configuré. Définir la variable d\'environnement côté serveur.' }, { status: 503 });
      }
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: target }] }],
          from: { email: process.env.ALERT_FROM_EMAIL || 'alerts@localhost', name: 'Obstetric AI' },
          subject: 'Test alerte Obstetric AI',
          content: [{ type: 'text/plain', value: message }],
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ error: `SendGrid: ${res.status} ${err}` }, { status: 502 });
      }
      return NextResponse.json({ message: 'Envoyé.' });
    }

    if (channel === 'sms' || channel === 'whatsapp') {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const from = channel === 'sms' ? process.env.TWILIO_SMS_FROM : process.env.TWILIO_WHATSAPP_FROM;
      if (!accountSid || !authToken || !from) {
        return NextResponse.json({
          error: 'Twilio non configuré. Définir TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN et TWILIO_SMS_FROM ou TWILIO_WHATSAPP_FROM.',
        }, { status: 503 });
      }
      const to = channel === 'whatsapp' && !target.startsWith('whatsapp:') ? `whatsapp:${target}` : target;
      const url = channel === 'whatsapp'
        ? `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
        : `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const body = new URLSearchParams({
        To: to,
        From: from,
        Body: message,
      });
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        },
        body: body.toString(),
      });
      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ error: `Twilio: ${res.status} ${err}` }, { status: 502 });
      }
      return NextResponse.json({ message: 'Envoyé.' });
    }

    return NextResponse.json({ error: 'Canal non géré' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur envoi' }, { status: 500 });
  }
}

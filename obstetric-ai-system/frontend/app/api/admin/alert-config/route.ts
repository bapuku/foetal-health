import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface AlertConfig {
  email: { enabled: boolean; provider: string; from: string; apiKeyConfigured: boolean };
  sms: { enabled: boolean; provider: string; from: string; configured: boolean };
  whatsapp: { enabled: boolean; provider: string; from: string; configured: boolean };
  recipients: { type: string; email?: string; phone?: string }[];
}

const store: AlertConfig = {
  email: { enabled: false, provider: 'sendgrid', from: '', apiKeyConfigured: !!process.env.SENDGRID_API_KEY },
  sms: { enabled: false, provider: 'twilio', from: '', configured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) },
  whatsapp: { enabled: false, provider: 'twilio', from: '', configured: !!process.env.TWILIO_WHATSAPP_FROM },
  recipients: [],
};

export async function GET() {
  const out = { ...store };
  out.email.apiKeyConfigured = !!process.env.SENDGRID_API_KEY;
  out.sms.configured = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
  out.whatsapp.configured = !!process.env.TWILIO_WHATSAPP_FROM;
  return NextResponse.json(out);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.email) store.email = { ...store.email, ...body.email };
    if (body.sms) store.sms = { ...store.sms, ...body.sms };
    if (body.whatsapp) store.whatsapp = { ...store.whatsapp, ...body.whatsapp };
    if (Array.isArray(body.recipients)) store.recipients = body.recipients;
    return NextResponse.json(store);
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

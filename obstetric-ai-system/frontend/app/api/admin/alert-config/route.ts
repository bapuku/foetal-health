import { NextRequest, NextResponse } from 'next/server';
import { readJsonFile, writeJsonFile } from '@/lib/server-data';

export const dynamic = 'force-dynamic';

const ALERT_CONFIG_FILE = 'alert-config.json';

export interface AlertConfig {
  email: { enabled: boolean; provider: string; from: string; apiKeyConfigured?: boolean };
  sms: { enabled: boolean; provider: string; from: string; configured?: boolean };
  whatsapp: { enabled: boolean; provider: string; from: string; configured?: boolean };
  slack: { enabled: boolean; webhookUrl: string };
  recipients: { type: string; email?: string; phone?: string }[];
}

function defaultConfig(): AlertConfig {
  return {
    email: { enabled: false, provider: 'sendgrid', from: '', apiKeyConfigured: !!process.env.SENDGRID_API_KEY },
    sms: { enabled: false, provider: 'twilio', from: '', configured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) },
    whatsapp: { enabled: false, provider: 'twilio', from: '', configured: !!process.env.TWILIO_WHATSAPP_FROM },
    slack: { enabled: false, webhookUrl: '' },
    recipients: [],
  };
}

export async function GET() {
  const stored = await readJsonFile<AlertConfig>(ALERT_CONFIG_FILE);
  const out: AlertConfig = stored
    ? { ...defaultConfig(), ...stored, slack: { ...defaultConfig().slack, ...(stored.slack || {}) } }
    : defaultConfig();
  out.email.apiKeyConfigured = !!process.env.SENDGRID_API_KEY;
  out.sms.configured = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
  out.whatsapp.configured = !!process.env.TWILIO_WHATSAPP_FROM;
  return NextResponse.json(out);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const stored = await readJsonFile<AlertConfig>(ALERT_CONFIG_FILE) || defaultConfig();
    if (body.email) stored.email = { ...stored.email, ...body.email };
    if (body.sms) stored.sms = { ...stored.sms, ...body.sms };
    if (body.whatsapp) stored.whatsapp = { ...stored.whatsapp, ...body.whatsapp };
    if (body.slack) stored.slack = { ...stored.slack, ...body.slack };
    if (Array.isArray(body.recipients)) stored.recipients = body.recipients;
    await writeJsonFile(ALERT_CONFIG_FILE, stored);
    const out = { ...stored };
    out.email.apiKeyConfigured = !!process.env.SENDGRID_API_KEY;
    out.sms.configured = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
    out.whatsapp.configured = !!process.env.TWILIO_WHATSAPP_FROM;
    return NextResponse.json(out);
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

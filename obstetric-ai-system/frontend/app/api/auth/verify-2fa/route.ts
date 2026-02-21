import { NextRequest, NextResponse } from 'next/server';
import {
  findUserById,
  verifyTOTP,
  createSessionToken,
  COOKIE_NAME_AUTH,
  SESSION_COOKIE_OPTIONS,
} from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = typeof body.user_id === 'string' ? body.user_id.trim() : '';
    const code = typeof body.code === 'string' ? body.code.replace(/\s/g, '') : '';
    if (!userId || !code) {
      return NextResponse.json({ error: 'Code 2FA requis' }, { status: 400 });
    }
    const user = await findUserById(userId);
    if (!user || !user.totp_enabled || !user.totp_secret) {
      return NextResponse.json({ error: 'Session 2FA invalide' }, { status: 401 });
    }
    const valid = await verifyTOTP(user.totp_secret, code);
    if (!valid) {
      return NextResponse.json({ error: 'Code invalide' }, { status: 401 });
    }
    const token = await createSessionToken(user.id, user.role);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME_AUTH, token, SESSION_COOKIE_OPTIONS);
    return res;
  } catch (e) {
    console.error('Verify 2FA error', e);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

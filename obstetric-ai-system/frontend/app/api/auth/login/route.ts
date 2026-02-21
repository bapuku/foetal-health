import { NextRequest, NextResponse } from 'next/server';
import {
  ensureDefaultAdmin,
  findUserByEmail,
  verifyPassword,
  createSessionToken,
  COOKIE_NAME_AUTH,
  SESSION_COOKIE_OPTIONS,
} from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await ensureDefaultAdmin();
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
    }
    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });
    }
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });
    }
    if (user.totp_enabled && user.totp_secret) {
      return NextResponse.json({
        require_2fa: true,
        user_id: user.id,
      });
    }
    const token = await createSessionToken(user.id, user.role);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME_AUTH, token, SESSION_COOKIE_OPTIONS);
    return res;
  } catch (e) {
    console.error('Login error', e);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { COOKIE_NAME_AUTH, SESSION_COOKIE_OPTIONS } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME_AUTH, '', {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: 0,
  });
  return res;
}

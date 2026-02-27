import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

const COOKIE_NAME = 'obs-session';

function getSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) return '';
  return s;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const secret = getSecret();

  if (!secret || !token) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  try {
    const key = new TextEncoder().encode(secret);
    const { payload } = await jose.jwtVerify(token, key);
    const userId = payload.sub as string;
    const role = payload.role as string;
    if (pathname.startsWith('/api/admin/users') && role !== 'admin') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }
    const reqHeaders = new Headers(request.headers);
    reqHeaders.set('x-obs-user-id', userId);
    reqHeaders.set('x-obs-user-role', role);
    return NextResponse.next({ request: { headers: reqHeaders } });
  } catch {
    return NextResponse.json({ error: 'Session expirée' }, { status: 401 });
  }
}

export const config = {
  matcher: [
    '/api/admin/users/:path*',
    '/api/auth/me',
  ],
};

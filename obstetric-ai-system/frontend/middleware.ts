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

  if (pathname === '/' || pathname === '/login') {
    return NextResponse.next();
  }
  if (pathname.startsWith('/api/auth/')) return NextResponse.next();
  if (pathname === '/api/agents/health') return NextResponse.next();
  if (pathname.startsWith('/_next/') || pathname.startsWith('/images/')) return NextResponse.next();

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const secret = getSecret();
  if (!secret) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const key = new TextEncoder().encode(secret);
    const { payload } = await jose.jwtVerify(token, key);
    const userId = payload.sub as string;
    const role = payload.role as string;
    const reqHeaders = new Headers(request.headers);
    reqHeaders.set('x-obs-user-id', userId);
    reqHeaders.set('x-obs-user-role', role);
    return NextResponse.next({ request: { headers: reqHeaders } });
  } catch {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Session expirée' }, { status: 401 });
    }
    const res = NextResponse.redirect(new URL('/login', request.url));
    res.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0 });
    return res;
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/admin/:path*',
    '/api/patients/:path*',
    '/api/dossiers/:path*',
    '/api/knowledge/:path*',
    '/api/assistant/:path*',
    '/api/observability/:path*',
    '/api/alert-config/:path*',
    '/api/send-test-alert/:path*',
    '/api/connections/:path*',
    '/api/auth/me',
  ],
};

import { NextResponse } from 'next/server';
import { verifySessionToken, findUserById } from '@/lib/auth-server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('obs-session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const payload = await verifySessionToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Session expirée' }, { status: 401 });
    }
    const user = await findUserById(payload.sub);
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 });
    }
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (e) {
    console.error('Auth me error', e);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

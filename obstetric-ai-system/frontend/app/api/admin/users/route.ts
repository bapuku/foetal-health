import { NextRequest, NextResponse } from 'next/server';
import {
  ensureDefaultAdmin,
  getUsers,
  saveUsers,
  hashPassword,
  toPublicUser,
  verifySessionToken,
  COOKIE_NAME_AUTH,
  type UserRecord,
  type UserRole,
} from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  const token = request.cookies.get(COOKIE_NAME_AUTH)?.value;
  if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const payload = await verifySessionToken(token);
  if (!payload) return NextResponse.json({ error: 'Session expirée' }, { status: 401 });
  if (payload.role !== 'admin') return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
  return null;
}

export async function GET(request: NextRequest) {
  const err = await requireAdmin(request);
  if (err) return err;
  try {
    await ensureDefaultAdmin();
    const users = await getUsers();
    return NextResponse.json(users.map(toPublicUser));
  } catch (e) {
    console.error('GET /api/admin/users', e);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const err = await requireAdmin(request);
  if (err) return err;
  try {
    await ensureDefaultAdmin();
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const role = (['admin', 'clinician', 'readonly'] as const).includes(body.role) ? body.role : 'clinician';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
    }
    const users = await getUsers();
    if (users.some((u) => u.email.toLowerCase() === email)) {
      return NextResponse.json({ error: 'Un utilisateur avec cet email existe déjà' }, { status: 400 });
    }
    const passwordHash = await hashPassword(password);
    const newUser: UserRecord = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      email,
      name: name || email.split('@')[0],
      role: role as UserRole,
      passwordHash,
      totp_enabled: false,
      created_at: new Date().toISOString(),
    };
    users.push(newUser);
    await saveUsers(users);
    return NextResponse.json(toPublicUser(newUser), { status: 201 });
  } catch (e) {
    console.error('POST /api/admin/users', e);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

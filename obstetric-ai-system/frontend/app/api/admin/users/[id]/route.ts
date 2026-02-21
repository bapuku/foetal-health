import { NextRequest, NextResponse } from 'next/server';
import {
  getUsers,
  saveUsers,
  hashPassword,
  toPublicUser,
  verifySessionToken,
  countAdmins,
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin(request);
  if (err) return err;
  const { id } = await params;
  try {
    const users = await getUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    const body = await request.json();
    const user = users[index];
    if (typeof body.name === 'string') user.name = body.name.trim();
    if ((['admin', 'clinician', 'readonly'] as const).includes(body.role)) user.role = body.role as UserRole;
    if (typeof body.password === 'string' && body.password.length > 0) {
      user.passwordHash = await hashPassword(body.password);
    }
    await saveUsers(users);
    return NextResponse.json(toPublicUser(user));
  } catch (e) {
    console.error('PATCH /api/admin/users/[id]', e);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin(request);
  if (err) return err;
  const { id } = await params;
  try {
    const users = await getUsers();
    const target = users.find((u) => u.id === id);
    if (!target) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    if (target.role === 'admin' && countAdmins(users) <= 1) {
      return NextResponse.json({ error: 'Impossible de supprimer le dernier administrateur' }, { status: 400 });
    }
    const next = users.filter((u) => u.id !== id);
    await saveUsers(next);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('DELETE /api/admin/users/[id]', e);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

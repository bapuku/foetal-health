import { NextRequest, NextResponse } from 'next/server';
import {
  getUsers,
  saveUsers,
  generateTOTPSecret,
  getTOTPQRDataUrl,
  verifySessionToken,
  COOKIE_NAME_AUTH,
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin(request);
  if (err) return err;
  const { id } = await params;
  try {
    const users = await getUsers();
    const user = users.find((u) => u.id === id);
    if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    const { secret, otpauthUrl } = generateTOTPSecret(user.email);
    const qrDataUrl = await getTOTPQRDataUrl(otpauthUrl);
    user.totp_secret = secret;
    user.totp_enabled = true;
    await saveUsers(users);
    return NextResponse.json({ qrDataUrl, secret });
  } catch (e) {
    console.error('POST /api/admin/users/[id]/2fa', e);
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
    const user = users.find((u) => u.id === id);
    if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    user.totp_secret = undefined;
    user.totp_enabled = false;
    await saveUsers(users);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('DELETE /api/admin/users/[id]/2fa', e);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

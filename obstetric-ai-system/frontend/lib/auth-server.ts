/**
 * Server-side auth: password hashing, TOTP 2FA, JWT session, user CRUD.
 * Use only in API routes or server components.
 */
import bcrypt from 'bcryptjs';
import { generateSecret, generateURI, verify } from 'otplib';
import * as jose from 'jose';
import QRCode from 'qrcode';
import { readJsonFile, writeJsonFile } from './server-data';

const USERS_FILE = 'users.json';
const BCRYPT_ROUNDS = 10;
const JWT_EXPIRY = '24h';
const COOKIE_NAME = 'obs-session';

export type UserRole = 'admin' | 'clinician' | 'readonly';

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  totp_secret?: string;
  totp_enabled: boolean;
  created_at: string;
}

export interface UserPublic {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  totp_enabled: boolean;
  created_at: string;
}

export interface SessionPayload {
  sub: string;
  role: UserRole;
  iat: number;
  exp: number;
}

function getSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error('AUTH_SECRET must be set and at least 32 characters');
  return s;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function generateTOTPSecret(email: string): { secret: string; otpauthUrl: string } {
  const secret = generateSecret();
  const otpauthUrl = generateURI({ issuer: 'Obstetric AI', label: email, secret });
  return { secret, otpauthUrl };
}

export async function getTOTPQRDataUrl(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl, { width: 200, margin: 2 });
}

export async function verifyTOTP(secret: string, token: string): Promise<boolean> {
  try {
    const result = await verify({ secret, token });
    return result.valid;
  } catch {
    return false;
  }
}

export async function createSessionToken(userId: string, role: UserRole): Promise<string> {
  const secret = new TextEncoder().encode(getSecret());
  return new jose.SignJWT({ role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const secret = new TextEncoder().encode(getSecret());
    const { payload } = await jose.jwtVerify(token, secret);
    return {
      sub: payload.sub as string,
      role: payload.role as UserRole,
      iat: payload.iat as number,
      exp: payload.exp as number,
    };
  } catch {
    return null;
  }
}

export const COOKIE_NAME_AUTH = COOKIE_NAME;

export async function getUsers(): Promise<UserRecord[]> {
  const list = await readJsonFile<UserRecord[]>(USERS_FILE);
  if (!list || !Array.isArray(list)) return [];
  return list;
}

export async function saveUsers(users: UserRecord[]): Promise<void> {
  await writeJsonFile(USERS_FILE, users);
}

const DEFAULT_ADMIN_EMAIL = 'admin@obstetric-ai.local';
const DEFAULT_ADMIN_PASSWORD = 'Admin2026!';
const DEFAULT_ADMIN_NAME = 'Administrateur';

export async function ensureDefaultAdmin(): Promise<void> {
  const users = await getUsers();
  if (users.length > 0) return;
  const passwordHash = await hashPassword(DEFAULT_ADMIN_PASSWORD);
  const admin: UserRecord = {
    id: `user-${Date.now()}`,
    email: DEFAULT_ADMIN_EMAIL,
    name: DEFAULT_ADMIN_NAME,
    role: 'admin',
    passwordHash,
    totp_enabled: false,
    created_at: new Date().toISOString(),
  };
  await saveUsers([admin]);
}

export function toPublicUser(u: UserRecord): UserPublic {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    totp_enabled: u.totp_enabled,
    created_at: u.created_at,
  };
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const users = await getUsers();
  const normalized = email.trim().toLowerCase();
  return users.find((u) => u.email.toLowerCase() === normalized) ?? null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const users = await getUsers();
  return users.find((u) => u.id === id) ?? null;
}

export function countAdmins(users: UserRecord[]): number {
  return users.filter((u) => u.role === 'admin').length;
}

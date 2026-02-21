/**
 * Client-side auth helpers.
 * Session is stored in httpOnly cookie; use /api/auth/me to get current user.
 * Protected routes are enforced by middleware (redirect to /login if not authenticated).
 */
export function getAuthUrl(): string {
  return process.env.NEXT_PUBLIC_FHIR_AUTH_URL || '/login';
}

/**
 * Client cannot read httpOnly cookie. Auth state is determined by:
 * - Middleware: unauthenticated users are redirected to /login
 * - In dashboard: call /api/auth/me to get current user info
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return true;
}

/**
 * OAuth 2.0 + SMART on FHIR auth helpers.
 * In production: integrate with FHIR auth server and store tokens securely.
 */
export function getAuthUrl(): string {
  return process.env.NEXT_PUBLIC_FHIR_AUTH_URL || '/api/auth/login';
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!sessionStorage.getItem('fhir_access_token');
}

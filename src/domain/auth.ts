// Reglas de la cuenta (CUE-01, CUE-02). Sin dependencias de React Native ni de Supabase.

export const MIN_PASSWORD_LENGTH = 8;

/** Formato básico de correo: algo@algo.dominio, sin espacios. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function isValidPassword(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Errores de cuenta que la interfaz sabe explicar en español. */
export type AuthErrorKind =
  | 'email_taken'
  | 'invalid_credentials'
  | 'weak_password'
  | 'invalid_email'
  | 'email_not_confirmed'
  | 'rate_limit'
  | 'same_password'
  | 'link_expired'
  | 'network'
  | 'not_configured'
  | 'unknown';

type ErrorLike = { name?: unknown; code?: unknown; status?: unknown; message?: unknown };

/**
 * Traduce un error de Supabase (u otro) a un tipo de error conocido.
 * Se basa en el `code` de Supabase y, si no viene, en el tipo de error o el mensaje.
 */
export function classifyAuthError(error: unknown): AuthErrorKind {
  if (!error || typeof error !== 'object') return 'unknown';
  const e = error as ErrorLike;
  const code = typeof e.code === 'string' ? e.code : '';
  const name = typeof e.name === 'string' ? e.name : '';
  const message = typeof e.message === 'string' ? e.message.toLowerCase() : '';

  switch (code) {
    case 'user_already_exists':
    case 'email_exists':
      return 'email_taken';
    case 'invalid_credentials':
      return 'invalid_credentials';
    case 'weak_password':
      return 'weak_password';
    case 'email_address_invalid':
    case 'validation_failed':
      return 'invalid_email';
    case 'email_not_confirmed':
      return 'email_not_confirmed';
    case 'same_password':
      return 'same_password';
    case 'otp_expired':
    case 'session_expired':
    case 'session_not_found':
    case 'refresh_token_not_found':
    case 'refresh_token_already_used':
      return 'link_expired';
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'rate_limit';
  }

  if (name === 'AuthRetryableFetchError' || message.includes('network request failed') || message.includes('fetch failed')) {
    return 'network';
  }
  if (message.includes('already registered')) return 'email_taken';
  if (message.includes('invalid login credentials')) return 'invalid_credentials';
  return 'unknown';
}

export type RecoveryTokens = { accessToken: string; refreshToken: string };

/**
 * Lee los datos del enlace de recuperación de contraseña (CUE-04). Supabase los manda después
 * del `#` (o como parámetros) del enlace que abre la app. Devuelve `null` si el enlace no es de
 * recuperación o le falta algo.
 */
export function parseRecoveryUrl(url: string): RecoveryTokens | null {
  const params = new URLSearchParams();
  const query = url.split('?')[1]?.split('#')[0] ?? '';
  const hash = url.split('#')[1] ?? '';
  for (const part of [query, hash]) {
    for (const [key, value] of new URLSearchParams(part)) params.set(key, value);
  }
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (params.get('type') !== 'recovery' || !accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

/** El enlace llegó, pero Supabase dice que venció o ya se usó. */
export function recoveryUrlError(url: string): string | null {
  const hash = url.split('#')[1] ?? url.split('?')[1] ?? '';
  return new URLSearchParams(hash).get('error_code');
}

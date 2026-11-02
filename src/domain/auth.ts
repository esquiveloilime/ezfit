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

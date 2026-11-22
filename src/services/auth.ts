// Envoltura de la autenticación de Supabase (CUE-01 a CUE-03).
// Devuelve resultados simples para que el resto de la app no dependa de Supabase.

import * as Linking from 'expo-linking';

import { type AuthErrorKind, classifyAuthError, normalizeEmail } from '@/domain/auth';

import { getSupabase } from './supabase';

export type AuthUser = { id: string; email: string };

export type AuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; error: AuthErrorKind | 'confirm_email' };

function failure(error: unknown): AuthResult {
  return { ok: false, error: classifyAuthError(error) };
}

export async function signUpWithEmail(email: string, password: string): Promise<AuthResult> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'not_configured' };
  try {
    const { data, error } = await supabase.auth.signUp({ email: normalizeEmail(email), password });
    if (error) return failure(error);
    // Si Supabase pide confirmar el correo, no hay sesión todavía (ver instrucciones de configuración).
    if (!data.session || !data.user) return { ok: false, error: 'confirm_email' };
    return { ok: true, user: { id: data.user.id, email: data.user.email ?? normalizeEmail(email) } };
  } catch (error) {
    return failure(error);
  }
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'not_configured' };
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    });
    if (error) return failure(error);
    return { ok: true, user: { id: data.user.id, email: data.user.email ?? normalizeEmail(email) } };
  } catch (error) {
    return failure(error);
  }
}

/** Cierra la sesión en este teléfono. Funciona sin conexión. */
export async function signOutLocal(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch {
    // Sin conexión o con la sesión vencida: la sesión local se borra de todos modos.
  }
}

/**
 * Manda el correo para restablecer la contraseña (CUE-04). El enlace del correo abre la app en
 * la pantalla de contraseña nueva; esa dirección debe estar en la lista de Supabase
 * (Authentication → URL Configuration → Redirect URLs).
 */
export async function requestPasswordReset(email: string, redirectTo: string): Promise<{ ok: true } | { ok: false; error: AuthErrorKind }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'not_configured' };
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(normalizeEmail(email), { redirectTo });
    if (error) return { ok: false, error: classifyAuthError(error) };
    return { ok: true };
  } catch (error) {
    return { ok: false, error: classifyAuthError(error) };
  }
}

/**
 * Cambia la contraseña con los datos del enlace de recuperación. Si el usuario no tenía la
 * sesión abierta en el teléfono, al terminar se cierra, para que entre con la contraseña nueva.
 */
export async function completePasswordReset(
  tokens: { accessToken: string; refreshToken: string },
  password: string,
  { keepSession }: { keepSession: boolean },
): Promise<{ ok: true } | { ok: false; error: AuthErrorKind }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'not_configured' };
  try {
    const session = await supabase.auth.setSession({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    });
    if (session.error) return { ok: false, error: classifyAuthError(session.error) };
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { ok: false, error: classifyAuthError(error) };
    return { ok: true };
  } catch (error) {
    return { ok: false, error: classifyAuthError(error) };
  } finally {
    if (!keepSession) await signOutLocal();
  }
}

/** Dirección que abre la pantalla de contraseña nueva: `ezfit://reset-password` en la APK. */
export function passwordResetRedirect(): string {
  return Linking.createURL('reset-password');
}

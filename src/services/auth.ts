// Envoltura de la autenticación de Supabase (CUE-01 a CUE-03).
// Devuelve resultados simples para que el resto de la app no dependa de Supabase.

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

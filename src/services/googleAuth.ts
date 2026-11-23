// Continuar con Google (CUE-08, plan técnico, sección 8).
// La librería muestra el selector de cuentas de Google del teléfono y devuelve un token, que
// se entrega a Supabase para crear la cuenta o abrir la existente.
//
// Dentro de Expo Go la librería nativa no existe: ahí el botón no se muestra y la librería
// nunca se carga (se pide con `require` solo al usarla), para no romper la app.

import Constants, { ExecutionEnvironment } from 'expo-constants';

import { classifyAuthError, normalizeEmail } from '@/domain/auth';

import type { AuthResult } from './auth';
import { getSupabase, isSupabaseConfigured } from './supabase';

/** ID de cliente "Web" de Google Cloud. No es secreto; va en el archivo .env. */
const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

export type GoogleResult = AuthResult | { ok: false; error: 'cancelled' };

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** Indica si se puede mostrar el botón de Google: no en Expo Go y con la configuración completa. */
export function isGoogleSignInAvailable(): boolean {
  return !isExpoGo && Boolean(webClientId) && isSupabaseConfigured();
}

let configured = false;

type GoogleLibrary = typeof import('@react-native-google-signin/google-signin');

function loadLibrary(): GoogleLibrary {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- carga diferida: un `import` normal rompería Expo Go al abrir la app.
  const lib = require('@react-native-google-signin/google-signin') as GoogleLibrary;
  if (!configured) {
    lib.GoogleSignin.configure({ webClientId });
    configured = true;
  }
  return lib;
}

export async function signInWithGoogle(): Promise<GoogleResult> {
  const supabase = getSupabase();
  if (!supabase || !isGoogleSignInAvailable()) return { ok: false, error: 'not_configured' };
  try {
    const { GoogleSignin, isCancelledResponse, isErrorWithCode, statusCodes } = loadLibrary();
    let idToken: string | null;
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      if (isCancelledResponse(response)) return { ok: false, error: 'cancelled' };
      idToken = response.data.idToken;
    } catch (error) {
      if (isErrorWithCode(error)) {
        if (error.code === statusCodes.SIGN_IN_CANCELLED || error.code === statusCodes.IN_PROGRESS) {
          return { ok: false, error: 'cancelled' };
        }
        // Código 7 de Google: sin conexión a internet.
        if (error.code === '7' || error.code === 'NETWORK_ERROR') return { ok: false, error: 'network' };
      }
      console.error('Falló el selector de cuentas de Google', error);
      return { ok: false, error: 'unknown' };
    }
    if (!idToken) return { ok: false, error: 'unknown' };

    const { data, error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
    if (error) return { ok: false, error: classifyAuthError(error) };
    return {
      ok: true,
      user: { id: data.user.id, email: normalizeEmail(data.user.email ?? '') },
    };
  } catch (error) {
    return { ok: false, error: classifyAuthError(error) };
  }
}

/** Olvida la cuenta de Google elegida, para que la próxima vez vuelva a aparecer el selector. */
export async function signOutGoogle(): Promise<void> {
  if (!isGoogleSignInAvailable()) return;
  try {
    const { GoogleSignin } = loadLibrary();
    await GoogleSignin.signOut();
  } catch {
    // Si no había sesión de Google o no hay conexión, no hay nada que hacer.
  }
}

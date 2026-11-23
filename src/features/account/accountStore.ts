// Estado de la cuenta en este teléfono (CUE-00, CUE-02, CUE-03, CUE-07).
// Se guarda en el teléfono para que la app abra sin conexión: no depende de que
// Supabase esté disponible al arrancar.

import Storage from 'expo-sqlite/kv-store';
import { create } from 'zustand';

import { claimGuestData, deleteGuestData } from '@/db/claimGuestData';
import { LOCAL_OWNER } from '@/db/client';
import {
  type AuthResult,
  type AuthUser,
  signInWithEmail,
  signOutLocal,
  signUpWithEmail,
} from '@/services/auth';
import { type GoogleResult, signInWithGoogle, signOutGoogle } from '@/services/googleAuth';

export type AccountMode = 'welcome' | 'guest' | 'user';

type Persisted = { mode: 'guest' } | { mode: 'user'; user: AuthUser };

type AccountState = {
  loaded: boolean;
  mode: AccountMode;
  user: AuthUser | null;
  load: () => Promise<void>;
  startGuest: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<AccountResult>;
  signIn: (email: string, password: string) => Promise<AccountResult>;
  signInWithGoogle: () => Promise<GoogleAccountResult>;
  signOut: () => Promise<void>;
};

export type AccountResult = AuthResult | { ok: false; error: 'claim_failed' };

/** Como `AccountResult`, pero el usuario puede cerrar el selector de Google sin elegir cuenta. */
export type GoogleAccountResult = AccountResult | { ok: false; error: 'cancelled' };

const STORAGE_KEY = 'ezfit.account';

async function persist(value: Persisted | null): Promise<void> {
  if (value) await Storage.setItem(STORAGE_KEY, JSON.stringify(value));
  else await Storage.removeItem(STORAGE_KEY);
}

function parse(raw: string | null): Persisted | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Persisted;
    if (value.mode === 'guest') return value;
    if (value.mode === 'user' && typeof value.user?.id === 'string') return value;
  } catch {
    // Valor dañado: se trata como si no hubiera cuenta.
  }
  return null;
}

function isCancelled(result: GoogleResult): result is { ok: false; error: 'cancelled' } {
  return !result.ok && result.error === 'cancelled';
}

/** Dueño de la base de datos que deben ver las pantallas, o `null` en la bienvenida. */
export function ownerFor(state: Pick<AccountState, 'mode' | 'user'>): string | null {
  if (state.mode === 'guest') return LOCAL_OWNER;
  if (state.mode === 'user' && state.user) return state.user.id;
  return null;
}

export const useAccount = create<AccountState>((set, get) => {
  /** Entra a la cuenta; si venía del modo sin cuenta, primero pasa sus datos. */
  async function enter(result: AuthResult): Promise<AccountResult> {
    if (!result.ok) return result;
    if (get().mode === 'guest') {
      try {
        await claimGuestData(result.user.id);
      } catch (error) {
        console.error('No se pudieron pasar los datos del modo sin cuenta', error);
        await signOutLocal();
        return { ok: false, error: 'claim_failed' };
      }
    }
    await persist({ mode: 'user', user: result.user });
    set({ mode: 'user', user: result.user });
    return result;
  }

  return {
    loaded: false,
    mode: 'welcome',
    user: null,

    load: async () => {
      const saved = parse(await Storage.getItem(STORAGE_KEY).catch(() => null));
      if (saved?.mode === 'guest') set({ loaded: true, mode: 'guest', user: null });
      else if (saved?.mode === 'user') set({ loaded: true, mode: 'user', user: saved.user });
      else set({ loaded: true, mode: 'welcome', user: null });
    },

    startGuest: async () => {
      // "Empezar sin cuenta" siempre arranca con la app vacía (CUE-07).
      await deleteGuestData();
      await persist({ mode: 'guest' });
      set({ mode: 'guest', user: null });
    },

    signUp: async (email, password) => enter(await signUpWithEmail(email, password)),

    signIn: async (email, password) => enter(await signInWithEmail(email, password)),

    signInWithGoogle: async () => {
      const result = await signInWithGoogle();
      if (isCancelled(result)) return result;
      const entered = await enter(result);
      // Si no se pudo entrar, se olvida la cuenta de Google para poder elegir otra.
      if (!entered.ok) await signOutGoogle();
      return entered;
    },

    signOut: async () => {
      await signOutLocal();
      await signOutGoogle();
      await persist(null);
      set({ mode: 'welcome', user: null });
    },
  };
});

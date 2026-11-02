// Cliente de Supabase. Solo la autenticación (aquí) y la sincronización (src/sync)
// hablan con Supabase; las pantallas nunca lo usan directamente.

import 'expo-sqlite/localStorage/install';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

let client: SupabaseClient | null = null;

/** Indica si el archivo .env tiene los datos de Supabase. Sin ellos, solo hay modo sin cuenta. */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && publishableKey);
}

/** Cliente de Supabase, o `null` si falta la configuración. */
export function getSupabase(): SupabaseClient | null {
  if (!url || !publishableKey) return null;
  if (!client) {
    client = createClient(url, publishableKey, {
      auth: {
        storage: localStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
    // Renovar la sesión solo con la app en pantalla, como recomienda Supabase.
    const current = client;
    AppState.addEventListener('change', (state) => {
      if (state === 'active') current.auth.startAutoRefresh();
      else current.auth.stopAutoRefresh();
    });
  }
  return client;
}

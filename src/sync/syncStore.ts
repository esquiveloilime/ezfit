import type { SQLiteDatabase } from 'expo-sqlite';
import { create } from 'zustand';

import { isOnline } from '@/services/network';
import { getSupabase } from '@/services/supabase';

import { push } from './engine';
import { sqliteLocal } from './sqliteLocal';
import { supabaseRemote } from './supabaseRemote';

// Cuándo y cómo se ejecuta la sincronización (plan técnico, sección 5; SIN-02). Nunca
// bloquea la pantalla: corre en segundo plano y, si falla, todo sigue pendiente.

export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'error';

type State = { status: SyncStatus; lastSyncedAt: number | null };

export const useSyncStore = create<State>(() => ({ status: 'idle', lastSyncedAt: null }));

/** Base del usuario con cuenta que está abierta. En modo sin cuenta no hay ninguna. */
let target: { sqlite: SQLiteDatabase; owner: string } | null = null;
let running: Promise<void> | null = null;
let again = false;

export function setSyncTarget(value: { sqlite: SQLiteDatabase; owner: string } | null): void {
  target = value;
  if (!value) useSyncStore.setState({ status: 'idle', lastSyncedAt: null });
}

async function runOnce(): Promise<void> {
  const current = target;
  const client = getSupabase();
  if (!current || !client) return;
  if (!(await isOnline())) {
    useSyncStore.setState({ status: 'offline' });
    return;
  }
  useSyncStore.setState({ status: 'syncing' });
  try {
    await push(sqliteLocal(current.sqlite), supabaseRemote(client), current.owner);
    // Si mientras tanto se cambió de cuenta, no se reporta nada de la anterior.
    if (target === current) useSyncStore.setState({ status: 'idle', lastSyncedAt: Date.now() });
  } catch (error) {
    console.warn('No se pudo sincronizar', error);
    if (target === current) useSyncStore.setState({ status: 'error' });
  }
}

/**
 * Pide sincronizar. Si ya hay una en curso, se hace otra al terminar, para no perder los
 * cambios que llegaron mientras tanto. Sin cuenta no hace nada (CUE-07).
 */
export function requestSync(): Promise<void> {
  if (running) {
    again = true;
    return running;
  }
  running = (async () => {
    do {
      again = false;
      await runOnce();
    } while (again);
  })().finally(() => {
    running = null;
  });
  return running;
}

// Motor de sincronización (plan técnico, sección 5; SIN-02, SIN-05). No conoce SQLite ni
// Supabase: recibe las dos bases por medio de `Local` y `Remote`, así se prueba sin ellas.

import { SYNCED_TABLES } from '@/db/schema';

import type { Row, SyncedTable } from './columns';
import { shouldApplyRemote, toRemote } from './transform';

/** Lo que el motor necesita de la base de datos del teléfono. */
export interface Local {
  /** Registros del usuario pendientes de subir. */
  pending(table: SyncedTable, owner: string): Row[];
  /**
   * Marca como sincronizados los registros subidos, solo si no cambiaron mientras se
   * subían (si cambiaron, siguen pendientes y se suben la próxima vez).
   */
  markSynced(table: SyncedTable, rows: readonly { id: string; updatedAt: number }[]): void;
  /** El perfil del usuario en el teléfono, si existe. */
  profile(owner: string): Row | null;
  /** Descarta el perfil del teléfono y guarda el de la cuenta (D-03). */
  replaceProfile(localId: string, remote: Row): void;
  /** Cambia el identificador del perfil del teléfono por el que ya tiene la cuenta. */
  renameProfile(localId: string, remoteId: string): void;
  /** Hasta dónde se bajó cada tabla la última vez. */
  cursor(table: SyncedTable): Cursor | null;
  setCursor(table: SyncedTable, cursor: Cursor): void;
  /** Versión del teléfono de cada registro, para decidir si se aplica el del servidor. */
  versions(table: SyncedTable, ids: readonly string[]): Map<string, { updated_at: number; sync_status: string }>;
  /** Guarda los registros bajados, ya marcados como sincronizados. */
  apply(table: SyncedTable, rows: readonly Row[]): void;
}

/**
 * Punto de corte de la bajada: la fecha del servidor y, para desempatar los registros que
 * se guardaron en el mismo instante, su id (plan técnico, sección 5: reloj).
 */
export type Cursor = { at: string; id: string };

/** Lo que el motor necesita de Supabase. */
export interface Remote {
  /** Inserta o actualiza por `id`: repetir un envío no duplica nada (SIN-05). */
  upsert(table: SyncedTable, rows: Row[]): Promise<void>;
  /** El perfil de la cuenta en el servidor, si existe. */
  profile(userId: string): Promise<Row | null>;
  /** Registros del usuario modificados después del punto de corte, ordenados por fecha del servidor e id. */
  pull(table: SyncedTable, userId: string, after: Cursor | null, limit: number): Promise<Row[]>;
}

/** Cuántos registros se mandan por petición. */
export const BATCH_SIZE = 500;

function chunks<T>(list: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

/**
 * La cuenta solo puede tener un perfil. Si el del teléfono es otro (por ejemplo, el del modo
 * sin cuenta), se queda el de la cuenta cuando ya hizo la incorporación (D-03); si no, el del
 * teléfono toma el identificador del de la cuenta para reemplazarlo al subir.
 */
async function reconcileProfile(local: Local, remote: Remote, owner: string): Promise<void> {
  const mine = local.profile(owner);
  if (!mine) return;
  const theirs = await remote.profile(owner);
  if (!theirs || theirs.id === mine.id) return;
  if (theirs.onboarding_completed) local.replaceProfile(String(mine.id), theirs);
  else local.renameProfile(String(mine.id), String(theirs.id));
}

/** Sube todo lo pendiente, tabla por tabla y en orden de dependencia. */
export async function push(local: Local, remote: Remote, owner: string): Promise<number> {
  await reconcileProfile(local, remote, owner);
  let uploaded = 0;
  for (const table of SYNCED_TABLES) {
    const rows = local.pending(table, owner);
    for (const batch of chunks(rows, BATCH_SIZE)) {
      await remote.upsert(
        table,
        batch.map((row) => toRemote(table, row)),
      );
      local.markSynced(
        table,
        batch.map((row) => ({ id: String(row.id), updatedAt: Number(row.updated_at) })),
      );
      uploaded += batch.length;
    }
  }
  return uploaded;
}

/**
 * Baja lo que cambió en el servidor desde la última vez. Un registro bajado se aplica solo
 * si el del teléfono no está pendiente o si el del servidor es más reciente (SIN-05).
 */
export async function pull(local: Local, remote: Remote, owner: string): Promise<number> {
  let applied = 0;
  for (const table of SYNCED_TABLES) {
    let after = local.cursor(table);
    for (;;) {
      const rows = await remote.pull(table, owner, after, BATCH_SIZE);
      if (rows.length === 0) break;
      const versions = local.versions(
        table,
        rows.map((r) => String(r.id)),
      );
      const fresh = rows.filter((r) => {
        const mine = versions.get(String(r.id)) ?? null;
        // Lo que este teléfono acaba de subir regresa igual: no hace falta volver a guardarlo.
        if (mine?.sync_status === 'synced' && mine.updated_at === Number(r.updated_at)) return false;
        return shouldApplyRemote(mine, { updated_at: r.updated_at ?? 0 });
      });
      local.apply(table, fresh);
      applied += fresh.length;
      const last = rows[rows.length - 1]!;
      after = { at: String(last.server_updated_at), id: String(last.id) };
      local.setCursor(table, after);
      if (rows.length < BATCH_SIZE) break;
    }
  }
  return applied;
}

/** Una sincronización completa: primero se sube y luego se baja. */
export async function sync(local: Local, remote: Remote, owner: string): Promise<{ uploaded: number; applied: number }> {
  const uploaded = await push(local, remote, owner);
  const applied = await pull(local, remote, owner);
  return { uploaded, applied };
}

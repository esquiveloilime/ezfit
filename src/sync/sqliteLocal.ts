import type { SQLiteDatabase } from 'expo-sqlite';

import { localColumns, type Row, type SyncedTable } from './columns';
import type { Cursor, Local } from './engine';
import { toLocal } from './transform';

// Acceso del motor a la base del teléfono. Los nombres de tabla vienen de SYNCED_TABLES,
// nunca del usuario.

/**
 * Una actividad de running se sube hasta que se guarda o se descarta: mientras está en curso
 * o esperando el resumen, solo existe en este teléfono (su recuperación depende de él).
 */
const EXTRA_FILTER: Partial<Record<SyncedTable, string>> = {
  runs: "AND (status = 'finished' OR deleted_at IS NOT NULL)",
};

type Params = (string | number | null)[];

const CURSOR_PREFIX = 'sync_cursor:';

const RESTORED_KEY = 'sync_restored';

/** Si esta base ya terminó una bajada completa de la cuenta; si no, hay que restaurarla (SIN-04). */
export function hasPulledBefore(sqlite: SQLiteDatabase): boolean {
  return sqlite.getFirstSync<{ value: string }>('SELECT value FROM app_meta WHERE key = ?', [RESTORED_KEY]) !== null;
}

export function markRestored(sqlite: SQLiteDatabase): void {
  sqlite.runSync('INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)', [RESTORED_KEY, '1']);
}

/** Cuántos registros faltan por subir, con el mismo criterio que la subida (SIN-03). */
export function pendingCount(sqlite: SQLiteDatabase, owner: string, tables: readonly SyncedTable[]): number {
  let total = 0;
  for (const table of tables) {
    const row = sqlite.getFirstSync<{ n: number }>(
      `SELECT COUNT(*) AS n FROM "${table}" WHERE user_id = ? AND sync_status = 'pending' ${EXTRA_FILTER[table] ?? ''}`,
      [owner],
    );
    total += row?.n ?? 0;
  }
  return total;
}

function insertRow(sqlite: SQLiteDatabase, table: SyncedTable, row: Row) {
  const columns = Object.keys(row);
  const sql = `INSERT OR REPLACE INTO "${table}" (${columns.map((c) => `"${c}"`).join(', ')}) VALUES (${columns
    .map(() => '?')
    .join(', ')})`;
  sqlite.runSync(sql, columns.map((c) => row[c] ?? null) as Params);
}

export function sqliteLocal(sqlite: SQLiteDatabase): Local {
  return {
    pending(table, owner) {
      return sqlite.getAllSync<Row>(
        `SELECT * FROM "${table}" WHERE user_id = ? AND sync_status = 'pending' ${EXTRA_FILTER[table] ?? ''}`,
        [owner],
      );
    },

    markSynced(table, rows) {
      sqlite.withTransactionSync(() => {
        for (const { id, updatedAt } of rows) {
          sqlite.runSync(`UPDATE "${table}" SET sync_status = 'synced' WHERE id = ? AND updated_at = ?`, [id, updatedAt]);
        }
      });
    },

    profile(owner) {
      return sqlite.getFirstSync<Row>('SELECT * FROM profiles WHERE user_id = ? AND deleted_at IS NULL', [owner]);
    },

    replaceProfile(localId, remote) {
      sqlite.withTransactionSync(() => {
        sqlite.runSync('DELETE FROM profiles WHERE id = ?', [localId]);
        insertRow(sqlite, 'profiles', toLocal('profiles', remote, localColumns('profiles')));
      });
    },

    renameProfile(localId, remoteId) {
      sqlite.runSync("UPDATE profiles SET id = ?, sync_status = 'pending' WHERE id = ?", [remoteId, localId]);
    },

    cursor(table) {
      const row = sqlite.getFirstSync<{ value: string }>('SELECT value FROM app_meta WHERE key = ?', [
        CURSOR_PREFIX + table,
      ]);
      if (!row) return null;
      try {
        const value = JSON.parse(row.value) as Cursor;
        return typeof value.at === 'string' && typeof value.id === 'string' ? value : null;
      } catch {
        return null;
      }
    },

    setCursor(table, cursor) {
      sqlite.runSync('INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)', [
        CURSOR_PREFIX + table,
        JSON.stringify(cursor),
      ]);
    },

    versions(table, ids) {
      const out = new Map<string, { updated_at: number; sync_status: string }>();
      if (ids.length === 0) return out;
      const rows = sqlite.getAllSync<{ id: string; updated_at: number; sync_status: string }>(
        `SELECT id, updated_at, sync_status FROM "${table}" WHERE id IN (${ids.map(() => '?').join(', ')})`,
        [...ids],
      );
      for (const row of rows) out.set(row.id, row);
      return out;
    },

    apply(table, rows) {
      if (rows.length === 0) return;
      const columns = localColumns(table);
      sqlite.withTransactionSync(() => {
        for (const row of rows) insertRow(sqlite, table, toLocal(table, row, columns));
      });
    },
  };
}

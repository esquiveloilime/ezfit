import type { SQLiteDatabase } from 'expo-sqlite';

import { localColumns, type Row, type SyncedTable } from './columns';
import type { Local } from './engine';
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
  };
}

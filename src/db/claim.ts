// Paso de los datos del modo sin cuenta a una cuenta (CUE-07, plan técnico sección 5).
// Las sentencias se arman aquí, sin depender de expo-sqlite, para poder probarlas.

import { SYNCED_TABLES } from './schema';

export type ClaimOptions = {
  /**
   * Copiar los ajustes del modo sin cuenta. Es falso cuando la cuenta ya tiene sus
   * propios ajustes en el teléfono: en ese caso se quedan los de la cuenta (D-03).
   */
  copyProfile: boolean;
};

export type SqlValue = string | number | null;
export type Statement = { sql: string; params: SqlValue[] };
export type Row = Record<string, SqlValue>;

/** Consultas que leen, de la base del modo sin cuenta, lo que hay que copiar. */
export function guestSelects(options: ClaimOptions): { table: string; sql: string }[] {
  const selects: { table: string; sql: string }[] = SYNCED_TABLES.filter(
    (table) => table !== 'profiles' || options.copyProfile,
  ).map((table) => ({ table, sql: `SELECT * FROM "${table}" WHERE user_id = 'local'` }));
  // Los puntos GPS crudos no tienen dueño: se copian los de las actividades del modo sin cuenta.
  selects.push({
    table: 'run_points',
    sql: `SELECT * FROM "run_points" WHERE run_id IN (SELECT id FROM "runs" WHERE user_id = 'local')`,
  });
  return selects;
}

const COLUMN_RE = /^[a-z_][a-z0-9_]*$/;

/** Inserta una fila tal cual; si ya existe un registro con ese id, no hace nada. */
export function insertOrIgnore(table: string, row: Row): Statement {
  const columns = Object.keys(row);
  if (columns.length === 0) throw new Error(`Fila vacía en ${table}`);
  for (const c of [table, ...columns]) {
    if (!COLUMN_RE.test(c)) throw new Error(`Nombre no válido: ${c}`);
  }
  const quoted = columns.map((c) => `"${c}"`).join(', ');
  const marks = columns.map(() => '?').join(', ');
  return {
    sql: `INSERT OR IGNORE INTO "${table}" (${quoted}) VALUES (${marks})`,
    params: columns.map((c) => row[c] ?? null),
  };
}

/** Pone el dueño y marca como pendientes todos los registros del modo sin cuenta. */
export function ownerUpdates(userId: string): Statement[] {
  return SYNCED_TABLES.map((table) => ({
    sql: `UPDATE "${table}" SET user_id = ?, sync_status = 'pending' WHERE user_id = 'local'`,
    params: [userId],
  }));
}

/**
 * Todas las sentencias que hay que ejecutar en la base de la cuenta, en orden, dentro
 * de una sola transacción: primero las copias y después el cambio de dueño.
 */
export function claimStatements(userId: string, copied: { table: string; rows: Row[] }[]): Statement[] {
  const inserts = copied.flatMap(({ table, rows }) => rows.map((row) => insertOrIgnore(table, row)));
  return [...inserts, ...ownerUpdates(userId)];
}

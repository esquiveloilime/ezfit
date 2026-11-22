// Conversión de registros entre el teléfono y Supabase, y la regla de conflictos
// (plan técnico, sección 5). Sin dependencias de React Native.

import { booleanColumns, LOCAL_ONLY_COLUMN, type Row, SERVER_ONLY_COLUMN, type SyncedTable } from './columns';

/** Registro del teléfono listo para subir: sin `sync_status` y con booleanos de verdad. */
export function toRemote(table: SyncedTable, row: Row): Row {
  const booleans = booleanColumns(table);
  const out: Row = {};
  for (const [key, value] of Object.entries(row)) {
    if (key === LOCAL_ONLY_COLUMN) continue;
    out[key] = booleans.has(key) && value !== null ? Boolean(value) : value;
  }
  return out;
}

/**
 * Registro de Supabase listo para guardar en el teléfono: solo las columnas locales, sí/no
 * como 0 y 1, y marcado como sincronizado.
 */
export function toLocal(table: SyncedTable, row: Row, columns: readonly string[]): Row {
  const booleans = booleanColumns(table);
  const out: Row = {};
  for (const column of columns) {
    if (column === LOCAL_ONLY_COLUMN || column === SERVER_ONLY_COLUMN) continue;
    const value = row[column] ?? null;
    out[column] = booleans.has(column) && value !== null ? (value ? 1 : 0) : value;
  }
  out[LOCAL_ONLY_COLUMN] = 'synced';
  return out;
}

type Versioned = { updated_at: SqlNumber; sync_status?: unknown };
type SqlNumber = Row[string];

/**
 * Un registro bajado se aplica solo si el del teléfono no está pendiente o si el del
 * servidor es más reciente (gana la modificación más reciente, SIN-05).
 */
export function shouldApplyRemote(local: Versioned | null, remote: Versioned): boolean {
  if (!local) return true;
  if (local.sync_status !== 'pending') return true;
  return Number(remote.updated_at) > Number(local.updated_at);
}

// Diferencias de columnas entre SQLite y Supabase (plan técnico, secciones 4 y 5).
// Sin dependencias de React Native, para poder probarlo.

import { getTableConfig, type SQLiteTable } from 'drizzle-orm/sqlite-core';

import * as schema from '@/db/schema';
import { SYNCED_TABLES } from '@/db/schema';

export type SyncedTable = (typeof SYNCED_TABLES)[number];
export type SqlValue = string | number | boolean | null;
export type Row = Record<string, SqlValue>;

/** Solo existe en el teléfono. */
export const LOCAL_ONLY_COLUMN = 'sync_status';
/** Solo existe en Supabase: la pone el servidor y es el punto de corte de la bajada. */
export const SERVER_ONLY_COLUMN = 'server_updated_at';

const TABLE_BY_NAME: Record<SyncedTable, SQLiteTable> = {
  profiles: schema.profiles,
  exercises: schema.exercises,
  routines: schema.routines,
  routine_exercises: schema.routineExercises,
  plans: schema.plans,
  plan_days: schema.planDays,
  workouts: schema.workouts,
  workout_exercises: schema.workoutExercises,
  sets: schema.sets,
  cardio_entries: schema.cardioEntries,
  runs: schema.runs,
};

/** Columnas de cada tabla en SQLite, tal como las define el esquema. */
export function localColumns(table: SyncedTable): string[] {
  return getTableConfig(TABLE_BY_NAME[table]).columns.map((c) => c.name);
}

/** En SQLite los sí/no son 0 y 1; en Supabase son booleanos. */
const BOOLEAN_COLUMNS = new Map<SyncedTable, ReadonlySet<string>>(
  SYNCED_TABLES.map((table) => [
    table,
    new Set(
      getTableConfig(TABLE_BY_NAME[table])
        .columns.filter((c) => c.columnType === 'SQLiteBoolean')
        .map((c) => c.name),
    ),
  ]),
);

export function booleanColumns(table: SyncedTable): ReadonlySet<string> {
  return BOOLEAN_COLUMNS.get(table) ?? new Set();
}

import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

import migrations from '../../drizzle/migrations';
import * as schema from './schema';
import { seedCatalog } from './seed/seedCatalog';

export type Db = ExpoSQLiteDatabase<typeof schema>;

/** Dueño de los registros en modo sin cuenta (plan técnico, sección 5). */
export const LOCAL_OWNER = 'local';

/** Una base de datos por usuario, y una propia del modo sin cuenta (plan técnico, sección 4). */
export function databaseName(owner: string): string {
  return owner === LOCAL_OWNER ? 'ezfit-local.db' : `ezfit-user-${owner}.db`;
}

export type OpenDatabase = { db: Db; sqlite: SQLiteDatabase; owner: string };

/** Abre la base de datos del dueño indicado, aplica las migraciones y carga el catálogo. */
export async function openAppDatabase(owner: string): Promise<OpenDatabase> {
  const sqlite = openDatabaseSync(databaseName(owner), { enableChangeListener: true });
  sqlite.execSync('PRAGMA journal_mode = WAL;');
  const db = drizzle(sqlite, { schema });
  await migrate(db, migrations);
  seedCatalog(db);
  return { db, sqlite, owner };
}

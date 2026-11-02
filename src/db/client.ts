import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

import migrations from '../../drizzle/migrations';
import * as schema from './schema';
import { seedCatalog } from './seed/seedCatalog';
import { seedTemplates } from './seed/seedTemplates';

export type Db = ExpoSQLiteDatabase<typeof schema>;

/** Dueño de los registros en modo sin cuenta (plan técnico, sección 5). */
export const LOCAL_OWNER = 'local';

/** Una base de datos por usuario, y una propia del modo sin cuenta (plan técnico, sección 4). */
export function databaseName(owner: string): string {
  return owner === LOCAL_OWNER ? 'ezfit-local.db' : `ezfit-user-${owner}.db`;
}

export type OpenDatabase = { db: Db; sqlite: SQLiteDatabase; owner: string };

/**
 * Abre la base de datos del dueño indicado, aplica las migraciones y carga el catálogo.
 * `separate` abre una conexión aparte, que se puede cerrar sin afectar a la que usan
 * las pantallas (por ejemplo, al pasar los datos del modo sin cuenta a una cuenta).
 */
export async function openAppDatabase(
  owner: string,
  { separate = false }: { separate?: boolean } = {},
): Promise<OpenDatabase> {
  const sqlite = openDatabaseSync(databaseName(owner), {
    enableChangeListener: !separate,
    useNewConnection: separate,
  });
  sqlite.execSync('PRAGMA journal_mode = WAL;');
  const db = drizzle(sqlite, { schema });
  await migrate(db, migrations);
  seedCatalog(db);
  seedTemplates(db);
  return { db, sqlite, owner };
}

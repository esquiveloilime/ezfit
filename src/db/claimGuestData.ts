import { deleteDatabaseAsync } from 'expo-sqlite';

import { claimStatements, guestSelects, type Row } from './claim';
import { databaseName, LOCAL_OWNER, openAppDatabase } from './client';

/**
 * Pasa los datos del modo sin cuenta a la base de datos de la cuenta (CUE-07).
 * Todo se escribe en una sola transacción: si algo falla, la base de la cuenta
 * no cambia y los datos del modo sin cuenta siguen intactos.
 */
export async function claimGuestData(userId: string): Promise<void> {
  const guest = await openAppDatabase(LOCAL_OWNER, { separate: true });
  const target = await openAppDatabase(userId, { separate: true });
  try {
    const existing = target.sqlite.getFirstSync<{ n: number }>(
      'SELECT COUNT(*) AS n FROM profiles WHERE user_id = ? AND deleted_at IS NULL',
      [userId],
    );
    const copyProfile = (existing?.n ?? 0) === 0;

    const copied = guestSelects({ copyProfile }).map(({ table, sql }) => ({
      table,
      rows: guest.sqlite.getAllSync<Row>(sql),
    }));
    const statements = claimStatements(userId, copied);

    target.sqlite.withTransactionSync(() => {
      for (const s of statements) target.sqlite.runSync(s.sql, s.params);
    });
  } finally {
    await guest.sqlite.closeAsync().catch(() => undefined);
    await target.sqlite.closeAsync().catch(() => undefined);
  }
}

/** Borra la base del modo sin cuenta. Si no existe o está abierta, no pasa nada. */
export async function deleteGuestData(): Promise<void> {
  await deleteDatabaseAsync(databaseName(LOCAL_OWNER)).catch(() => undefined);
}

import { eq } from 'drizzle-orm';

import type { Db } from '../client';
import { appMeta } from '../schema';

/** Datos internos de la app en este teléfono; no se sincronizan. */
export function getMeta(db: Db, key: string): string | null {
  return db.select({ value: appMeta.value }).from(appMeta).where(eq(appMeta.key, key)).get()?.value ?? null;
}

export function setMeta(db: Db, key: string, value: string): void {
  db.insert(appMeta).values({ key, value }).onConflictDoUpdate({ target: appMeta.key, set: { value } }).run();
}

export function deleteMeta(db: Db, key: string): void {
  db.delete(appMeta).where(eq(appMeta.key, key)).run();
}

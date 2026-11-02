import { newId } from '@/domain/id';

import type { SyncStatus } from './schema';

/** Campos comunes de un registro nuevo creado en el teléfono (plan técnico, sección 4). */
export function newRecord(owner: string, now: number = Date.now()) {
  return {
    id: newId(),
    userId: owner,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    syncStatus: 'pending' as SyncStatus,
  };
}

/** Campos que cambian en toda modificación: la fecha y la marca de pendiente de subir. */
export function touched(now: number = Date.now()) {
  return { updatedAt: now, syncStatus: 'pending' as SyncStatus };
}

/** Borrado lógico: el registro se marca para que el borrado también se sincronice. */
export function softDeleted(now: number = Date.now()) {
  return { deletedAt: now, ...touched(now) };
}

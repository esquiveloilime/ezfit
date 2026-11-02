import { eq, isNull } from 'drizzle-orm';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';

import { appMeta, planDays, plans, routineExercises, routines } from '../schema';
import { templateRows, TEMPLATES_VERSION } from './templates';

const META_KEY = 'templates_version';

// `any`: el esquema concreto y el tipo de resultado no importan para cargar las plantillas.
type SyncDb = BaseSQLiteDatabase<'sync', any, any>;

/**
 * Carga o actualiza las rutinas predeterminadas y los planes (RUT-01) cuando cambia
 * su versión. Las plantillas no tienen dueño y no se suben a Supabase: los ejercicios
 * y días de las plantillas se reemplazan completos para que no queden restos viejos.
 */
export function seedTemplates(db: SyncDb, now: number = Date.now()): void {
  const current = db.select().from(appMeta).where(eq(appMeta.key, META_KEY)).get();
  if (current && Number(current.value) >= TEMPLATES_VERSION) return;

  const rows = templateRows();
  const base = { userId: null, createdAt: now, updatedAt: now, deletedAt: null, syncStatus: 'synced' as const };

  db.transaction((tx) => {
    for (const r of rows.routines) {
      const { id, ...values } = r;
      tx.insert(routines)
        .values({ id, ...base, ...values })
        .onConflictDoUpdate({ target: routines.id, set: { ...values, updatedAt: now } })
        .run();
    }
    for (const p of rows.plans) {
      const { id, ...values } = p;
      tx.insert(plans)
        .values({ id, ...base, ...values })
        .onConflictDoUpdate({ target: plans.id, set: { ...values, updatedAt: now } })
        .run();
    }
    tx.delete(routineExercises).where(isNull(routineExercises.userId)).run();
    for (const re of rows.routineExercises) tx.insert(routineExercises).values({ ...base, ...re }).run();
    tx.delete(planDays).where(isNull(planDays.userId)).run();
    for (const pd of rows.planDays) tx.insert(planDays).values({ ...base, ...pd }).run();

    tx.insert(appMeta)
      .values({ key: META_KEY, value: String(TEMPLATES_VERSION) })
      .onConflictDoUpdate({ target: appMeta.key, set: { value: String(TEMPLATES_VERSION) } })
      .run();
  });
}

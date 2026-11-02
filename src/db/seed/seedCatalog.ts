import { eq } from 'drizzle-orm';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';

import { appMeta, exercises } from '../schema';
import { CATALOG_EXERCISES, CATALOG_VERSION, catalogExerciseId } from './exercises';

const META_KEY = 'catalog_version';

// Acepta cualquier base de datos de Drizzle en modo síncrono (la de la app).
// `any`: el esquema concreto y el tipo de resultado no importan para cargar el catálogo.
type SyncDb = BaseSQLiteDatabase<'sync', any, any>;

/**
 * Carga o actualiza el catálogo incluido en la app. Solo trabaja si la versión del
 * catálogo cambió desde la última vez, y lo hace en una transacción.
 * Los ejercicios del catálogo no tienen dueño y no se suben a Supabase.
 */
export function seedCatalog(db: SyncDb, now: number = Date.now()): void {
  const current = db.select().from(appMeta).where(eq(appMeta.key, META_KEY)).get();
  if (current && Number(current.value) >= CATALOG_VERSION) return;

  db.transaction((tx) => {
    for (const e of CATALOG_EXERCISES) {
      const values = {
        name: e.name,
        muscleGroup: e.muscle,
        secondaryMuscles: JSON.stringify(e.secondary),
        equipment: e.equipment,
        trackingType: e.tracking,
        usesRir: e.tracking === 'weight_reps' || e.tracking === 'reps',
        usesTechnique: true,
        updatedAt: now,
      };
      tx.insert(exercises)
        .values({
          id: catalogExerciseId(e.n),
          userId: null,
          createdAt: now,
          syncStatus: 'synced',
          ...values,
        })
        .onConflictDoUpdate({ target: exercises.id, set: values })
        .run();
    }
    tx.insert(appMeta)
      .values({ key: META_KEY, value: String(CATALOG_VERSION) })
      .onConflictDoUpdate({ target: appMeta.key, set: { value: String(CATALOG_VERSION) } })
      .run();
  });
}

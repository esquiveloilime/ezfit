import { and, asc, count, eq, inArray, isNull } from 'drizzle-orm';

import type { SavedItem } from '@/domain/routine';

import type { Db } from '../client';
import { newRecord, softDeleted, touched } from '../records';
import { exercises, planDays, plans, routineExercises, routines } from '../schema';

export type RoutineRow = typeof routines.$inferSelect;

const notDeleted = isNull(routines.deletedAt);

/** Rutinas propias del usuario (RUT-03). */
export function ownRoutinesQuery(db: Db, owner: string) {
  return db
    .select()
    .from(routines)
    .where(and(eq(routines.userId, owner), eq(routines.category, 'own'), notDeleted))
    .orderBy(asc(routines.name));
}

/** Plantillas por tiempo y por músculo (RUT-01). Las de los planes se ven dentro de cada plan. */
export function templateRoutinesQuery(db: Db) {
  return db
    .select()
    .from(routines)
    .where(and(isNull(routines.userId), inArray(routines.category, ['time', 'muscle']), notDeleted))
    .orderBy(asc(routines.estimatedMinutes), asc(routines.name));
}

export function templatePlansQuery(db: Db) {
  return db
    .select()
    .from(plans)
    .where(and(isNull(plans.userId), isNull(plans.deletedAt)))
    .orderBy(asc(plans.daysPerWeek));
}

/** Cuántos ejercicios tiene cada rutina, para mostrarlo en las listas. */
export function routineExerciseCountsQuery(db: Db) {
  return db
    .select({ routineId: routineExercises.routineId, n: count() })
    .from(routineExercises)
    .where(isNull(routineExercises.deletedAt))
    .groupBy(routineExercises.routineId);
}

export function routineByIdQuery(db: Db, id: string) {
  return db.select().from(routines).where(eq(routines.id, id)).limit(1);
}

/** Ejercicios de una rutina, en orden, con su nombre. */
export function routineItemsQuery(db: Db, routineId: string) {
  return db
    .select({
      id: routineExercises.id,
      exerciseId: routineExercises.exerciseId,
      position: routineExercises.position,
      targetSets: routineExercises.targetSets,
      repsMin: routineExercises.repsMin,
      repsMax: routineExercises.repsMax,
      restSeconds: routineExercises.restSeconds,
      name: exercises.name,
      muscleGroup: exercises.muscleGroup,
    })
    .from(routineExercises)
    .leftJoin(exercises, eq(exercises.id, routineExercises.exerciseId))
    .where(and(eq(routineExercises.routineId, routineId), isNull(routineExercises.deletedAt)))
    .orderBy(asc(routineExercises.position));
}

export function planByIdQuery(db: Db, id: string) {
  return db.select().from(plans).where(eq(plans.id, id)).limit(1);
}

/** Días de un plan, en orden, con el nombre de su rutina. */
export function planDaysQuery(db: Db, planId: string) {
  return db
    .select({
      id: planDays.id,
      position: planDays.position,
      weekday: planDays.weekday,
      routineId: planDays.routineId,
      routineName: routines.name,
    })
    .from(planDays)
    .leftJoin(routines, eq(routines.id, planDays.routineId))
    .where(and(eq(planDays.planId, planId), isNull(planDays.deletedAt)))
    .orderBy(asc(planDays.position));
}

function itemColumns(item: SavedItem) {
  return {
    exerciseId: item.exerciseId,
    position: item.position,
    targetSets: item.targetSets,
    repsMin: item.repsMin,
    repsMax: item.repsMax,
    restSeconds: item.restSeconds,
  };
}

/**
 * Guarda una rutina propia nueva (`routineId` nulo) o editada, con sus ejercicios en
 * orden, en una sola transacción. Devuelve el identificador de la rutina.
 */
export function saveRoutine(
  db: Db,
  owner: string,
  routineId: string | null,
  name: string,
  items: SavedItem[],
): string {
  const now = Date.now();
  return db.transaction((tx) => {
    let id = routineId;
    if (id === null) {
      const record = newRecord(owner, now);
      tx.insert(routines).values({ ...record, name, category: 'own' }).run();
      id = record.id;
    } else {
      tx.update(routines)
        .set({ name, ...touched(now) })
        .where(and(eq(routines.id, id), eq(routines.userId, owner)))
        .run();
    }

    const existing = tx
      .select({ id: routineExercises.id })
      .from(routineExercises)
      .where(and(eq(routineExercises.routineId, id), isNull(routineExercises.deletedAt)))
      .all()
      .map((r) => r.id);
    const kept = new Set<string>();

    for (const item of items) {
      if (item.routineExerciseId && existing.includes(item.routineExerciseId)) {
        kept.add(item.routineExerciseId);
        tx.update(routineExercises)
          .set({ ...itemColumns(item), ...touched(now) })
          .where(eq(routineExercises.id, item.routineExerciseId))
          .run();
      } else {
        tx.insert(routineExercises)
          .values({ ...newRecord(owner, now), routineId: id, ...itemColumns(item) })
          .run();
      }
    }
    const removed = existing.filter((x) => !kept.has(x));
    if (removed.length) {
      tx.update(routineExercises).set(softDeleted(now)).where(inArray(routineExercises.id, removed)).run();
    }
    return id;
  });
}

/** Copia una rutina (propia o plantilla) como rutina propia editable (RUT-04). */
export function duplicateRoutine(db: Db, owner: string, sourceId: string, name: string): string {
  const now = Date.now();
  return db.transaction((tx) => {
    const source = tx.select().from(routines).where(eq(routines.id, sourceId)).get();
    if (!source) throw new Error('La rutina a duplicar no existe');
    const record = newRecord(owner, now);
    tx.insert(routines)
      .values({
        ...record,
        name,
        description: source.description,
        category: 'own',
        estimatedMinutes: source.estimatedMinutes,
      })
      .run();
    const items = tx
      .select()
      .from(routineExercises)
      .where(and(eq(routineExercises.routineId, sourceId), isNull(routineExercises.deletedAt)))
      .orderBy(asc(routineExercises.position))
      .all();
    items.forEach((item, position) => {
      tx.insert(routineExercises)
        .values({
          ...newRecord(owner, now),
          routineId: record.id,
          exerciseId: item.exerciseId,
          position,
          targetSets: item.targetSets,
          repsMin: item.repsMin,
          repsMax: item.repsMax,
          restSeconds: item.restSeconds,
        })
        .run();
    });
    return record.id;
  });
}

/** Elimina una rutina propia y sus ejercicios (borrado lógico). Las sesiones no cambian. */
export function deleteRoutine(db: Db, owner: string, id: string): void {
  const now = Date.now();
  db.transaction((tx) => {
    tx.update(routines)
      .set(softDeleted(now))
      .where(and(eq(routines.id, id), eq(routines.userId, owner)))
      .run();
    tx.update(routineExercises)
      .set(softDeleted(now))
      .where(and(eq(routineExercises.routineId, id), eq(routineExercises.userId, owner), isNull(routineExercises.deletedAt)))
      .run();
  });
}

/** Lee una rutina con sus ejercicios en este momento (para empezar a editarla). */
export function loadRoutineForEdit(db: Db, id: string) {
  const routine = db.select().from(routines).where(eq(routines.id, id)).get();
  if (!routine) return null;
  const items = routineItemsQuery(db, id).all();
  return { routine, items };
}

import { and, asc, desc, eq, isNull } from 'drizzle-orm';

import type { CardioMachine, CardioValues } from '@/domain/cardio';

import type { Db } from '../client';
import { newRecord, softDeleted, touched } from '../records';
import { cardioEntries, workouts } from '../schema';

export type CardioRow = typeof cardioEntries.$inferSelect;

/** Bloques de cardio de una sesión, en orden (CAR-01). */
export function workoutCardioQuery(db: Db, workoutId: string) {
  return db
    .select()
    .from(cardioEntries)
    .where(and(eq(cardioEntries.workoutId, workoutId), isNull(cardioEntries.deletedAt)))
    .orderBy(asc(cardioEntries.position));
}

export function toCardioValues(row: CardioRow): CardioValues {
  return {
    machineType: row.machineType,
    durationSeconds: row.durationSeconds ?? 0,
    level: row.level,
    speed: row.speed,
    distanceMeters: row.distanceMeters,
    incline: row.incline,
    notes: row.notes,
  };
}

/** Agrega un bloque de cardio al final de la sesión (CAR-01). */
export function addCardio(db: Db, owner: string, workoutId: string, values: CardioValues): string {
  const existing = db
    .select({ position: cardioEntries.position })
    .from(cardioEntries)
    .where(and(eq(cardioEntries.workoutId, workoutId), isNull(cardioEntries.deletedAt)))
    .all();
  const position = existing.length ? Math.max(...existing.map((e) => e.position)) + 1 : 0;
  const record = newRecord(owner);
  db.insert(cardioEntries).values({ ...record, workoutId, position, ...values }).run();
  return record.id;
}

export function updateCardio(db: Db, id: string, values: CardioValues): void {
  db.update(cardioEntries).set({ ...values, ...touched() }).where(eq(cardioEntries.id, id)).run();
}

export function deleteCardio(db: Db, id: string): void {
  db.update(cardioEntries).set(softDeleted()).where(eq(cardioEntries.id, id)).run();
}

/**
 * Los valores de la última vez que se usó cada aparato (CAR-01), de cualquier sesión del
 * usuario, incluida la que está en curso.
 */
export function lastCardioByMachine(db: Db, owner: string): Map<CardioMachine, CardioValues> {
  const rows = db
    .select({ entry: cardioEntries })
    .from(cardioEntries)
    .innerJoin(workouts, eq(workouts.id, cardioEntries.workoutId))
    .where(and(eq(workouts.userId, owner), isNull(workouts.deletedAt), isNull(cardioEntries.deletedAt)))
    .orderBy(desc(workouts.startedAt), desc(cardioEntries.position))
    .all();
  const result = new Map<CardioMachine, CardioValues>();
  for (const { entry } of rows) {
    if (!result.has(entry.machineType)) result.set(entry.machineType, toCardioValues(entry));
  }
  return result;
}

import { and, asc, desc, eq, gte, inArray, isNotNull, isNull } from 'drizzle-orm';

import { moveItem } from '@/domain/routine';
import type { LoggedSet, SetValues } from '@/domain/workout';

import type { Db } from '../client';
import { newRecord, softDeleted, touched } from '../records';
import { exercises, routineExercises, sets, workoutExercises, workouts } from '../schema';

export type WorkoutRow = typeof workouts.$inferSelect;
export type SetRow = typeof sets.$inferSelect;

/** La sesión en curso del usuario, si hay una (SES-01: solo una a la vez). */
export function activeWorkoutQuery(db: Db, owner: string) {
  return db
    .select()
    .from(workouts)
    .where(and(eq(workouts.userId, owner), eq(workouts.status, 'in_progress'), isNull(workouts.deletedAt)))
    .orderBy(desc(workouts.startedAt))
    .limit(1);
}

/** Las sesiones terminadas que empezaron desde `since` (el inicio de hoy), de la más temprana a la más reciente. */
export function finishedSinceQuery(db: Db, owner: string, since: number) {
  return db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.userId, owner),
        eq(workouts.status, 'finished'),
        isNull(workouts.deletedAt),
        gte(workouts.startedAt, since),
      ),
    )
    .orderBy(asc(workouts.startedAt));
}

export function getActiveWorkout(db: Db, owner: string): WorkoutRow | undefined {
  return activeWorkoutQuery(db, owner).get();
}

/** Ejercicios de una sesión, en orden, con los datos del ejercicio. */
export function workoutItemsQuery(db: Db, workoutId: string) {
  return db
    .select({
      id: workoutExercises.id,
      exerciseId: workoutExercises.exerciseId,
      position: workoutExercises.position,
      machine: workoutExercises.machine,
      name: exercises.name,
      trackingType: exercises.trackingType,
      usesRir: exercises.usesRir,
      usesTechnique: exercises.usesTechnique,
    })
    .from(workoutExercises)
    .leftJoin(exercises, eq(exercises.id, workoutExercises.exerciseId))
    .where(and(eq(workoutExercises.workoutId, workoutId), isNull(workoutExercises.deletedAt)))
    .orderBy(asc(workoutExercises.position));
}

/** Todas las series de una sesión, en orden. */
export function workoutSetsQuery(db: Db, workoutId: string) {
  return db
    .select({
      id: sets.id,
      workoutExerciseId: sets.workoutExerciseId,
      position: sets.position,
      kind: sets.kind,
      weight: sets.weight,
      unit: sets.unit,
      reps: sets.reps,
      durationSeconds: sets.durationSeconds,
      distanceMeters: sets.distanceMeters,
      rir: sets.rir,
      technique: sets.technique,
      performedAt: sets.performedAt,
    })
    .from(sets)
    .innerJoin(workoutExercises, eq(workoutExercises.id, sets.workoutExerciseId))
    .where(
      and(
        eq(workoutExercises.workoutId, workoutId),
        isNull(workoutExercises.deletedAt),
        isNull(sets.deletedAt),
      ),
    )
    .orderBy(asc(sets.position), asc(sets.performedAt));
}

export type WorkoutSet = Awaited<ReturnType<ReturnType<typeof workoutSetsQuery>['all']>>[number];

/**
 * Empieza una sesión (SES-01): vacía (`routineId` nulo) o con los ejercicios de una rutina.
 * Si ya hay una sesión en curso, no crea otra y devuelve la que existe.
 */
export function startWorkout(db: Db, owner: string, routineId: string | null): { id: string; resumed: boolean } {
  const now = Date.now();
  return db.transaction((tx) => {
    const active = tx
      .select({ id: workouts.id })
      .from(workouts)
      .where(and(eq(workouts.userId, owner), eq(workouts.status, 'in_progress'), isNull(workouts.deletedAt)))
      .get();
    if (active) return { id: active.id, resumed: true };

    const record = newRecord(owner, now);
    tx.insert(workouts).values({ ...record, routineId, startedAt: now, status: 'in_progress' }).run();
    if (routineId) {
      const items = tx
        .select({ exerciseId: routineExercises.exerciseId })
        .from(routineExercises)
        .where(and(eq(routineExercises.routineId, routineId), isNull(routineExercises.deletedAt)))
        .orderBy(asc(routineExercises.position))
        .all();
      items.forEach((item, position) => {
        tx.insert(workoutExercises)
          .values({
            ...newRecord(owner, now),
            workoutId: record.id,
            exerciseId: item.exerciseId,
            position,
            machine: machineHistory(tx, owner, item.exerciseId)[0] ?? null,
          })
          .run();
      });
    }
    return { id: record.id, resumed: false };
  });
}

function activeItems(db: Db, workoutId: string) {
  return db
    .select({ id: workoutExercises.id, position: workoutExercises.position })
    .from(workoutExercises)
    .where(and(eq(workoutExercises.workoutId, workoutId), isNull(workoutExercises.deletedAt)))
    .orderBy(asc(workoutExercises.position))
    .all();
}

/** Agrega un ejercicio al final de la sesión (SES-02). */
export function addWorkoutExercise(db: Db, owner: string, workoutId: string, exerciseId: string): string {
  const items = activeItems(db, workoutId);
  const position = items.length ? Math.max(...items.map((i) => i.position)) + 1 : 0;
  const record = newRecord(owner);
  const machine = machineHistory(db, owner, exerciseId)[0] ?? null;
  db.insert(workoutExercises).values({ ...record, workoutId, exerciseId, position, machine }).run();
  return record.id;
}

/** Quita un ejercicio de la sesión junto con sus series (borrado lógico). */
export function removeWorkoutExercise(db: Db, workoutExerciseId: string): void {
  const now = Date.now();
  db.transaction((tx) => {
    tx.update(workoutExercises).set(softDeleted(now)).where(eq(workoutExercises.id, workoutExerciseId)).run();
    tx.update(sets)
      .set(softDeleted(now))
      .where(and(eq(sets.workoutExerciseId, workoutExerciseId), isNull(sets.deletedAt)))
      .run();
  });
}

/** Cambia de lugar un ejercicio de la sesión y renumera los demás (SES-02). */
export function moveWorkoutExercise(db: Db, workoutId: string, from: number, to: number): void {
  const now = Date.now();
  db.transaction((tx) => {
    const items = tx
      .select({ id: workoutExercises.id, position: workoutExercises.position })
      .from(workoutExercises)
      .where(and(eq(workoutExercises.workoutId, workoutId), isNull(workoutExercises.deletedAt)))
      .orderBy(asc(workoutExercises.position))
      .all();
    moveItem(items, from, to).forEach((item, position) => {
      if (item.position !== position) {
        tx.update(workoutExercises)
          .set({ position, ...touched(now) })
          .where(eq(workoutExercises.id, item.id))
          .run();
      }
    });
  });
}

/** Registra una serie nueva al final del ejercicio (SES-03). */
export function addSet(db: Db, owner: string, workoutExerciseId: string, values: SetValues): string {
  const now = Date.now();
  const existing = db
    .select({ position: sets.position })
    .from(sets)
    .where(and(eq(sets.workoutExerciseId, workoutExerciseId), isNull(sets.deletedAt)))
    .all();
  const position = existing.length ? Math.max(...existing.map((s) => s.position)) + 1 : 0;
  const record = newRecord(owner, now);
  db.insert(sets).values({ ...record, workoutExerciseId, position, performedAt: now, ...values }).run();
  return record.id;
}

/** Corrige una serie ya registrada (SES-09). */
export function updateSet(db: Db, setId: string, values: SetValues): void {
  db.update(sets).set({ ...values, ...touched() }).where(eq(sets.id, setId)).run();
}

/** Elimina una serie (SES-09, borrado lógico). */
export function deleteSet(db: Db, setId: string): void {
  db.update(sets).set(softDeleted()).where(eq(sets.id, setId)).run();
}

export type LastSession = { workoutExerciseId: string; startedAt: number; machine: string | null; sets: LoggedSet[] };

/**
 * Lo que se hizo la última vez en cada ejercicio (SES-03): las series de la sesión
 * terminada más reciente que lo incluye, sin contar la sesión `excludeWorkoutId`.
 */
export function lastSessions(
  db: Db,
  owner: string,
  exerciseIds: readonly string[],
  excludeWorkoutId: string | null,
): Map<string, LastSession> {
  const result = new Map<string, LastSession>();
  if (exerciseIds.length === 0) return result;
  const rows = db
    .select({
      workoutId: workouts.id,
      workoutExerciseId: workoutExercises.id,
      exerciseId: workoutExercises.exerciseId,
      machine: workoutExercises.machine,
      startedAt: workouts.startedAt,
    })
    .from(workoutExercises)
    .innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
    .where(
      and(
        inArray(workoutExercises.exerciseId, [...exerciseIds]),
        isNull(workoutExercises.deletedAt),
        eq(workouts.userId, owner),
        eq(workouts.status, 'finished'),
        isNull(workouts.deletedAt),
      ),
    )
    .orderBy(desc(workouts.startedAt), asc(workoutExercises.position))
    .all();

  const chosen = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    if (row.workoutId !== excludeWorkoutId && !chosen.has(row.exerciseId)) chosen.set(row.exerciseId, row);
  }
  if (chosen.size === 0) return result;

  const setRows = db
    .select()
    .from(sets)
    .where(and(inArray(sets.workoutExerciseId, [...chosen.values()].map((r) => r.workoutExerciseId)), isNull(sets.deletedAt)))
    .orderBy(asc(sets.position), asc(sets.performedAt))
    .all();

  for (const [exerciseId, row] of chosen) {
    const own = setRows.filter((s) => s.workoutExerciseId === row.workoutExerciseId);
    if (own.length === 0) continue;
    result.set(exerciseId, {
      workoutExerciseId: row.workoutExerciseId,
      startedAt: row.startedAt,
      machine: row.machine,
      sets: own.map(toLoggedSet),
    });
  }
  return result;
}

export function toLoggedSet(
  row: Pick<SetRow, 'kind' | 'weight' | 'unit' | 'reps' | 'durationSeconds' | 'distanceMeters' | 'rir' | 'technique'>,
): LoggedSet {
  return {
    kind: row.kind,
    weight: row.weight,
    unit: row.unit,
    reps: row.reps,
    durationSeconds: row.durationSeconds,
    distanceMeters: row.distanceMeters,
    rir: row.rir,
    technique: row.technique,
  };
}

/** Objetivos y descanso de cada ejercicio en la rutina de origen de la sesión. */
export function routineTargets(db: Db, routineId: string | null) {
  const map = new Map<string, { targetSets: number | null; repsMin: number | null; repsMax: number | null; restSeconds: number | null }>();
  if (!routineId) return map;
  const rows = db
    .select()
    .from(routineExercises)
    .where(and(eq(routineExercises.routineId, routineId), isNull(routineExercises.deletedAt)))
    .orderBy(asc(routineExercises.position))
    .all();
  for (const r of rows) {
    if (!map.has(r.exerciseId)) {
      map.set(r.exerciseId, { targetSets: r.targetSets, repsMin: r.repsMin, repsMax: r.repsMax, restSeconds: r.restSeconds });
    }
  }
  return map;
}

type Reader = Pick<Db, 'select'>;

/**
 * Máquinas anotadas antes en un ejercicio, de la más reciente a la más antigua (SES-06).
 * La primera es la que viene por defecto al agregar el ejercicio a una sesión.
 */
export function machineHistory(db: Reader, owner: string, exerciseId: string): string[] {
  return db
    .select({ machine: workoutExercises.machine })
    .from(workoutExercises)
    .innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
    .where(
      and(
        eq(workoutExercises.exerciseId, exerciseId),
        isNotNull(workoutExercises.machine),
        isNull(workoutExercises.deletedAt),
        eq(workouts.userId, owner),
        isNull(workouts.deletedAt),
      ),
    )
    .orderBy(desc(workouts.startedAt))
    .all()
    .map((r) => r.machine)
    .filter((m): m is string => !!m);
}

/** Anota la máquina usada en un ejercicio de la sesión (SES-06). */
export function setMachine(db: Db, workoutExerciseId: string, machine: string | null): void {
  db.update(workoutExercises)
    .set({ machine, ...touched() })
    .where(eq(workoutExercises.id, workoutExerciseId))
    .run();
}

/** Termina la sesión con su ánimo y nota (SES-07, SES-11). */
export function finishWorkout(db: Db, workoutId: string, values: { mood: number | null; notes: string | null }): void {
  const now = Date.now();
  db.update(workouts)
    .set({ status: 'finished', endedAt: now, mood: values.mood, notes: values.notes, ...touched(now) })
    .where(eq(workouts.id, workoutId))
    .run();
}

/** Descarta la sesión con sus ejercicios y series (SES-11, borrado lógico). */
export function discardWorkout(db: Db, workoutId: string): void {
  const now = Date.now();
  db.transaction((tx) => {
    const items = tx
      .select({ id: workoutExercises.id })
      .from(workoutExercises)
      .where(eq(workoutExercises.workoutId, workoutId))
      .all()
      .map((i) => i.id);
    if (items.length) {
      tx.update(sets)
        .set(softDeleted(now))
        .where(and(inArray(sets.workoutExerciseId, items), isNull(sets.deletedAt)))
        .run();
      tx.update(workoutExercises)
        .set(softDeleted(now))
        .where(and(inArray(workoutExercises.id, items), isNull(workoutExercises.deletedAt)))
        .run();
    }
    tx.update(workouts).set(softDeleted(now)).where(eq(workouts.id, workoutId)).run();
  });
}

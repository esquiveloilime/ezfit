import { and, asc, desc, eq, isNull, ne } from 'drizzle-orm';

import { newId } from '@/domain/id';
import { encodeRoute, paceSecondsPerKm, type RoutePoint, type RunKind, routeDistance } from '@/domain/run';

import type { Db } from '../client';
import { newRecord, softDeleted, touched } from '../records';
import { runPoints, runs } from '../schema';

export type RunRow = typeof runs.$inferSelect;

// Estados de una actividad: `recording` y `paused` mientras está activa. Al terminar queda
// en `paused` con `endedAt` y sus métricas, pendiente de guardar o descartar (RUN-05); al
// guardarla pasa a `finished`.

/** La actividad sin guardar del usuario, si hay una: en curso, o terminada sin guardar. */
export function activeRunQuery(db: Db, owner: string) {
  return db
    .select()
    .from(runs)
    .where(and(eq(runs.userId, owner), ne(runs.status, 'finished'), isNull(runs.deletedAt)))
    .orderBy(desc(runs.startedAt))
    .limit(1);
}

export function startRun(db: Db, owner: string, kind: RunKind, now: number = Date.now()): string {
  const record = newRecord(owner, now);
  db.insert(runs).values({ ...record, kind, startedAt: now, status: 'recording' }).run();
  return record.id;
}

/** Guarda un punto aceptado en cuanto llega, para no perderlo si la app se cierra (RUN-08). */
export function addRunPoint(db: Db, runId: string, point: RoutePoint): void {
  db.insert(runPoints)
    .values({
      id: newId(),
      runId,
      latitude: point.latitude,
      longitude: point.longitude,
      accuracy: point.accuracy,
      recordedAt: point.timestamp,
      segment: point.segment,
    })
    .run();
}

export function getRunPoints(db: Db, runId: string): RoutePoint[] {
  return db
    .select()
    .from(runPoints)
    .where(eq(runPoints.runId, runId))
    .orderBy(asc(runPoints.recordedAt))
    .all()
    .map((p) => ({
      latitude: p.latitude,
      longitude: p.longitude,
      accuracy: p.accuracy,
      timestamp: p.recordedAt,
      segment: p.segment,
    }));
}

export function setRunStatus(db: Db, runId: string, status: 'recording' | 'paused', movingSeconds: number): void {
  db.update(runs)
    .set({ status, movingSeconds: Math.round(movingSeconds), ...touched() })
    .where(eq(runs.id, runId))
    .run();
}

/**
 * Termina la actividad: calcula la distancia y el ritmo con los puntos guardados y la deja
 * lista para el resumen (RUN-05).
 */
export function endRun(db: Db, runId: string, movingSeconds: number, now: number = Date.now()): void {
  const points = getRunPoints(db, runId);
  const distance = routeDistance(points);
  const seconds = Math.round(movingSeconds);
  db.update(runs)
    .set({
      status: 'paused',
      endedAt: now,
      movingSeconds: seconds,
      distanceMeters: distance,
      avgPaceSecondsPerKm: paceSecondsPerKm(distance, seconds),
      route: encodeRoute(points),
      ...touched(now),
    })
    .where(eq(runs.id, runId))
    .run();
}

/** Guarda la actividad terminada con su nombre y notas; desde aquí aparece en el historial (RUN-05). */
export function saveRun(db: Db, runId: string, values: { name: string; notes: string | null }): void {
  db.update(runs)
    .set({ status: 'finished', name: values.name, notes: values.notes, ...touched() })
    .where(eq(runs.id, runId))
    .run();
}

/** Actividades guardadas, de la más reciente a la más antigua (RUN-06). */
export function finishedRunsQuery(db: Db, owner: string) {
  return db
    .select()
    .from(runs)
    .where(and(eq(runs.userId, owner), eq(runs.status, 'finished'), isNull(runs.deletedAt)))
    .orderBy(desc(runs.startedAt));
}

export function runByIdQuery(db: Db, runId: string) {
  return db
    .select()
    .from(runs)
    .where(and(eq(runs.id, runId), isNull(runs.deletedAt)))
    .limit(1);
}

/** Descarta una actividad: se marca como borrada y sus puntos se eliminan del teléfono. */
export function discardRun(db: Db, runId: string): void {
  db.transaction((tx) => {
    tx.update(runs).set(softDeleted()).where(eq(runs.id, runId)).run();
    tx.delete(runPoints).where(eq(runPoints.runId, runId)).run();
  });
}

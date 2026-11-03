import { and, asc, desc, eq, isNull, ne } from 'drizzle-orm';

import { newId } from '@/domain/id';
import { paceSecondsPerKm, type RoutePoint, type RunKind, routeDistance } from '@/domain/run';

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
  const distance = routeDistance(getRunPoints(db, runId));
  const seconds = Math.round(movingSeconds);
  db.update(runs)
    .set({
      status: 'paused',
      endedAt: now,
      movingSeconds: seconds,
      distanceMeters: distance,
      avgPaceSecondsPerKm: paceSecondsPerKm(distance, seconds),
      ...touched(now),
    })
    .where(eq(runs.id, runId))
    .run();
}

/** Descarta una actividad: se marca como borrada y sus puntos se eliminan del teléfono. */
export function discardRun(db: Db, runId: string): void {
  db.transaction((tx) => {
    tx.update(runs).set(softDeleted()).where(eq(runs.id, runId)).run();
    tx.delete(runPoints).where(eq(runPoints.runId, runId)).run();
  });
}

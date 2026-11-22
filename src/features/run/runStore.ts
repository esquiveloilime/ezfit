import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { create } from 'zustand';

import type { Db } from '@/db/client';
import { deleteMeta, getMeta, setMeta } from '@/db/repositories/meta';
import { addRunPoint, endRun, getRunPoints, type RunRow, setRunStatus, startRun } from '@/db/repositories/runs';
import {
  filterPoint,
  type Fix,
  type MovingClock,
  movingMs,
  parseClock,
  pauseClock,
  recoveredMovingMs,
  resumeClock,
  type RoutePoint,
  type RunKind,
  startClock,
  stepDistance,
} from '@/domain/run';
import { watchLocation } from '@/services/location';

// Actividad de running en curso (RUN-03, RUN-04, RUN-08). Vive en memoria para la pantalla;
// cada punto aceptado se guarda de inmediato en `run_points`, y el reloj en `app_meta`, para
// poder recuperar lo registrado si la app se cierra.

const CLOCK_KEY = 'active_run';
const KEEP_AWAKE_TAG = 'ezfit-run';

type Active = {
  runId: string;
  kind: RunKind;
  clock: MovingClock;
  points: RoutePoint[];
  distance: number;
};

type State = { active: Active | null; lastFix: Fix | null };

export const useRunStore = create<State>(() => ({ active: null, lastFix: null }));

let stopWatching: (() => void) | null = null;

function saveClock(db: Db, runId: string, clock: MovingClock) {
  setMeta(db, CLOCK_KEY, JSON.stringify({ runId, ...clock }));
}

function onFix(db: Db, fix: Fix) {
  const { active } = useRunStore.getState();
  if (!active || active.clock.segmentStartedAt === null) {
    useRunStore.setState({ lastFix: fix });
    return;
  }
  const point: RoutePoint = { ...fix, segment: active.clock.segment };
  const last = active.points[active.points.length - 1] ?? null;
  if (filterPoint(last, point) !== 'accept') {
    useRunStore.setState({ lastFix: fix });
    return;
  }
  try {
    addRunPoint(db, active.runId, point);
  } catch (error) {
    console.error('No se pudo guardar el punto', error);
    return;
  }
  useRunStore.setState({
    lastFix: fix,
    active: { ...active, points: [...active.points, point], distance: active.distance + stepDistance(last, point) },
  });
}

/**
 * Empieza a grabar: crea la actividad, lee el GPS y mantiene la pantalla encendida (RUN-03).
 * `seed` es la última lectura de la pantalla previa, para que el mapa de la actividad empiece
 * centrado en el usuario sin esperar la primera lectura nueva.
 */
export async function beginRun(db: Db, owner: string, kind: RunKind, seed: Fix | null = null): Promise<void> {
  if (useRunStore.getState().active) return;
  const now = Date.now();
  const runId = startRun(db, owner, kind, now);
  const clock = startClock(now);
  saveClock(db, runId, clock);
  useRunStore.setState({ active: { runId, kind, clock, points: [], distance: 0 }, lastFix: seed });
  void activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => undefined);
  try {
    stopWatching?.();
    stopWatching = await watchLocation((fix) => onFix(db, fix));
  } catch (error) {
    console.warn('No se pudo leer la ubicación', error);
  }
}

export function pauseRun(db: Db): void {
  const { active } = useRunStore.getState();
  if (!active || active.clock.segmentStartedAt === null) return;
  const now = Date.now();
  const clock = pauseClock(active.clock, now);
  saveClock(db, active.runId, clock);
  setRunStatus(db, active.runId, 'paused', clock.movingMsBefore / 1000);
  useRunStore.setState({ active: { ...active, clock } });
}

export function resumeRun(db: Db): void {
  const { active } = useRunStore.getState();
  if (!active || active.clock.segmentStartedAt !== null) return;
  const clock = resumeClock(active.clock, Date.now());
  saveClock(db, active.runId, clock);
  setRunStatus(db, active.runId, 'recording', clock.movingMsBefore / 1000);
  useRunStore.setState({ active: { ...active, clock } });
}

function stopTracking() {
  stopWatching?.();
  stopWatching = null;
  deactivateKeepAwake(KEEP_AWAKE_TAG);
}

/** Termina la actividad en curso y devuelve su id, para abrir el resumen (RUN-05). */
export function finishRun(db: Db): string | null {
  const { active } = useRunStore.getState();
  if (!active) return null;
  const now = Date.now();
  stopTracking();
  endRun(db, active.runId, movingMs(active.clock, now) / 1000, now);
  deleteMeta(db, CLOCK_KEY);
  useRunStore.setState({ active: null });
  return active.runId;
}

/**
 * Cierra una actividad que quedó a medias porque la app se cerró (RUN-08): el tiempo cuenta
 * hasta el último punto guardado. Si ya estaba terminada, no cambia nada.
 */
export function recoverRun(db: Db, run: RunRow): void {
  if (run.endedAt !== null) return;
  const saved = parseClock(getMeta(db, CLOCK_KEY));
  const points = getRunPoints(db, run.id);
  const lastAt = points[points.length - 1]?.timestamp ?? null;
  const clock: MovingClock =
    saved && saved.runId === run.id
      ? saved
      : { segment: 0, segmentStartedAt: null, movingMsBefore: run.movingSeconds * 1000 };
  endRun(db, run.id, recoveredMovingMs(clock, lastAt) / 1000, lastAt ?? run.startedAt);
  deleteMeta(db, CLOCK_KEY);
}

/** Al descartar la actividad en curso. */
export function forgetRun(db: Db): void {
  stopTracking();
  deleteMeta(db, CLOCK_KEY);
  useRunStore.setState({ active: null });
}

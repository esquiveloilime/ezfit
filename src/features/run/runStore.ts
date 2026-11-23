import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { create } from 'zustand';

import type { Db } from '@/db/client';
import { deleteMeta, getMeta, setMeta } from '@/db/repositories/meta';
import { addRunPoint, endRun, getRunPoints, type RunRow, setRunStatus, startRun } from '@/db/repositories/runs';
import {
  filterPoint,
  type Fix,
  orderFixes,
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
  type TrackingMode,
} from '@/domain/run';
import { t } from '@/i18n';
import { defineRunLocationTask, startBackgroundLocation, stopBackgroundLocation } from '@/services/backgroundLocation';
import { watchLocation } from '@/services/location';

// Actividad de running en curso (RUN-03, RUN-04, RUN-08). Vive en memoria para la pantalla;
// cada punto aceptado se guarda de inmediato en `run_points`, y el reloj en `app_meta`, para
// poder recuperar lo registrado si la app se cierra.
//
// Con la pantalla apagada (RUN-10), las lecturas llegan por la tarea de segundo plano, que
// escribe en SQLite con la misma función que las lecturas con la app abierta; la pantalla
// solo lee el resultado.

const CLOCK_KEY = 'active_run';
const KEEP_AWAKE_TAG = 'ezfit-run';

type Active = {
  runId: string;
  kind: RunKind;
  /** `background`: sigue grabando con la pantalla apagada; `foreground`: solo con ezfit a la vista. */
  mode: TrackingMode;
  clock: MovingClock;
  points: RoutePoint[];
  distance: number;
};

type State = { active: Active | null; lastFix: Fix | null };

export const useRunStore = create<State>(() => ({ active: null, lastFix: null }));

let stopWatching: (() => void) | null = null;
/** Base de datos de la actividad en curso, para la tarea de segundo plano. */
let trackingDb: Db | null = null;

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

/** Lecturas que entrega la tarea de segundo plano. Si no hay actividad en curso, se ignoran. */
export function handleBackgroundFixes(fixes: Fix[]): void {
  const db = trackingDb;
  if (!db || useRunStore.getState().active?.mode !== 'background') return;
  for (const fix of orderFixes(fixes)) onFix(db, fix);
}

/** Se registra al cargar la app (app/_layout.tsx), como exige expo-task-manager. */
export function registerRunLocationTask(): void {
  try {
    defineRunLocationTask(handleBackgroundFixes);
  } catch (error) {
    console.warn('No se pudo registrar la tarea de ubicación', error);
  }
}

/** Con la app abierta: lectura directa del GPS y la pantalla encendida (fase A). */
async function startForeground(db: Db): Promise<void> {
  void activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => undefined);
  try {
    stopWatching?.();
    stopWatching = await watchLocation((fix) => onFix(db, fix));
  } catch (error) {
    console.warn('No se pudo leer la ubicación', error);
  }
}

/**
 * Empieza a grabar: crea la actividad y lee el GPS (RUN-03). En modo `background` lo hace un
 * servicio de Android con su notificación permanente (RUN-10); si no se puede iniciar, se
 * graba con la pantalla encendida. `seed` es la última lectura de la pantalla previa, para que
 * el mapa de la actividad empiece centrado en el usuario sin esperar la primera lectura nueva.
 */
export async function beginRun(
  db: Db,
  owner: string,
  kind: RunKind,
  seed: Fix | null = null,
  mode: TrackingMode = 'foreground',
): Promise<void> {
  if (useRunStore.getState().active) return;
  const now = Date.now();
  const runId = startRun(db, owner, kind, now);
  const clock = startClock(now);
  saveClock(db, runId, clock);
  trackingDb = db;
  useRunStore.setState({ active: { runId, kind, mode, clock, points: [], distance: 0 }, lastFix: seed });
  if (mode === 'background') {
    try {
      await startBackgroundLocation({ title: t.run.serviceTitle[kind], body: t.run.serviceBody });
      return;
    } catch (error) {
      console.warn('No se pudo iniciar la ubicación en segundo plano', error);
      const { active } = useRunStore.getState();
      if (active) useRunStore.setState({ active: { ...active, mode: 'foreground' } });
    }
  }
  await startForeground(db);
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
  trackingDb = null;
  deactivateKeepAwake(KEEP_AWAKE_TAG);
  void stopBackgroundLocation();
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
  // Por si el servicio de segundo plano siguió vivo tras cerrarse la app.
  void stopBackgroundLocation();
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

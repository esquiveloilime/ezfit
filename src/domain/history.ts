// Reglas del historial (HIS-01, HIS-02) y de las mejores marcas de running (RUN-13).
// Sin dependencias de React Native ni de la base de datos.

import type { RunKind } from './run';

// --- Filtro por mes (HIS-01) ---

/** Un mes del calendario; `month` va de 0 (enero) a 11 (diciembre). */
export type Month = { year: number; month: number };

export function monthOf(date: Date): Month {
  return { year: date.getFullYear(), month: date.getMonth() };
}

/** Inicio (incluido) y fin (excluido) del mes en la hora local del teléfono. */
export function monthRange(m: Month): { from: number; to: number } {
  return {
    from: new Date(m.year, m.month, 1).getTime(),
    to: new Date(m.year, m.month + 1, 1).getTime(),
  };
}

/** El mes `delta` meses antes (negativo) o después (positivo). */
export function shiftMonth(m: Month, delta: number): Month {
  const d = new Date(m.year, m.month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function sameMonth(a: Month, b: Month): boolean {
  return a.year === b.year && a.month === b.month;
}

// --- Lista combinada de pesas y running (HIS-01) ---

export type HistoryEntry<W, R> =
  | { type: 'workout'; id: string; startedAt: number; item: W }
  | { type: 'run'; id: string; startedAt: number; item: R };

/** Sesiones y actividades en una sola lista, de la más reciente a la más antigua. */
export function mergeHistory<W extends { id: string; startedAt: number }, R extends { id: string; startedAt: number }>(
  workouts: readonly W[],
  runs: readonly R[],
): HistoryEntry<W, R>[] {
  const entries: HistoryEntry<W, R>[] = [
    ...workouts.map((w) => ({ type: 'workout' as const, id: w.id, startedAt: w.startedAt, item: w })),
    ...runs.map((r) => ({ type: 'run' as const, id: r.id, startedAt: r.startedAt, item: r })),
  ];
  return entries.sort((a, b) => b.startedAt - a.startedAt || a.id.localeCompare(b.id));
}

// --- Mejores marcas de running (RUN-13) ---

/** Para el ritmo solo cuentan actividades de al menos 1 km. */
export const MIN_PACE_DISTANCE_METERS = 1000;

export type MarkRun = {
  id: string;
  kind: RunKind;
  startedAt: number;
  distanceMeters: number;
  movingSeconds: number;
  avgPaceSecondsPerKm: number | null;
};

export type KindMarks<R extends MarkRun> = { longest: R | null; fastest: R | null };

/**
 * Las marcas de cada tipo de actividad, por separado: la más larga y la de mejor ritmo
 * promedio (menos segundos por km). Como se calculan con las actividades que existen, al
 * eliminar la que tenía la marca pasa a la siguiente mejor. En empate gana la más antigua,
 * que fue la primera en lograrla.
 */
export function bestMarks<R extends MarkRun>(runs: readonly R[]): Record<RunKind, KindMarks<R>> {
  const result: Record<RunKind, KindMarks<R>> = {
    run: { longest: null, fastest: null },
    walk: { longest: null, fastest: null },
  };
  const ordered = [...runs].sort((a, b) => a.startedAt - b.startedAt);
  for (const run of ordered) {
    const marks = result[run.kind];
    if (run.distanceMeters > 0 && (!marks.longest || run.distanceMeters > marks.longest.distanceMeters)) {
      marks.longest = run;
    }
    const pace = run.avgPaceSecondsPerKm;
    if (pace !== null && pace > 0 && run.distanceMeters >= MIN_PACE_DISTANCE_METERS) {
      const best = marks.fastest?.avgPaceSecondsPerKm ?? null;
      if (best === null || pace < best) marks.fastest = run;
    }
  }
  return result;
}

// --- Historial por ejercicio (HIS-02) ---

export type ExerciseHistoryRow<S> = {
  workoutId: string;
  startedAt: number;
  machine: string | null;
  set: S;
};

export type ExerciseHistoryDay<S> = {
  workoutId: string;
  startedAt: number;
  machine: string | null;
  sets: S[];
};

/**
 * Series de un ejercicio agrupadas por sesión, de la más reciente a la más antigua. Si se
 * elige una máquina, solo quedan las sesiones en que se usó esa (sin importar mayúsculas).
 */
export function groupExerciseHistory<S>(
  rows: readonly ExerciseHistoryRow<S>[],
  machine: string | null = null,
): ExerciseHistoryDay<S>[] {
  const wanted = machine === null ? null : machine.trim().toLocaleLowerCase();
  const days = new Map<string, ExerciseHistoryDay<S>>();
  for (const row of rows) {
    if (wanted !== null && (row.machine ?? '').trim().toLocaleLowerCase() !== wanted) continue;
    let day = days.get(row.workoutId);
    if (!day) {
      day = { workoutId: row.workoutId, startedAt: row.startedAt, machine: row.machine, sets: [] };
      days.set(row.workoutId, day);
    }
    day.sets.push(row.set);
  }
  return [...days.values()].sort((a, b) => b.startedAt - a.startedAt);
}

/** Máquinas distintas que aparecen en el historial, de la más usada recientemente a la más antigua. */
export function historyMachines(rows: readonly { startedAt: number; machine: string | null }[]): string[] {
  const seen = new Map<string, string>();
  for (const row of [...rows].sort((a, b) => b.startedAt - a.startedAt)) {
    const clean = row.machine?.trim();
    if (!clean) continue;
    const key = clean.toLocaleLowerCase();
    if (!seen.has(key)) seen.set(key, clean);
  }
  return [...seen.values()];
}

// Reglas de la sesión de entrenamiento (SES-01 a SES-03, SES-09).
// Sin dependencias de React Native ni de la base de datos.

import { normalizeText, type TrackingType } from './exercise';

export type WeightUnit = 'kg' | 'lb';
export type SetKind = 'warmup' | 'working';

/** Una serie ya registrada, con lo necesario para mostrarla y precargar la siguiente. */
export type LoggedSet = {
  kind: SetKind;
  weight: number | null;
  unit: WeightUnit | null;
  reps: number | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
  rir: number | null;
  technique: number | null;
};

/** Qué campos pide cada serie según el tipo de registro del ejercicio (SES-03). */
export type SetFields = { weight: boolean; reps: boolean; duration: boolean; distance: boolean };

export function fieldsFor(tracking: TrackingType): SetFields {
  switch (tracking) {
    case 'weight_reps':
      return { weight: true, reps: true, duration: false, distance: false };
    case 'reps':
      return { weight: false, reps: true, duration: false, distance: false };
    case 'time':
      return { weight: false, reps: false, duration: true, distance: false };
    case 'weight_time':
      return { weight: true, reps: false, duration: true, distance: false };
    case 'distance_time':
      return { weight: false, reps: false, duration: true, distance: true };
  }
}

/** Valores de los campos de una serie mientras se escriben (texto, como llegan de la pantalla). */
export type SetInput = {
  kind: SetKind;
  weight: string;
  unit: WeightUnit;
  reps: string;
  duration: string;
  distance: string;
  /** RIR y técnica se marcan con un toque (SES-04, SES-05); no se precargan. */
  rir: number | null;
  technique: number | null;
};

const text = (n: number | null) => (n === null ? '' : String(n));

export function inputFromSet(set: LoggedSet, defaultUnit: WeightUnit): SetInput {
  return {
    kind: set.kind,
    weight: text(set.weight),
    unit: set.unit ?? defaultUnit,
    reps: text(set.reps),
    duration: text(set.durationSeconds),
    distance: text(set.distanceMeters),
    rir: set.rir,
    technique: set.technique,
  };
}

/**
 * Valores con los que empieza la serie número `index` (desde 0) de un ejercicio (SES-03):
 * 1. los de la serie equivalente (misma posición) de la última sesión;
 * 2. si no hay, los de la serie anterior de hoy;
 * 3. si tampoco, vacíos, con la unidad por defecto del usuario.
 * El tipo (calentamiento o efectiva) solo se copia de la última sesión: repetir el de la
 * serie anterior de hoy dejaría marcadas como calentamiento todas las series siguientes.
 */
export function prefillSet(input: {
  index: number;
  lastSession: readonly LoggedSet[];
  today: readonly LoggedSet[];
  defaultUnit: WeightUnit;
}): SetInput {
  const equivalent = input.lastSession[input.index];
  const fresh = { rir: null, technique: null };
  if (equivalent) return { ...inputFromSet(equivalent, input.defaultUnit), ...fresh };
  const previous = input.today[input.today.length - 1];
  if (previous) return { ...inputFromSet(previous, input.defaultUnit), ...fresh, kind: 'working' };
  return { kind: 'working', weight: '', unit: input.defaultUnit, reps: '', duration: '', distance: '', ...fresh };
}

/** RIR de 0 a 5; el 5 significa "5 o más" (SES-04). */
export const RIR_OPTIONS = [0, 1, 2, 3, 4, 5] as const;
/** Técnica de 1 a 5 (SES-05). */
export const TECHNIQUE_OPTIONS = [1, 2, 3, 4, 5] as const;

const isRir = (n: number | null): n is number => n !== null && Number.isInteger(n) && n >= 0 && n <= 5;
const isTechnique = (n: number | null): n is number => n !== null && Number.isInteger(n) && n >= 1 && n <= 5;

export const SET_LIMITS = {
  weight: 2000,
  reps: 1000,
  durationSeconds: 24 * 60 * 60,
  distanceMeters: 100000,
} as const;

export type SetError = 'weight' | 'reps' | 'duration' | 'distance';

export type SetValues = {
  kind: SetKind;
  weight: number | null;
  unit: WeightUnit | null;
  reps: number | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
  rir: number | null;
  technique: number | null;
};

export type SetResult = { ok: true; values: SetValues } | { ok: false; errors: SetError[] };

/** Número decimal escrito por el usuario; acepta coma o punto. Vacío o inválido → null. */
export function parseDecimal(value: string): number | null {
  const clean = value.trim().replace(',', '.');
  if (!/^\d+(\.\d*)?$|^\.\d+$/.test(clean)) return null;
  return Number(clean);
}

function parseWhole(value: string): number | null {
  const clean = value.trim();
  return /^\d+$/.test(clean) ? Number(clean) : null;
}

/**
 * Valida los campos de una serie según el tipo de registro. Solo se guardan los campos
 * que el ejercicio pide; el peso se guarda tal como se escribió, con su unidad (SES-03).
 */
export function validateSet(tracking: TrackingType, input: SetInput): SetResult {
  const fields = fieldsFor(tracking);
  const errors: SetError[] = [];
  const values: SetValues = {
    kind: input.kind,
    weight: null,
    unit: null,
    reps: null,
    durationSeconds: null,
    distanceMeters: null,
    rir: isRir(input.rir) ? input.rir : null,
    technique: isTechnique(input.technique) ? input.technique : null,
  };
  if (fields.weight) {
    const weight = parseDecimal(input.weight);
    if (weight === null || weight > SET_LIMITS.weight) errors.push('weight');
    else {
      values.weight = Math.round(weight * 100) / 100;
      values.unit = input.unit;
    }
  }
  if (fields.reps) {
    const reps = parseWhole(input.reps);
    if (reps === null || reps < 1 || reps > SET_LIMITS.reps) errors.push('reps');
    else values.reps = reps;
  }
  if (fields.duration) {
    const seconds = parseWhole(input.duration);
    if (seconds === null || seconds < 1 || seconds > SET_LIMITS.durationSeconds) errors.push('duration');
    else values.durationSeconds = seconds;
  }
  if (fields.distance) {
    const meters = parseDecimal(input.distance);
    if (meters === null || meters <= 0 || meters > SET_LIMITS.distanceMeters) errors.push('distance');
    else values.distanceMeters = Math.round(meters * 10) / 10;
  }
  return errors.length ? { ok: false, errors } : { ok: true, values };
}

/**
 * Botones de más y menos: suma `delta` al número escrito, sin bajar de cero.
 * Si el campo está vacío o no es un número, empieza desde cero.
 */
export function stepValue(value: string, delta: number): string {
  const current = parseDecimal(value) ?? 0;
  const next = Math.max(0, Math.round((current + delta) * 100) / 100);
  return formatNumber(next);
}

/** Número sin ceros de sobra: 135 → "135", 22.5 → "22.5", 22.50 → "22.5". */
export function formatNumber(n: number): string {
  return String(Math.round(n * 100) / 100);
}

/** Segundos en formato de reloj: 45 → "0:45", 90 → "1:30", 3725 → "1:02:05". */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

/** Hora del día en formato de 24 horas: 7:05, 18:30. */
export function formatTimeOfDay(date: Date): string {
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** Texto de una serie:"135 lb × 10", "60 kg × 0:45", "× 12", "0:45", "400 m en 1:30". */
export function formatSet(set: LoggedSet): string {
  const weight = set.weight !== null && set.unit ? `${formatNumber(set.weight)} ${set.unit}` : null;
  const effort =
    set.reps !== null
      ? String(set.reps)
      : set.durationSeconds !== null
        ? formatClock(set.durationSeconds)
        : null;
  if (set.distanceMeters !== null) {
    const distance = `${formatNumber(set.distanceMeters)} m`;
    return effort ? `${distance} · ${effort}` : distance;
  }
  if (weight && effort) return `${weight} × ${effort}`;
  if (weight) return weight;
  if (set.reps !== null) return `× ${set.reps}`;
  return effort ?? '';
}

/**
 * Resumen de la última vez (SES-03): agrupa las series seguidas con el mismo peso y unidad.
 * [135 lb × 10, 135 lb × 10, 135 lb × 8] → "135 lb × 10, 10, 8".
 * [135 lb × 10, 145 lb × 8] → "135 lb × 10 · 145 lb × 8".
 */
export function summarizeSets(sets: readonly LoggedSet[]): string {
  const groups: { head: string; efforts: string[] }[] = [];
  for (const set of sets) {
    const weight = set.weight !== null && set.unit ? `${formatNumber(set.weight)} ${set.unit}` : null;
    const effort =
      set.reps !== null ? String(set.reps) : set.durationSeconds !== null ? formatClock(set.durationSeconds) : null;
    const last = groups[groups.length - 1];
    if (weight && effort && set.distanceMeters === null) {
      if (last && last.head === weight) last.efforts.push(effort);
      else groups.push({ head: weight, efforts: [effort] });
    } else {
      groups.push({ head: formatSet(set), efforts: [] });
    }
  }
  return groups
    .map((g) => (g.efforts.length ? `${g.head} × ${g.efforts.join(', ')}` : g.head))
    .join(' · ');
}

/** Número que se muestra junto a cada serie: las efectivas se cuentan 1, 2, 3…; los calentamientos llevan `null`. */
export function setNumbers(sets: readonly { kind: SetKind }[]): (number | null)[] {
  let n = 0;
  return sets.map((s) => (s.kind === 'working' ? ++n : null));
}

// --- Ejercicios plegados durante la sesión (SES-02) ---

/** Avance de un ejercicio: series efectivas registradas contra las series objetivo de la rutina. */
export type ExerciseProgress = { done: number; target: number | null; complete: boolean };

export function exerciseProgress(
  sets: readonly { kind: SetKind }[],
  targetSets: number | null | undefined,
): ExerciseProgress {
  const done = sets.filter((s) => s.kind === 'working').length;
  const target = targetSets && targetSets > 0 ? targetSets : null;
  return { done, target, complete: target !== null && done >= target };
}

/**
 * Ejercicio que se abre al entrar a la sesión: el primero que no está completo. Sin series
 * objetivo, un ejercicio está pendiente mientras no tenga ninguna serie efectiva.
 */
export function firstPendingExercise(items: readonly ({ id: string } & ExerciseProgress)[]): string | null {
  const pending = items.find((i) => (i.target === null ? i.done === 0 : !i.complete));
  return pending?.id ?? null;
}

// --- Cierre de la sesión (SES-11) y máquina (SES-06) ---

/** Factor de conversión entre unidades (AJU-01). Solo se usa para totales, nunca al guardar. */
export const LB_PER_KG = 2.20462;

export function convertWeight(weight: number, from: WeightUnit, to: WeightUnit): number {
  if (from === to) return weight;
  return from === 'kg' ? weight * LB_PER_KG : weight / LB_PER_KG;
}

export type WorkoutSummary = {
  durationSeconds: number;
  exercises: number;
  workingSets: number;
  warmupSets: number;
  /** Suma de peso × repeticiones de todas las series, convertida a la unidad por defecto. */
  volume: number;
  unit: WeightUnit;
};

/**
 * Resumen al terminar (SES-11): duración, ejercicios con al menos una serie, series y
 * volumen total. Cada serie se convierte a la unidad por defecto antes de sumar (AJU-01).
 */
export function workoutSummary(input: {
  sets: readonly (LoggedSet & { workoutExerciseId: string })[];
  defaultUnit: WeightUnit;
  startedAt: number;
  endedAt: number;
}): WorkoutSummary {
  let volume = 0;
  for (const s of input.sets) {
    if (s.weight !== null && s.unit && s.reps !== null) {
      volume += convertWeight(s.weight, s.unit, input.defaultUnit) * s.reps;
    }
  }
  return {
    durationSeconds: Math.max(0, Math.round((input.endedAt - input.startedAt) / 1000)),
    exercises: new Set(input.sets.map((s) => s.workoutExerciseId)).size,
    workingSets: input.sets.filter((s) => s.kind === 'working').length,
    warmupSets: input.sets.filter((s) => s.kind === 'warmup').length,
    volume: Math.round(volume),
    unit: input.defaultUnit,
  };
}

/** Una sesión sin series ni cardio no se guarda (SES-11). */
export function canSaveWorkout(setCount: number, cardioCount: number): boolean {
  return setCount + cardioCount > 0;
}

/** Entero con separador de miles: 12345 → "12,345". */
export function formatThousands(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Duración legible: 45 min, 1 h 05 min. Menos de un minuto cuenta como 1 min. */
export function formatDuration(seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min`;
}

/**
 * Sugerencias de máquina mientras se escribe (SES-06): las que el usuario ya anotó en
 * ese ejercicio, de la más reciente a la más antigua, sin repetir (sin importar
 * mayúsculas ni acentos), que contengan lo escrito y no sean exactamente lo escrito.
 */
export function machineSuggestions(history: readonly string[], typed: string, limit = 5): string[] {
  const query = normalizeText(typed);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const machine of history) {
    const key = normalizeText(machine);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    if (key === query || !key.includes(query)) continue;
    result.push(machine.trim());
    if (result.length === limit) break;
  }
  return result;
}

/** Texto de la máquina listo para guardar: sin espacios de sobra; vacío → null. */
export function cleanMachine(value: string): string | null {
  const clean = value.trim().replace(/\s+/g, ' ');
  return clean ? clean.slice(0, 60) : null;
}

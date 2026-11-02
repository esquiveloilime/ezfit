// Reglas de la sesión de entrenamiento (SES-01 a SES-03, SES-09).
// Sin dependencias de React Native ni de la base de datos.

import type { TrackingType } from './exercise';

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
  if (equivalent) return inputFromSet(equivalent, input.defaultUnit);
  const previous = input.today[input.today.length - 1];
  if (previous) return { ...inputFromSet(previous, input.defaultUnit), kind: 'working' };
  return { kind: 'working', weight: '', unit: input.defaultUnit, reps: '', duration: '', distance: '' };
}

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

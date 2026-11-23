// Reglas del cardio en aparatos (CAR-01, CAR-02).
// Sin dependencias de React Native ni de la base de datos.

import { formatClock, formatNumber, parseDecimal } from './workout';

export const CARDIO_MACHINES = ['treadmill', 'elliptical', 'bike', 'stair', 'rower', 'other'] as const;
export type CardioMachine = (typeof CARDIO_MACHINES)[number];

/** Un bloque de cardio ya guardado. Distancia en metros, velocidad en km/h. */
export type CardioValues = {
  machineType: CardioMachine;
  durationSeconds: number;
  level: number | null;
  speed: number | null;
  distanceMeters: number | null;
  incline: number | null;
  notes: string | null;
};

/**
 * Campos mientras se escriben (texto, como llegan de la pantalla). La duración va en
 * minutos y segundos; la distancia en kilómetros.
 */
export type CardioInput = {
  machineType: CardioMachine | null;
  minutes: string;
  seconds: string;
  level: string;
  speed: string;
  distanceKm: string;
  incline: string;
  notes: string;
};

export const CARDIO_LIMITS = {
  durationSeconds: 24 * 60 * 60,
  level: 100,
  speed: 100,
  distanceMeters: 500_000,
  incline: 60,
  notes: 300,
} as const;

export type CardioError = 'machine' | 'duration' | 'level' | 'speed' | 'distance' | 'incline';

export type CardioResult = { ok: true; values: CardioValues } | { ok: false; errors: CardioError[] };

const text = (n: number | null) => (n === null ? '' : formatNumber(n));

export function emptyCardio(machineType: CardioMachine | null = null): CardioInput {
  return { machineType, minutes: '', seconds: '', level: '', speed: '', distanceKm: '', incline: '', notes: '' };
}

/** Campos a partir de un bloque guardado: para corregirlo o para precargar el siguiente. */
export function inputFromCardio(values: CardioValues): CardioInput {
  return {
    machineType: values.machineType,
    minutes: String(Math.floor(values.durationSeconds / 60)),
    seconds: String(values.durationSeconds % 60),
    level: text(values.level),
    speed: text(values.speed),
    distanceKm: values.distanceMeters === null ? '' : formatNumber(values.distanceMeters / 1000),
    incline: text(values.incline),
    notes: '',
  };
}

/**
 * Campos de un bloque nuevo al elegir el aparato (CAR-01): los de la última vez que se usó
 * ese aparato, sin las notas, que son de ese día. Si nunca se ha usado, vacíos.
 */
export function prefillCardio(machineType: CardioMachine, last: CardioValues | null | undefined): CardioInput {
  if (!last || last.machineType !== machineType) return emptyCardio(machineType);
  return inputFromCardio(last);
}

/** Número opcional: vacío → null; inválido o fuera de rango → error. */
function optional(value: string, max: number): { ok: boolean; value: number | null } {
  if (!value.trim()) return { ok: true, value: null };
  const n = parseDecimal(value);
  if (n === null || n > max) return { ok: false, value: null };
  return { ok: true, value: Math.round(n * 100) / 100 };
}

function whole(value: string): number | null {
  const clean = value.trim();
  if (!clean) return 0;
  return /^\d+$/.test(clean) ? Number(clean) : null;
}

/**
 * Valida un bloque de cardio (CAR-01). Hacen falta el aparato y la duración; nivel,
 * velocidad, distancia e inclinación se pueden dejar vacíos, porque no todos los aparatos
 * los muestran.
 */
export function validateCardio(input: CardioInput): CardioResult {
  const errors: CardioError[] = [];
  if (!input.machineType) errors.push('machine');

  const minutes = whole(input.minutes);
  const seconds = whole(input.seconds);
  const duration = minutes === null || seconds === null || seconds > 59 ? null : minutes * 60 + seconds;
  if (duration === null || duration < 1 || duration > CARDIO_LIMITS.durationSeconds) errors.push('duration');

  const level = optional(input.level, CARDIO_LIMITS.level);
  if (!level.ok) errors.push('level');
  const speed = optional(input.speed, CARDIO_LIMITS.speed);
  if (!speed.ok) errors.push('speed');
  const distance = optional(input.distanceKm, CARDIO_LIMITS.distanceMeters / 1000);
  if (!distance.ok) errors.push('distance');
  const incline = optional(input.incline, CARDIO_LIMITS.incline);
  if (!incline.ok) errors.push('incline');

  if (errors.length || !input.machineType || duration === null) return { ok: false, errors };
  const notes = input.notes.trim().slice(0, CARDIO_LIMITS.notes);
  return {
    ok: true,
    values: {
      machineType: input.machineType,
      durationSeconds: duration,
      level: level.value,
      speed: speed.value,
      distanceMeters: distance.value === null ? null : Math.round(distance.value * 1000),
      incline: incline.value,
      notes: notes || null,
    },
  };
}

/** Partes del resumen de un bloque: "20:00", "nivel 5", "6.5 km/h", "2.1 km", "incl. 3". */
export function cardioParts(values: Omit<CardioValues, 'notes' | 'machineType'>): {
  duration: string;
  level: string | null;
  speed: string | null;
  distanceKm: string | null;
  incline: string | null;
} {
  return {
    duration: formatClock(values.durationSeconds),
    level: values.level === null ? null : formatNumber(values.level),
    speed: values.speed === null ? null : formatNumber(values.speed),
    distanceKm: values.distanceMeters === null ? null : formatNumber(values.distanceMeters / 1000),
    incline: values.incline === null ? null : formatNumber(values.incline),
  };
}

// --- Cronómetro (CAR-02) ---

/** Cronómetro: tiempo acumulado más el tramo que está corriendo, si hay uno. */
export type Stopwatch = { accumulatedMs: number; runningSince: number | null };

export const STOPWATCH_ZERO: Stopwatch = { accumulatedMs: 0, runningSince: null };

export function stopwatchMs(watch: Stopwatch, now: number): number {
  return watch.accumulatedMs + (watch.runningSince === null ? 0 : Math.max(0, now - watch.runningSince));
}

export function startStopwatch(watch: Stopwatch, now: number): Stopwatch {
  return watch.runningSince === null ? { ...watch, runningSince: now } : watch;
}

export function pauseStopwatch(watch: Stopwatch, now: number): Stopwatch {
  return watch.runningSince === null ? watch : { accumulatedMs: stopwatchMs(watch, now), runningSince: null };
}

/** Pasa el tiempo del cronómetro a los campos de minutos y segundos. */
export function stopwatchToFields(ms: number): { minutes: string; seconds: string } {
  const total = Math.round(ms / 1000);
  return { minutes: String(Math.floor(total / 60)), seconds: String(total % 60) };
}

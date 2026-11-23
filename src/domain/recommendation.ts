// Sugerencia de peso al iniciar un ejercicio (REC-01) e incremento de peso (AJU-03).
// Sin dependencias de React Native ni de la base de datos.

import { convertWeight, type LoggedSet, type WeightUnit } from './workout';

/** Rango de repeticiones cuando el ejercicio no viene de una rutina (REC-01). */
export const DEFAULT_REP_RANGE = { min: 8, max: 12 } as const;

/** Con una mejor serie de estas repeticiones o menos, se sugiere bajar el peso (REC-01). */
export const LOW_REPS = 5;
/** Repeticiones mínimas que se buscan al bajar el peso. */
export const MIN_TARGET_REPS = 6;

/** Incremento por defecto según la unidad (REC-01). */
export const DEFAULT_INCREMENTS: Record<WeightUnit, number> = { kg: 2.5, lb: 5 };

/** Incrementos que se pueden elegir en Perfil (AJU-03). */
export const INCREMENT_OPTIONS: Record<WeightUnit, readonly number[]> = {
  kg: [1, 1.25, 2.5, 5],
  lb: [2.5, 5, 10],
};

export type RecommendationAction = 'increase' | 'decrease' | 'keep';

/** Por qué se sugiere: se muestra en una línea junto a la sugerencia. */
export type RecommendationReason =
  | 'allTop' // todas las series al máximo del rango, con reserva y buena técnica
  | 'lowTechnique' // técnica promedio de 2 o menos
  | 'tooFew' // la mejor serie fue de 5 repeticiones o menos
  | 'atSix' // la mejor serie fue de 6: mantener e intentar 7, o bajar un poco
  | 'notAllTop' // no todas llegaron al máximo
  | 'noReserve' // llegaron al máximo pero sin reserva (RIR 0)
  | 'technique'; // llegaron al máximo, pero la técnica promedio no llegó a 4

export type Recommendation = {
  action: RecommendationAction;
  reason: RecommendationReason;
  /** Peso sugerido, en la unidad de la última sesión. */
  weight: number;
  unit: WeightUnit;
  /** Repeticiones con las que se llenan los campos al tocar la sugerencia. */
  reps: number;
  /** Segunda opción, solo con una mejor serie de 6: bajar el peso un incremento. */
  alternative: { weight: number; reps: number } | null;
  /** Repeticiones de la mejor serie con el peso más alto, para explicarlo. */
  bestReps: number;
  /** Rango usado para decidir, para explicarlo. */
  range: { min: number; max: number };
  /** Técnica promedio de la última sesión, si se registró. */
  techniqueAverage: number | null;
};

/** Rango de la rutina; si falta un extremo se usa el otro, y si no hay rutina, 8 a 12. */
export function repRange(repsMin: number | null | undefined, repsMax: number | null | undefined) {
  const min = repsMin ?? repsMax ?? DEFAULT_REP_RANGE.min;
  const max = repsMax ?? repsMin ?? DEFAULT_REP_RANGE.max;
  return { min: Math.min(min, max), max: Math.max(min, max) };
}

type WeightedSet = LoggedSet & { weight: number; unit: WeightUnit; reps: number };

const isWeighted = (s: LoggedSet): s is WeightedSet =>
  s.kind === 'working' && s.weight !== null && s.unit !== null && s.reps !== null;

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Sugerencia para hoy a partir de las series efectivas de la última sesión del ejercicio
 * (REC-01). Sin series efectivas con peso y repeticiones, no hay sugerencia. El RIR y la
 * técnica solo cuentan cuando se registraron. Las reglas se revisan en el orden de la tabla
 * de la especificación.
 */
export function recommend(input: {
  lastSets: readonly LoggedSet[];
  repsMin?: number | null;
  repsMax?: number | null;
  increments?: Record<WeightUnit, number>;
}): Recommendation | null {
  const working = input.lastSets.filter(isWeighted);
  if (working.length === 0) return null;
  const range = repRange(input.repsMin, input.repsMax);
  const increments = input.increments ?? DEFAULT_INCREMENTS;

  // El peso de trabajo es el más alto de la sesión, en la unidad en que se registró.
  const top = working.reduce((best, s) =>
    convertWeight(s.weight, s.unit, best.unit) > best.weight ? s : best,
  );
  const unit = top.unit;
  const base = top.weight;
  const repsAtTop = Math.max(...working.filter((s) => s.weight === top.weight && s.unit === unit).map((s) => s.reps));

  const techniques = working.map((s) => s.technique).filter((n): n is number => n !== null);
  const techniqueAverage = techniques.length ? techniques.reduce((a, b) => a + b, 0) / techniques.length : null;

  const allTop = working.every((s) => s.reps >= range.max);
  const withReserve = working.every((s) => s.rir === null || s.rir >= 1);
  const goodTechnique = techniqueAverage === null || techniqueAverage >= 4;
  const poorTechnique = techniqueAverage !== null && techniqueAverage <= 2;

  const common = { unit, range, techniqueAverage, bestReps: repsAtTop, alternative: null };
  const step = increments[unit];
  const lighter = round2(Math.max(0, base - step));

  if (allTop && withReserve && goodTechnique) {
    return { ...common, action: 'increase', reason: 'allTop', weight: round2(base + step), reps: range.min };
  }
  if (poorTechnique) {
    return { ...common, action: 'decrease', reason: 'lowTechnique', weight: lighter, reps: Math.max(repsAtTop, MIN_TARGET_REPS) };
  }
  if (repsAtTop <= LOW_REPS) {
    return { ...common, action: 'decrease', reason: 'tooFew', weight: lighter, reps: MIN_TARGET_REPS };
  }
  if (repsAtTop === MIN_TARGET_REPS) {
    return {
      ...common,
      action: 'keep',
      reason: 'atSix',
      weight: base,
      reps: MIN_TARGET_REPS + 1,
      // Sin peso que quitar, no hay segunda opción.
      alternative: lighter > 0 ? { weight: lighter, reps: MIN_TARGET_REPS + 1 } : null,
    };
  }
  const reason: RecommendationReason = !allTop ? 'notAllTop' : !withReserve ? 'noReserve' : 'technique';
  return { ...common, action: 'keep', reason, weight: base, reps: repsAtTop + 1 };
}

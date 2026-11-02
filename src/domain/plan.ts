// Reglas del plan semanal y la incorporación (CUE-05, RUT-02, anexo A).
// Días de la semana: 0 = domingo … 6 = sábado (como Date.getDay()).

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Orden en que se muestran los días: de lunes a domingo. */
export const WEEK_ORDER: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 0];

export const MIN_TRAINING_DAYS = 2;
export const MAX_TRAINING_DAYS = 6;

export function isValidDayCount(n: number): boolean {
  return Number.isInteger(n) && n >= MIN_TRAINING_DAYS && n <= MAX_TRAINING_DAYS;
}

/** Ordena los días de lunes a domingo y quita repetidos. */
export function sortWeekdays(days: readonly Weekday[]): Weekday[] {
  return WEEK_ORDER.filter((d) => days.includes(d));
}

/** Agrega o quita un día de la selección. */
export function toggleWeekday(days: readonly Weekday[], day: Weekday): Weekday[] {
  return days.includes(day) ? days.filter((d) => d !== day) : sortWeekdays([...days, day]);
}

/**
 * Planes que se proponen a un principiante según sus días (anexo A): el que coincide y,
 * si eligió 5 o 6 días, también los de 3 y 4 como alternativa con más descanso.
 */
export function suggestedPlanDays(days: number): { recommended: number; alternatives: number[] } {
  return { recommended: days, alternatives: days >= 5 ? [3, 4] : [] };
}

/** Si eligió más días que los del plan, se quedan los primeros de la semana como propuesta inicial. */
export function adjustWeekdays(days: readonly Weekday[], count: number): Weekday[] {
  return sortWeekdays(days).slice(0, count);
}

export function parseWeekdays(json: string | null): Weekday[] | null {
  if (!json) return null;
  try {
    const value: unknown = JSON.parse(json);
    if (!Array.isArray(value)) return null;
    const days = value.filter((d): d is Weekday => Number.isInteger(d) && d >= 0 && d <= 6);
    return days.length ? sortWeekdays(days) : null;
  } catch {
    return null;
  }
}

export type PlanDayRef = { position: number; routineId: string };

export type TodayResult = { kind: 'train'; day: PlanDayRef } | { kind: 'rest' } | { kind: 'empty' };

/**
 * Qué toca hoy según el plan activo (RUT-02).
 * - Con días concretos: cada día elegido tiene su rutina, en orden; los demás son de descanso.
 * - Solo con una cantidad: toca la siguiente rutina del plan después de la última que hizo.
 */
export function todaysPlanDay(input: {
  planDays: readonly PlanDayRef[];
  weekdays: readonly Weekday[] | null;
  today: Weekday;
  lastRoutineId: string | null;
}): TodayResult {
  const days = [...input.planDays].sort((a, b) => a.position - b.position);
  if (days.length === 0) return { kind: 'empty' };

  if (input.weekdays && input.weekdays.length > 0) {
    const order = sortWeekdays(input.weekdays);
    const index = order.indexOf(input.today);
    if (index === -1) return { kind: 'rest' };
    return { kind: 'train', day: days[index % days.length]! };
  }

  if (!input.lastRoutineId) return { kind: 'train', day: days[0]! };
  // Si la rutina se repite en el plan (por ejemplo, Empuje en el de 6 días), lo que sigue es igual.
  const last = days.findIndex((d) => d.routineId === input.lastRoutineId);
  return { kind: 'train', day: days[(last + 1) % days.length]! };
}

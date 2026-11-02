// Rutinas predeterminadas y planes semanales incluidos en la app (RUT-01, anexo A).
// Los ejercicios se indican por su número del catálogo (src/db/seed/exercises.ts).
// Igual que en el catálogo: NUNCA cambies el número de una rutina o plan existente.
// Si cambias el contenido, sube TEMPLATES_VERSION para que el teléfono lo recargue.

import { catalogExerciseId } from './exercises';

export const TEMPLATES_VERSION = 2;

type Category = 'time' | 'muscle' | 'plan';

/** [número de ejercicio, series, repeticiones mínimas, máximas, descanso en segundos]. */
type Item = readonly [number, number, number | null, number | null, number];

export type TemplateRoutine = {
  n: number;
  name: string;
  description: string;
  category: Category;
  minutes: number;
  items: readonly Item[];
};

export type TemplatePlan = { n: number; name: string; days: number; routines: readonly number[] };

// Ejercicio principal: 3 series de 8 a 12. Accesorio: 3 series de 10 a 15 (anexo A).
const main = (ex: number, rest = 120): Item => [ex, 3, 8, 12, rest];
const acc = (ex: number, rest = 75): Item => [ex, 3, 10, 15, rest];
/** Ejercicio de tiempo (por ejemplo, plancha): sin rango de repeticiones. */
const timed = (ex: number, rest = 60): Item => [ex, 3, null, null, rest];

export const TEMPLATE_ROUTINES: TemplateRoutine[] = [
  // Rutinas de los planes semanales: priorizan máquinas y movimientos básicos.
  {
    n: 1,
    name: 'Cuerpo completo A',
    description: 'Todo el cuerpo con máquinas: pierna, pecho, espalda y hombro.',
    category: 'plan',
    minutes: 50,
    items: [main(51), main(6), main(12), acc(25), acc(60), timed(75)],
  },
  {
    n: 2,
    name: 'Cuerpo completo B',
    description: 'Todo el cuerpo con mancuernas, polea y máquinas.',
    category: 'plan',
    minutes: 50,
    items: [main(50), main(3), main(16), acc(27), acc(65), acc(79)],
  },
  {
    n: 3,
    name: 'Cuerpo completo C',
    description: 'Todo el cuerpo, con trabajo extra de brazos.',
    category: 'plan',
    minutes: 50,
    items: [main(53), main(4), main(17), main(59), acc(42), acc(35)],
  },
  {
    n: 4,
    name: 'Torso A',
    description: 'Pecho, espalda, hombro y brazos.',
    category: 'plan',
    minutes: 60,
    items: [main(6), main(12), main(24), main(16), acc(27), acc(42), acc(35)],
  },
  {
    n: 5,
    name: 'Pierna A',
    description: 'Cuádriceps, femoral, glúteo y pantorrilla con máquinas.',
    category: 'plan',
    minutes: 50,
    items: [main(51), main(60), acc(52), main(65), acc(70), timed(75)],
  },
  {
    n: 6,
    name: 'Torso B',
    description: 'Pecho, espalda, hombro y brazos, con otros ejercicios que el Torso A.',
    category: 'plan',
    minutes: 60,
    items: [main(3), main(17), main(25), main(13), acc(31), acc(41), acc(36)],
  },
  {
    n: 7,
    name: 'Pierna B',
    description: 'Pierna completa con sentadilla hack, peso muerto rumano y zancadas.',
    category: 'plan',
    minutes: 50,
    items: [main(53), main(59), acc(61), acc(54), acc(68), acc(71)],
  },
  {
    n: 8,
    name: 'Empuje',
    description: 'Pecho, hombro y tríceps.',
    category: 'plan',
    minutes: 50,
    items: [main(6), main(4), main(25), acc(7), acc(27), acc(42)],
  },
  {
    n: 9,
    name: 'Jalón',
    description: 'Espalda, hombro posterior y bíceps.',
    category: 'plan',
    minutes: 50,
    items: [main(12), main(16), main(17), acc(32), acc(35), acc(36)],
  },
  {
    n: 10,
    name: 'Pierna',
    description: 'Pierna completa con máquinas.',
    category: 'plan',
    minutes: 50,
    items: [main(51), main(60), acc(52), acc(65), acc(54), acc(70)],
  },

  // Por tiempo: cuerpo completo.
  {
    n: 11,
    name: 'Rutina de 30 minutos',
    description: 'Cuerpo completo con 4 ejercicios compuestos y descansos cortos.',
    category: 'time',
    minutes: 30,
    items: [main(51, 60), main(6, 60), main(12, 60), main(25, 60)],
  },
  {
    n: 12,
    name: 'Rutina de 45 minutos',
    description: 'Cuerpo completo con 6 ejercicios.',
    category: 'time',
    minutes: 45,
    items: [main(51, 90), main(6, 90), main(16, 90), acc(25, 60), acc(60, 60), acc(79, 60)],
  },
  {
    n: 13,
    name: 'Rutina de 60 minutos',
    description: 'Cuerpo completo con 8 ejercicios.',
    category: 'time',
    minutes: 60,
    items: [main(53, 90), main(3, 90), main(12, 90), main(24, 90), main(59, 90), acc(27, 60), acc(42, 60), acc(35, 60)],
  },

  // Pierna, Push y Pull (categoría `muscle`), de 30, 45 y 60 minutos (anexo A).
  // Hasta la versión 1 aquí había rutinas por músculo (números 14 a 19); se quitaron.
  {
    n: 20,
    name: 'Pierna de 30 minutos',
    description: 'Cuádriceps, femoral y glúteo con 4 ejercicios y descansos cortos.',
    category: 'muscle',
    minutes: 30,
    items: [main(51, 60), main(53, 60), main(59, 60), main(65, 60)],
  },
  {
    n: 21,
    name: 'Pierna de 45 minutos',
    description: 'Pierna completa con 6 ejercicios.',
    category: 'muscle',
    minutes: 45,
    items: [main(51, 90), main(59, 90), main(60, 90), acc(52, 60), acc(65, 60), acc(70, 60)],
  },
  {
    n: 22,
    name: 'Pierna de 60 minutos',
    description: 'Pierna completa con sentadilla, prensa y peso muerto rumano.',
    category: 'muscle',
    minutes: 60,
    items: [main(49, 150), main(51, 120), main(58, 120), main(60, 90), acc(52, 60), acc(65, 60), acc(54, 60), acc(70, 60)],
  },
  {
    n: 23,
    name: 'Push de 30 minutos',
    description: 'Pecho, hombro y tríceps con 4 ejercicios y descansos cortos.',
    category: 'muscle',
    minutes: 30,
    items: [main(6, 60), main(25, 60), main(4, 60), acc(42, 60)],
  },
  {
    n: 24,
    name: 'Push de 45 minutos',
    description: 'Pecho, hombro y tríceps con 6 ejercicios.',
    category: 'muscle',
    minutes: 45,
    items: [main(6, 90), main(4, 90), main(25, 90), acc(7, 60), acc(27, 60), acc(42, 60)],
  },
  {
    n: 25,
    name: 'Push de 60 minutos',
    description: 'Pecho, hombro y tríceps con press de banca y trabajo extra de hombro.',
    category: 'muscle',
    minutes: 60,
    items: [main(1, 120), main(4, 90), main(25, 90), acc(7, 60), acc(27, 60), acc(28, 60), acc(42, 60), acc(44, 60)],
  },
  {
    n: 26,
    name: 'Pull de 30 minutos',
    description: 'Espalda y bíceps con 4 ejercicios y descansos cortos.',
    category: 'muscle',
    minutes: 30,
    items: [main(12, 60), main(16, 60), main(17, 60), acc(35, 60)],
  },
  {
    n: 27,
    name: 'Pull de 45 minutos',
    description: 'Espalda, hombro posterior y bíceps con 6 ejercicios.',
    category: 'muscle',
    minutes: 45,
    items: [main(12, 90), main(16, 90), main(15, 90), acc(32, 60), acc(35, 60), acc(36, 60)],
  },
  {
    n: 28,
    name: 'Pull de 60 minutos',
    description: 'Espalda completa con jalones y remos, más bíceps.',
    category: 'muscle',
    minutes: 60,
    items: [main(12, 90), main(14, 120), main(16, 90), main(13, 90), acc(31, 60), acc(32, 60), acc(34, 60), acc(36, 60)],
  },
];

export const TEMPLATE_PLANS: TemplatePlan[] = [
  { n: 2, name: 'Plan de 2 días', days: 2, routines: [1, 2] },
  { n: 3, name: 'Plan de 3 días', days: 3, routines: [1, 2, 3] },
  { n: 4, name: 'Plan de 4 días', days: 4, routines: [4, 5, 6, 7] },
  { n: 5, name: 'Plan de 5 días', days: 5, routines: [4, 5, 8, 9, 7] },
  { n: 6, name: 'Plan de 6 días', days: 6, routines: [8, 9, 10, 8, 9, 10] },
];

const pad = (n: number, width: number) => String(n).padStart(width, '0');

export function templateRoutineId(n: number): string {
  return `b0000000-0000-4000-8000-${pad(n, 12)}`;
}
export function templateRoutineExerciseId(routine: number, position: number): string {
  return `b1${pad(routine, 6)}-0000-4000-8000-${pad(position, 12)}`;
}
export function templatePlanId(n: number): string {
  return `d0000000-0000-4000-8000-${pad(n, 12)}`;
}
export function templatePlanDayId(plan: number, position: number): string {
  return `d1${pad(plan, 6)}-0000-4000-8000-${pad(position, 12)}`;
}

/** Filas listas para guardar: lo comparten el teléfono y el SQL de Supabase. */
export function templateRows() {
  const routines = TEMPLATE_ROUTINES.map((r) => ({
    id: templateRoutineId(r.n),
    name: r.name,
    description: r.description,
    category: r.category,
    estimatedMinutes: r.minutes,
  }));
  const routineExercises = TEMPLATE_ROUTINES.flatMap((r) =>
    r.items.map(([ex, sets, min, max, rest], i) => ({
      id: templateRoutineExerciseId(r.n, i),
      routineId: templateRoutineId(r.n),
      exerciseId: catalogExerciseId(ex),
      position: i,
      targetSets: sets,
      repsMin: min,
      repsMax: max,
      restSeconds: rest,
    })),
  );
  const plans = TEMPLATE_PLANS.map((p) => ({ id: templatePlanId(p.n), name: p.name, daysPerWeek: p.days }));
  const planDays = TEMPLATE_PLANS.flatMap((p) =>
    p.routines.map((r, i) => ({
      id: templatePlanDayId(p.n, i),
      planId: templatePlanId(p.n),
      position: i,
      routineId: templateRoutineId(r),
      weekday: null,
    })),
  );
  return { routines, routineExercises, plans, planDays };
}

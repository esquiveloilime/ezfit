// Tipos y reglas de los ejercicios (EJE-01, EJE-02, EJE-03).
// Sin dependencias de React Native ni de la base de datos.

export const MUSCLE_GROUPS = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
  'abs',
] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const EQUIPMENT = ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'other'] as const;
export type Equipment = (typeof EQUIPMENT)[number];

/** Qué datos pide cada serie del ejercicio. */
export const TRACKING_TYPES = ['weight_reps', 'reps', 'time', 'weight_time', 'distance_time'] as const;
export type TrackingType = (typeof TRACKING_TYPES)[number];

export type ExerciseSummary = {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  isCustom: boolean;
};

export type ExerciseFilter = {
  query: string;
  muscleGroup: MuscleGroup | null;
  equipment: Equipment | null;
};

const ACCENTS: Record<string, string> = {
  á: 'a',
  é: 'e',
  í: 'i',
  ó: 'o',
  ú: 'u',
  ü: 'u',
  ñ: 'n',
  à: 'a',
  è: 'e',
  ì: 'i',
  ò: 'o',
  ù: 'u',
};

/** Minúsculas, sin acentos y sin espacios repetidos, para comparar textos. */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[áéíóúüñàèìòù]/g, (c) => ACCENTS[c] ?? c)
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Filtra ejercicios por texto, grupo muscular principal y tipo de equipo (EJE-02).
 * El texto se busca, sin importar mayúsculas ni acentos, en el nombre y en el nombre
 * del grupo muscular principal (`muscleLabels`, por ejemplo "Bíceps"): cada palabra
 * buscada debe aparecer en alguno de los dos. El resultado queda en orden alfabético.
 */
export function filterExercises<T extends ExerciseSummary>(
  exercises: T[],
  filter: ExerciseFilter,
  muscleLabels?: Record<MuscleGroup, string>,
): T[] {
  const words = normalizeText(filter.query).split(' ').filter(Boolean);
  return exercises
    .filter((e) => {
      if (filter.muscleGroup && e.muscleGroup !== filter.muscleGroup) return false;
      if (filter.equipment && e.equipment !== filter.equipment) return false;
      if (words.length === 0) return true;
      const text = normalizeText(`${e.name} ${muscleLabels?.[e.muscleGroup] ?? ''}`);
      return words.every((w) => text.includes(w));
    })
    .sort((a, b) => normalizeText(a.name).localeCompare(normalizeText(b.name)));
}

/**
 * Dirección que abre el botón "Ver tutorial" (EJE-06): el enlace propio del ejercicio
 * si lo tiene, o una búsqueda en YouTube de "cómo hacer <nombre>".
 */
export function tutorialUrl(exercise: { name: string; videoUrl: string | null }): string {
  const own = exercise.videoUrl?.trim();
  if (own) return own;
  const query = encodeURIComponent(`cómo hacer ${exercise.name}`);
  return `https://www.youtube.com/results?search_query=${query}`;
}

/** Acepta solo direcciones web http o https (enlace de video de un ejercicio propio). */
export function isValidVideoUrl(text: string): boolean {
  const value = text.trim();
  if (!/^https?:\/\/[^\s/$.?#][^\s]*$/i.test(value)) return false;
  const host = value.replace(/^https?:\/\//i, '').split(/[/?#]/)[0] ?? '';
  return host.includes('.');
}

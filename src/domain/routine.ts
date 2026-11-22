// Reglas de las rutinas (RUT-01, RUT-03, RUT-04). Sin dependencias de React Native.

export const LIMITS = {
  sets: { min: 1, max: 20 },
  reps: { min: 1, max: 100 },
  restSeconds: { min: 0, max: 900 },
  name: 60,
} as const;

/** Un ejercicio de la rutina mientras se edita. Los números llegan como texto de los campos. */
export type DraftItem = {
  /** Clave estable en pantalla. */
  key: string;
  /** Registro ya guardado que se está editando, o `null` si es nuevo. */
  routineExerciseId: string | null;
  exerciseId: string;
  targetSets: string;
  repsMin: string;
  repsMax: string;
  restSeconds: string;
};

export type RoutineDraft = { name: string; items: DraftItem[] };

export type SavedItem = {
  routineExerciseId: string | null;
  exerciseId: string;
  position: number;
  targetSets: number | null;
  repsMin: number | null;
  repsMax: number | null;
  restSeconds: number | null;
};

export type ItemError = 'sets' | 'reps' | 'reps_order' | 'rest';
export type DraftErrors = {
  name?: 'required' | 'too_long';
  items?: 'empty';
  byItem?: Record<string, ItemError[]>;
};

export type DraftResult =
  | { ok: true; name: string; items: SavedItem[] }
  | { ok: false; errors: DraftErrors };

/** Convierte un campo numérico opcional: vacío → null; no numérico → NaN. */
function parseOptionalInt(text: string): number | null {
  const value = text.trim();
  if (!value) return null;
  return /^\d+$/.test(value) ? Number(value) : NaN;
}

function inRange(n: number | null, range: { min: number; max: number }): boolean {
  return n === null || (Number.isInteger(n) && n >= range.min && n <= range.max);
}

export function validateRoutineDraft(draft: RoutineDraft): DraftResult {
  const errors: DraftErrors = {};
  const name = draft.name.trim().replace(/\s+/g, ' ');
  if (!name) errors.name = 'required';
  else if (name.length > LIMITS.name) errors.name = 'too_long';
  if (draft.items.length === 0) errors.items = 'empty';

  const byItem: Record<string, ItemError[]> = {};
  const items: SavedItem[] = draft.items.map((item, position) => {
    const targetSets = parseOptionalInt(item.targetSets);
    const repsMin = parseOptionalInt(item.repsMin);
    const repsMax = parseOptionalInt(item.repsMax);
    const restSeconds = parseOptionalInt(item.restSeconds);
    const itemErrors: ItemError[] = [];
    if (!inRange(targetSets, LIMITS.sets)) itemErrors.push('sets');
    if (!inRange(repsMin, LIMITS.reps) || !inRange(repsMax, LIMITS.reps)) itemErrors.push('reps');
    else if (repsMin !== null && repsMax !== null && repsMin > repsMax) itemErrors.push('reps_order');
    if (!inRange(restSeconds, LIMITS.restSeconds)) itemErrors.push('rest');
    if (itemErrors.length) byItem[item.key] = itemErrors;
    return {
      routineExerciseId: item.routineExerciseId,
      exerciseId: item.exerciseId,
      position,
      targetSets,
      // Si solo se escribe un extremo del rango, el rango es ese número.
      repsMin: repsMin ?? repsMax,
      repsMax: repsMax ?? repsMin,
      restSeconds,
    };
  });
  if (Object.keys(byItem).length) errors.byItem = byItem;

  if (errors.name || errors.items || errors.byItem) return { ok: false, errors };
  return { ok: true, name, items };
}

/** Mueve un elemento de la lista de `from` a `to` sin modificar la original. */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return [...list];
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item as T);
  return copy;
}

/** Texto corto del objetivo de un ejercicio: "3 × 8–12", "3 series", "8–12". */
export function formatTarget(sets: number | null, repsMin: number | null, repsMax: number | null): string {
  const reps =
    repsMin === null && repsMax === null
      ? null
      : repsMin === repsMax || repsMax === null
        ? `${repsMin}`
        : repsMin === null
          ? `${repsMax}`
          : `${repsMin}–${repsMax}`;
  if (sets !== null && reps) return `${sets} × ${reps}`;
  if (sets !== null) return `${sets} ${sets === 1 ? 'serie' : 'series'}`;
  return reps ?? '';
}

/** Descanso en texto corto: 90 → "1:30", 45 → "0:45". */
export function formatRest(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Nombre de la copia al duplicar una rutina (RUT-04). */
export function copyName(name: string, suffix: string): string {
  const full = `${name} ${suffix}`;
  return full.length <= LIMITS.name ? full : full.slice(0, LIMITS.name);
}

/** Grupos de la sección Rutinas; cada uno se muestra como una tarjeta (RUT-01). */
export const ROUTINE_SECTIONS = ['mine', 'plans', 'time', 'split'] as const;
export type RoutineSection = (typeof ROUTINE_SECTIONS)[number];

export function isRoutineSection(value: unknown): value is RoutineSection {
  return typeof value === 'string' && (ROUTINE_SECTIONS as readonly string[]).includes(value);
}

type TemplateLike = { name: string; category: string; estimatedMinutes: number | null };

/**
 * Reparte las plantillas en Por tiempo y en Pierna, Push y Pull (anexo A). Las de músculo se
 * agrupan por el prefijo de su nombre ("Push 45 min") y quedan de menor a mayor duración.
 */
export function groupTemplates<T extends TemplateLike>(templates: readonly T[], splitPrefixes: readonly string[]) {
  const byMinutes = (a: T, b: T) => (a.estimatedMinutes ?? 0) - (b.estimatedMinutes ?? 0);
  const muscle = templates.filter((r) => r.category === 'muscle');
  return {
    byTime: templates.filter((r) => r.category === 'time').sort(byMinutes),
    split: splitPrefixes.map((prefix) => ({
      prefix,
      routines: muscle.filter((r) => r.name.startsWith(`${prefix} `)).sort(byMinutes),
    })),
  };
}

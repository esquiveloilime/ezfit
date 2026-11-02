// Genera el SQL que carga el catálogo en Supabase con los mismos identificadores
// que en el teléfono (plan técnico, sección 4). Lo usa `npm run supabase:catalog`.

import { CATALOG_EXERCISES, CATALOG_VERSION, catalogExerciseId } from './exercises';
import { templateRows, TEMPLATES_VERSION } from './templates';

function quote(text: string): string {
  return `'${text.replace(/'/g, "''")}'`;
}

/** Fecha fija para que el archivo generado no cambie si el catálogo no cambia. */
const CATALOG_TIMESTAMP = 1793577600000; // 2 de noviembre de 2026

export function catalogSql(): string {
  const rows = CATALOG_EXERCISES.map((e) => {
    const usesRir = e.tracking === 'weight_reps' || e.tracking === 'reps';
    return `  (${[
      quote(catalogExerciseId(e.n)),
      'null',
      CATALOG_TIMESTAMP,
      CATALOG_TIMESTAMP,
      quote(e.name),
      quote(e.muscle),
      quote(JSON.stringify(e.secondary)),
      quote(e.equipment),
      quote(e.tracking),
      usesRir,
      true,
    ].join(', ')})`;
  });

  return `-- ezfit · Catálogo de ejercicios, versión ${CATALOG_VERSION}.
-- ARCHIVO GENERADO con \`npm run supabase:catalog\` a partir de src/db/seed/exercises.ts. No editar a mano.
-- Cómo aplicarlo: panel de Supabase → SQL Editor → New query → pegar todo → Run.
-- Se puede volver a ejecutar: actualiza los ejercicios existentes sin duplicarlos.

insert into public.exercises
  (id, user_id, created_at, updated_at, name, muscle_group, secondary_muscles, equipment, tracking_type, uses_rir, uses_technique)
values
${rows.join(',\n')}
on conflict (id) do update set
  updated_at = excluded.updated_at,
  name = excluded.name,
  muscle_group = excluded.muscle_group,
  secondary_muscles = excluded.secondary_muscles,
  equipment = excluded.equipment,
  tracking_type = excluded.tracking_type,
  uses_rir = excluded.uses_rir,
  uses_technique = excluded.uses_technique;
`;
}

function value(v: string | number | null): string {
  if (v === null) return 'null';
  return typeof v === 'number' ? String(v) : quote(v);
}

function insert(table: string, columns: string[], rows: (string | number | null)[][], updates: string[]): string {
  const values = rows.map((r) => `  (${r.map(value).join(', ')})`).join(',\n');
  const set = updates.map((c) => `  ${c} = excluded.${c}`).join(',\n');
  return `insert into public.${table}\n  (${columns.join(', ')})\nvalues\n${values}\non conflict (id) do update set\n${set};\n`;
}

/** SQL que carga las rutinas predeterminadas y los planes en Supabase (RUT-01). */
export function templatesSql(): string {
  const rows = templateRows();
  const ts = CATALOG_TIMESTAMP;
  const common = ['id', 'user_id', 'created_at', 'updated_at'];
  const head = (id: string) => [id, null, ts, ts];
  return `-- ezfit · Rutinas predeterminadas y planes semanales, versión ${TEMPLATES_VERSION}.
-- ARCHIVO GENERADO con \`npm run supabase:catalog\` a partir de src/db/seed/templates.ts. No editar a mano.
-- Cómo aplicarlo: panel de Supabase → SQL Editor → New query → pegar todo → Run.
-- Se puede volver a ejecutar: reemplaza el contenido de las plantillas sin duplicarlo.

begin;

${insert(
  'routines',
  [...common, 'name', 'description', 'category', 'estimated_minutes'],
  rows.routines.map((r) => [...head(r.id), r.name, r.description, r.category, r.estimatedMinutes]),
  ['updated_at', 'name', 'description', 'category', 'estimated_minutes'],
)}
${insert(
  'plans',
  [...common, 'name', 'days_per_week'],
  rows.plans.map((p) => [...head(p.id), p.name, p.daysPerWeek]),
  ['updated_at', 'name', 'days_per_week'],
)}
delete from public.routines where user_id is null and id not in (
${rows.routines.map((r) => `  ${quote(r.id)}`).join(',\n')}
);
delete from public.routine_exercises where user_id is null;
${insert(
  'routine_exercises',
  [...common, 'routine_id', 'exercise_id', 'position', 'target_sets', 'reps_min', 'reps_max', 'rest_seconds'],
  rows.routineExercises.map((re) => [
    ...head(re.id),
    re.routineId,
    re.exerciseId,
    re.position,
    re.targetSets,
    re.repsMin,
    re.repsMax,
    re.restSeconds,
  ]),
  ['updated_at', 'routine_id', 'exercise_id', 'position', 'target_sets', 'reps_min', 'reps_max', 'rest_seconds'],
)}
delete from public.plan_days where user_id is null;
${insert(
  'plan_days',
  [...common, 'plan_id', 'position', 'routine_id', 'weekday'],
  rows.planDays.map((pd) => [...head(pd.id), pd.planId, pd.position, pd.routineId, pd.weekday]),
  ['updated_at', 'plan_id', 'position', 'routine_id', 'weekday'],
)}
commit;
`;
}

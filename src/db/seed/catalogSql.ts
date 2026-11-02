// Genera el SQL que carga el catálogo en Supabase con los mismos identificadores
// que en el teléfono (plan técnico, sección 4). Lo usa `npm run supabase:catalog`.

import { CATALOG_EXERCISES, CATALOG_VERSION, catalogExerciseId } from './exercises';

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

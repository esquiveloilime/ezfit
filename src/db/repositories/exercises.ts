import { and, eq, isNull } from 'drizzle-orm';

import type { Equipment, ExerciseSummary, MuscleGroup, TrackingType } from '@/domain/exercise';
import type { ExerciseFormValues } from '@/domain/exerciseForm';

import type { Db } from '../client';
import { newRecord, touched } from '../records';
import { exercises } from '../schema';

export type ExerciseRow = typeof exercises.$inferSelect;

export type ExerciseDetail = ExerciseSummary & {
  archived: boolean;
  secondaryMuscles: MuscleGroup[];
  trackingType: TrackingType;
  usesRir: boolean;
  usesTechnique: boolean;
  notes: string | null;
  imageKey: string | null;
  videoUrl: string | null;
};

function parseMuscles(json: string): MuscleGroup[] {
  try {
    const value: unknown = JSON.parse(json);
    return Array.isArray(value) ? (value as MuscleGroup[]) : [];
  } catch {
    return [];
  }
}

export function toExerciseDetail(row: ExerciseRow): ExerciseDetail {
  return {
    id: row.id,
    name: row.name,
    muscleGroup: row.muscleGroup,
    equipment: row.equipment as Equipment,
    isCustom: row.userId !== null,
    archived: row.archived,
    secondaryMuscles: parseMuscles(row.secondaryMuscles),
    trackingType: row.trackingType,
    usesRir: row.usesRir,
    usesTechnique: row.usesTechnique,
    notes: row.notes,
    imageKey: row.imageKey,
    videoUrl: row.videoUrl,
  };
}

/** Consulta de los ejercicios elegibles: catálogo y propios no archivados ni borrados. */
export function activeExercisesQuery(db: Db) {
  return db
    .select()
    .from(exercises)
    .where(and(eq(exercises.archived, false), isNull(exercises.deletedAt)));
}

export function exerciseByIdQuery(db: Db, id: string) {
  return db.select().from(exercises).where(eq(exercises.id, id)).limit(1);
}

function toColumns(values: ExerciseFormValues) {
  return {
    name: values.name,
    muscleGroup: values.muscleGroup,
    equipment: values.equipment,
    trackingType: values.trackingType,
    usesRir: values.usesRir,
    usesTechnique: values.usesTechnique,
    notes: values.notes,
    videoUrl: values.videoUrl,
  };
}

/** Crea un ejercicio propio (EJE-03) y devuelve su identificador. */
export function createExercise(db: Db, owner: string, values: ExerciseFormValues): string {
  const record = newRecord(owner);
  db.insert(exercises)
    .values({ ...record, ...toColumns(values), secondaryMuscles: '[]', archived: false })
    .run();
  return record.id;
}

/** Edita un ejercicio propio. Los del catálogo no se pueden editar (EJE-04). */
export function updateExercise(db: Db, owner: string, id: string, values: ExerciseFormValues): void {
  db.update(exercises)
    .set({ ...toColumns(values), ...touched() })
    .where(and(eq(exercises.id, id), eq(exercises.userId, owner)))
    .run();
}

/** Archiva un ejercicio propio: deja de aparecer al elegir ejercicios, pero conserva su historial. */
export function archiveExercise(db: Db, owner: string, id: string): void {
  db.update(exercises)
    .set({ archived: true, ...touched() })
    .where(and(eq(exercises.id, id), eq(exercises.userId, owner)))
    .run();
}

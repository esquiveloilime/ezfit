import { and, eq, isNull } from 'drizzle-orm';

import type { Equipment, ExerciseSummary, MuscleGroup, TrackingType } from '@/domain/exercise';

import type { Db } from '../client';
import { exercises } from '../schema';

export type ExerciseRow = typeof exercises.$inferSelect;

export type ExerciseDetail = ExerciseSummary & {
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

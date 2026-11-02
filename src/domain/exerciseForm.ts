// Validación del formulario de ejercicio propio (EJE-03, EJE-04, EJE-06).

import { type Equipment, isValidVideoUrl, type MuscleGroup, type TrackingType } from './exercise';

export const MAX_EXERCISE_NAME = 80;

export type ExerciseFormInput = {
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  trackingType: TrackingType;
  usesRir: boolean;
  usesTechnique: boolean;
  notes: string;
  videoUrl: string;
};

export type ExerciseFormValues = Omit<ExerciseFormInput, 'notes' | 'videoUrl'> & {
  notes: string | null;
  videoUrl: string | null;
};

export type ExerciseFormErrors = { name?: 'required' | 'too_long'; videoUrl?: 'invalid' };

export type ExerciseFormResult =
  | { ok: true; values: ExerciseFormValues }
  | { ok: false; errors: ExerciseFormErrors };

/** El RIR solo tiene sentido cuando se cuentan repeticiones. */
export function trackingAllowsRir(tracking: TrackingType): boolean {
  return tracking === 'weight_reps' || tracking === 'reps';
}

export function validateExerciseForm(input: ExerciseFormInput): ExerciseFormResult {
  const errors: ExerciseFormErrors = {};
  const name = input.name.trim().replace(/\s+/g, ' ');
  if (!name) errors.name = 'required';
  else if (name.length > MAX_EXERCISE_NAME) errors.name = 'too_long';

  const videoUrl = input.videoUrl.trim();
  if (videoUrl && !isValidVideoUrl(videoUrl)) errors.videoUrl = 'invalid';

  if (errors.name || errors.videoUrl) return { ok: false, errors };

  const notes = input.notes.trim();
  return {
    ok: true,
    values: {
      name,
      muscleGroup: input.muscleGroup,
      equipment: input.equipment,
      trackingType: input.trackingType,
      usesRir: trackingAllowsRir(input.trackingType) && input.usesRir,
      usesTechnique: input.usesTechnique,
      notes: notes || null,
      videoUrl: videoUrl || null,
    },
  };
}

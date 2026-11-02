// Esquema de SQLite (plan técnico, sección 4). Es el mismo modelo que en Supabase,
// salvo `sync_status` y la tabla `run_points`, que solo existen en el teléfono.
// Las fechas se guardan como milisegundos desde 1970 (enteros).
// Después de cambiar este archivo: `npm run db:generate` crea la migración.


import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import type { Equipment, MuscleGroup, TrackingType } from '@/domain/exercise';

export type SyncStatus = 'synced' | 'pending';
export type WeightUnit = 'kg' | 'lb';

/** Campos que llevan todas las tablas sincronizadas. */
const common = {
  id: text('id').primaryKey(),
  /** Dueño. Vacío en catálogo y plantillas; `local` en modo sin cuenta. */
  userId: text('user_id'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  deletedAt: integer('deleted_at'),
  syncStatus: text('sync_status').$type<SyncStatus>().notNull().default('pending'),
};

export const profiles = sqliteTable('profiles', {
  ...common,
  level: text('level').$type<'beginner' | 'experienced'>(),
  weightUnit: text('weight_unit').$type<WeightUnit>().notNull().default('lb'),
  /** Días de la semana elegidos (0 = domingo … 6 = sábado), como JSON. Vacío si eligió solo una cantidad. */
  trainingWeekdays: text('training_weekdays'),
  trainingDaysCount: integer('training_days_count'),
  activePlanId: text('active_plan_id'),
  restSeconds: integer('rest_seconds').notNull().default(90),
  restAutoStart: integer('rest_auto_start', { mode: 'boolean' }).notNull().default(true),
  restSound: integer('rest_sound', { mode: 'boolean' }).notNull().default(true),
  restVibration: integer('rest_vibration', { mode: 'boolean' }).notNull().default(true),
  weightIncrementKg: real('weight_increment_kg').notNull().default(2.5),
  weightIncrementLb: real('weight_increment_lb').notNull().default(5),
  onboardingCompleted: integer('onboarding_completed', { mode: 'boolean' }).notNull().default(false),
});

export const exercises = sqliteTable(
  'exercises',
  {
    ...common,
    name: text('name').notNull(),
    muscleGroup: text('muscle_group').$type<MuscleGroup>().notNull(),
    /** Grupos secundarios, como JSON. */
    secondaryMuscles: text('secondary_muscles').notNull().default('[]'),
    equipment: text('equipment').$type<Equipment>().notNull(),
    trackingType: text('tracking_type').$type<TrackingType>().notNull(),
    usesRir: integer('uses_rir', { mode: 'boolean' }).notNull().default(true),
    usesTechnique: integer('uses_technique', { mode: 'boolean' }).notNull().default(true),
    notes: text('notes'),
    archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
    /** Clave de la foto incluida en la app (solo catálogo, EJE-05). */
    imageKey: text('image_key'),
    videoUrl: text('video_url'),
  },
  (t) => [index('exercises_user_idx').on(t.userId)],
);

export const routines = sqliteTable(
  'routines',
  {
    ...common,
    name: text('name').notNull(),
    description: text('description'),
    category: text('category').$type<'own' | 'time' | 'muscle' | 'plan'>().notNull(),
    estimatedMinutes: integer('estimated_minutes'),
  },
  (t) => [index('routines_user_idx').on(t.userId)],
);

export const routineExercises = sqliteTable(
  'routine_exercises',
  {
    ...common,
    routineId: text('routine_id').notNull(),
    exerciseId: text('exercise_id').notNull(),
    position: integer('position').notNull(),
    targetSets: integer('target_sets'),
    repsMin: integer('reps_min'),
    repsMax: integer('reps_max'),
    restSeconds: integer('rest_seconds'),
  },
  (t) => [index('routine_exercises_routine_idx').on(t.routineId)],
);

export const plans = sqliteTable('plans', {
  ...common,
  name: text('name').notNull(),
  daysPerWeek: integer('days_per_week').notNull(),
});

export const planDays = sqliteTable(
  'plan_days',
  {
    ...common,
    planId: text('plan_id').notNull(),
    position: integer('position').notNull(),
    routineId: text('routine_id').notNull(),
    /** 0 = domingo … 6 = sábado. Vacío si el plan va por cantidad de días. */
    weekday: integer('weekday'),
  },
  (t) => [index('plan_days_plan_idx').on(t.planId)],
);

export const workouts = sqliteTable(
  'workouts',
  {
    ...common,
    routineId: text('routine_id'),
    startedAt: integer('started_at').notNull(),
    endedAt: integer('ended_at'),
    status: text('status').$type<'in_progress' | 'finished'>().notNull(),
    mood: integer('mood'),
    notes: text('notes'),
  },
  (t) => [index('workouts_started_idx').on(t.startedAt)],
);

export const workoutExercises = sqliteTable(
  'workout_exercises',
  {
    ...common,
    workoutId: text('workout_id').notNull(),
    exerciseId: text('exercise_id').notNull(),
    position: integer('position').notNull(),
    machine: text('machine'),
    notes: text('notes'),
  },
  (t) => [
    index('workout_exercises_workout_idx').on(t.workoutId),
    index('workout_exercises_exercise_idx').on(t.exerciseId),
  ],
);

export const sets = sqliteTable(
  'sets',
  {
    ...common,
    workoutExerciseId: text('workout_exercise_id').notNull(),
    position: integer('position').notNull(),
    kind: text('kind').$type<'warmup' | 'working'>().notNull().default('working'),
    /** Peso tal como lo escribió el usuario, sin convertir. */
    weight: real('weight'),
    unit: text('unit').$type<WeightUnit>(),
    reps: integer('reps'),
    durationSeconds: integer('duration_seconds'),
    distanceMeters: real('distance_meters'),
    rir: integer('rir'),
    technique: integer('technique'),
    performedAt: integer('performed_at').notNull(),
  },
  (t) => [index('sets_workout_exercise_idx').on(t.workoutExerciseId)],
);

export const cardioEntries = sqliteTable(
  'cardio_entries',
  {
    ...common,
    workoutId: text('workout_id').notNull(),
    position: integer('position').notNull(),
    machineType: text('machine_type')
      .$type<'treadmill' | 'elliptical' | 'bike' | 'stair' | 'rower' | 'other'>()
      .notNull(),
    durationSeconds: integer('duration_seconds'),
    level: real('level'),
    speed: real('speed'),
    distanceMeters: real('distance_meters'),
    incline: real('incline'),
    notes: text('notes'),
  },
  (t) => [index('cardio_entries_workout_idx').on(t.workoutId)],
);

export const runs = sqliteTable(
  'runs',
  {
    ...common,
    kind: text('kind').$type<'run' | 'walk'>().notNull(),
    name: text('name'),
    startedAt: integer('started_at').notNull(),
    endedAt: integer('ended_at'),
    movingSeconds: integer('moving_seconds').notNull().default(0),
    distanceMeters: real('distance_meters').notNull().default(0),
    avgPaceSecondsPerKm: real('avg_pace_seconds_per_km'),
    /** Ruta simplificada y comprimida; es lo único de la ruta que se sincroniza. */
    route: text('route'),
    notes: text('notes'),
    status: text('status').$type<'recording' | 'paused' | 'finished'>().notNull(),
  },
  (t) => [index('runs_started_idx').on(t.startedAt)],
);

/** Puntos GPS crudos. Solo en el teléfono: no se sincronizan. */
export const runPoints = sqliteTable(
  'run_points',
  {
    id: text('id').primaryKey(),
    runId: text('run_id').notNull(),
    latitude: real('latitude').notNull(),
    longitude: real('longitude').notNull(),
    accuracy: real('accuracy'),
    recordedAt: integer('recorded_at').notNull(),
    segment: integer('segment').notNull(),
  },
  (t) => [index('run_points_run_idx').on(t.runId)],
);

/** Datos internos de la app en este teléfono (por ejemplo, la versión del catálogo cargado). */
export const appMeta = sqliteTable('app_meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

/** Tablas que viajan a Supabase, en orden de dependencia para la subida. */
export const SYNCED_TABLES = [
  'profiles',
  'exercises',
  'routines',
  'routine_exercises',
  'plans',
  'plan_days',
  'workouts',
  'workout_exercises',
  'sets',
  'cardio_entries',
  'runs',
] as const;


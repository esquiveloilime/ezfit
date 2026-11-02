import { and, desc, eq, isNull } from 'drizzle-orm';

import type { Db } from '../client';
import { newRecord, touched } from '../records';
import { profiles, type WeightUnit, workouts } from '../schema';

export type ProfileRow = typeof profiles.$inferSelect;

/** Ajustes del usuario actual (uno por cuenta, o uno en modo sin cuenta). */
export function profileQuery(db: Db, owner: string) {
  return db
    .select()
    .from(profiles)
    .where(and(eq(profiles.userId, owner), isNull(profiles.deletedAt)))
    .limit(1);
}

export type OnboardingValues = {
  level: 'beginner' | 'experienced';
  weightUnit: WeightUnit;
  trainingWeekdays: number[] | null;
  trainingDaysCount: number | null;
  activePlanId: string | null;
};

/** Guarda lo elegido en la incorporación y la marca como hecha (CUE-05). */
export function completeOnboarding(db: Db, owner: string, values: OnboardingValues): void {
  const columns = {
    level: values.level,
    weightUnit: values.weightUnit,
    trainingWeekdays: values.trainingWeekdays ? JSON.stringify(values.trainingWeekdays) : null,
    trainingDaysCount: values.trainingDaysCount,
    activePlanId: values.activePlanId,
    onboardingCompleted: true,
  };
  db.transaction((tx) => {
    const existing = tx
      .select({ id: profiles.id })
      .from(profiles)
      .where(and(eq(profiles.userId, owner), isNull(profiles.deletedAt)))
      .get();
    if (existing) {
      tx.update(profiles).set({ ...columns, ...touched() }).where(eq(profiles.id, existing.id)).run();
    } else {
      tx.insert(profiles).values({ ...newRecord(owner), ...columns }).run();
    }
  });
}

/** Cambia la unidad de peso por defecto (AJU-01). */
export function setWeightUnit(db: Db, owner: string, unit: WeightUnit): void {
  db.update(profiles)
    .set({ weightUnit: unit, ...touched() })
    .where(and(eq(profiles.userId, owner), isNull(profiles.deletedAt)))
    .run();
}

export type RestSettings = {
  restSeconds: number;
  restAutoStart: boolean;
  restSound: boolean;
  restVibration: boolean;
};

/** Cambia los ajustes de descanso (AJU-02). */
export function setRestSettings(db: Db, owner: string, values: Partial<RestSettings>): void {
  db.update(profiles)
    .set({ ...values, ...touched() })
    .where(and(eq(profiles.userId, owner), isNull(profiles.deletedAt)))
    .run();
}

/** Última sesión terminada, para saber qué rutina del plan sigue (RUT-02). */
export function lastFinishedWorkoutQuery(db: Db, owner: string) {
  return db
    .select({ routineId: workouts.routineId, endedAt: workouts.endedAt })
    .from(workouts)
    .where(and(eq(workouts.userId, owner), eq(workouts.status, 'finished'), isNull(workouts.deletedAt)))
    .orderBy(desc(workouts.endedAt))
    .limit(1);
}

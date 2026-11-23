import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { useDatabase } from '@/db/DatabaseProvider';
import type { ProfileRow } from '@/db/repositories/profile';
import { routineByIdQuery } from '@/db/repositories/routines';
import { toLoggedSet, type WorkoutRow, workoutSetsQuery } from '@/db/repositories/workouts';
import { useQuery } from '@/db/useQuery';
import { formatDuration, formatThousands, formatTimeOfDay, workoutSummary } from '@/domain/workout';
import { format, t } from '@/i18n';
import { Button, Card, colors, font } from '@/ui';

/** Nombre de la sesión: el de su rutina o "Sesión libre". */
function useWorkoutName(routineId: string | null): string {
  const { db } = useDatabase();
  const { data } = useQuery(routineByIdQuery(db, routineId ?? ''), [routineId]);
  return data[0]?.name ?? t.workout.emptyWorkoutName;
}

/** Hoy con una sesión en curso: "Entrenando" y el botón para continuarla (SES-01, SES-10). */
export function ActiveWorkoutCard({ workout }: { workout: WorkoutRow }) {
  const { db } = useDatabase();
  const name = useWorkoutName(workout.routineId);
  const { data: sets } = useQuery(workoutSetsQuery(db, workout.id), [workout.id]);
  return (
    <>
      <Text style={styles.label}>{t.today.activeTitle}</Text>
      <Card>
        <Text style={styles.title}>{name}</Text>
        <Text style={styles.body}>
          {format(t.today.activeBody, { time: formatTimeOfDay(new Date(workout.startedAt)), n: sets.length })}
        </Text>
        <Button label={t.today.continue} onPress={() => router.push('/workout')} />
      </Card>
    </>
  );
}

/** Una sesión terminada hoy, con un resumen corto; va bajo "Hoy entrenaste". */
export function DoneTodayCard({ workout, profile }: { workout: WorkoutRow; profile: ProfileRow }) {
  const { db } = useDatabase();
  const name = useWorkoutName(workout.routineId);
  const { data: sets } = useQuery(workoutSetsQuery(db, workout.id), [workout.id]);
  const summary = workoutSummary({
    sets: sets.map((s) => ({ ...toLoggedSet(s), workoutExerciseId: s.workoutExerciseId })),
    defaultUnit: profile.weightUnit,
    startedAt: workout.startedAt,
    endedAt: workout.endedAt ?? workout.startedAt,
  });
  const values = {
    duration: formatDuration(summary.durationSeconds),
    sets: summary.workingSets + summary.warmupSets,
    volume: formatThousands(summary.volume),
    unit: t.units[summary.unit],
  };

  return (
    // Al tocarla se abre su detalle (RUT-02, HIS-01).
    <Card
      accessibilityLabel={name}
      onPress={() => router.push({ pathname: '/sessions/[id]', params: { id: workout.id } })}>
      <Text style={styles.title}>{name}</Text>
      <Text style={styles.body}>
        {format(summary.volume > 0 ? t.today.doneBodyVolume : t.today.doneBody, values)}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: font.label, color: colors.textMuted, fontWeight: '600' },
  title: { fontSize: font.title, fontWeight: '700', color: colors.text },
  body: { fontSize: font.body, color: colors.textMuted },
});

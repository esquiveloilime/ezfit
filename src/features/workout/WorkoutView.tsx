import { router, Stack } from 'expo-router';
import { useMemo } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import { useDatabase } from '@/db/DatabaseProvider';
import type { ProfileRow } from '@/db/repositories/profile';
import { routineByIdQuery } from '@/db/repositories/routines';
import {
  activeWorkoutQuery,
  addWorkoutExercise,
  discardWorkout,
  lastSessions,
  moveWorkoutExercise,
  routineTargets,
  type WorkoutRow,
  type WorkoutSet,
  workoutItemsQuery,
  workoutSetsQuery,
} from '@/db/repositories/workouts';
import { useQuery } from '@/db/useQuery';
import { formatTimeOfDay } from '@/domain/workout';
import { useExercisePicker } from '@/features/exercises/pickerStore';
import { useProfile } from '@/features/onboarding/useProfile';
import { format, t } from '@/i18n';
import { Button, EmptyState, Screen, colors, font } from '@/ui';

import { ExerciseBlock } from './ExerciseBlock';

/** Pantalla de la sesión en curso (SES-01 a SES-03, SES-09, SES-10). */
export function WorkoutView() {
  const { db, owner } = useDatabase();
  const { profile } = useProfile();
  const { data, loaded } = useQuery(activeWorkoutQuery(db, owner), [owner]);
  const workout = data[0];

  if (!loaded || !profile) return <Screen>{null}</Screen>;
  if (!workout) {
    return (
      <Screen>
        <EmptyState title={t.workout.noActiveTitle} body={t.workout.noActiveBody} />
        <Button label={t.common.ok} onPress={() => router.back()} />
      </Screen>
    );
  }
  return <ActiveWorkout workout={workout} profile={profile} />;
}

function ActiveWorkout({ workout, profile }: { workout: WorkoutRow; profile: ProfileRow }) {
  const { db, owner } = useDatabase();
  const openPicker = useExercisePicker((s) => s.open);
  const { data: items } = useQuery(workoutItemsQuery(db, workout.id), [workout.id]);
  const { data: allSets } = useQuery(workoutSetsQuery(db, workout.id), [workout.id]);
  const { data: routineRows } = useQuery(routineByIdQuery(db, workout.routineId ?? ''), [workout.routineId]);

  const exerciseKey = items.map((i) => i.exerciseId).join(',');
  // Las sesiones terminadas no cambian mientras se entrena: basta con leerlas cuando cambian los ejercicios.
  const last = useMemo(
    () => lastSessions(db, owner, exerciseKey ? exerciseKey.split(',') : [], workout.id),
    [db, owner, exerciseKey, workout.id],
  );
  const targets = useMemo(() => routineTargets(db, workout.routineId), [db, workout.routineId]);

  const setsByItem = useMemo(() => {
    const map = new Map<string, WorkoutSet[]>();
    for (const s of allSets) {
      const list = map.get(s.workoutExerciseId) ?? [];
      list.push(s);
      map.set(s.workoutExerciseId, list);
    }
    return map;
  }, [allSets]);

  const title = routineRows[0]?.name ?? t.workout.emptyWorkoutName;
  const increments = { kg: profile.weightIncrementKg, lb: profile.weightIncrementLb };

  function confirmDiscard() {
    Alert.alert(t.workout.discardConfirmTitle, t.workout.discardConfirmBody, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.workout.discardConfirm,
        style: 'destructive',
        onPress: () => {
          discardWorkout(db, workout.id);
          router.dismissAll();
        },
      },
    ]);
  }

  function onAddExercise() {
    openPicker((exerciseId) => addWorkoutExercise(db, owner, workout.id, exerciseId));
    router.push('/exercises/pick');
  }

  return (
    <Screen>
      <Stack.Screen options={{ title }} />
      <Text style={styles.started}>
        {format(t.workout.startedAt, { time: formatTimeOfDay(new Date(workout.startedAt)) })}
      </Text>

      {items.length === 0 ? (
        <EmptyState title={t.workout.noExercisesTitle} body={t.workout.noExercisesBody} />
      ) : null}

      {items.map((item, index) => (
        <ExerciseBlock
          key={item.id}
          item={item}
          index={index}
          total={items.length}
          sets={setsByItem.get(item.id) ?? []}
          last={last.get(item.exerciseId)}
          target={targets.get(item.exerciseId)}
          defaultUnit={profile.weightUnit}
          increments={increments}
          onMove={(from, to) => moveWorkoutExercise(db, workout.id, from, to)}
        />
      ))}

      <Button variant="secondary" label={t.workout.addExercise} onPress={onAddExercise} />
      <Button label={t.workout.finish} onPress={() => router.push('/workout/finish')} />
      <Button variant="ghost" label={t.workout.discard} onPress={confirmDiscard} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  started: { fontSize: font.small, color: colors.textMuted },
});

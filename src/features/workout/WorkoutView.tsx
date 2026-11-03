import { router, Stack } from 'expo-router';
import { type ReactNode, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

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
import { restSecondsFor } from '@/domain/restTimer';
import { type ExerciseProgress, exerciseProgress, firstPendingExercise, formatTimeOfDay } from '@/domain/workout';
import { useExercisePicker } from '@/features/exercises/pickerStore';
import { useProfile } from '@/features/onboarding/useProfile';
import { format, t } from '@/i18n';
import { Button, EmptyState, Screen, colors, font } from '@/ui';

import { ExerciseBlock, type WorkoutItem } from './ExerciseBlock';
import { RestTimerBar } from './RestTimerBar';
import { startRest, stopRest } from './restTimer';

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
  const { data: items, loaded: itemsLoaded } = useQuery(workoutItemsQuery(db, workout.id), [workout.id]);
  const { data: allSets, loaded: setsLoaded } = useQuery(workoutSetsQuery(db, workout.id), [workout.id]);
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

  const progress = new Map<string, ExerciseProgress>(
    items.map((item) => [
      item.id,
      exerciseProgress(setsByItem.get(item.id) ?? [], targets.get(item.exerciseId)?.targetSets),
    ]),
  );

  const title = routineRows[0]?.name ?? t.workout.emptyWorkoutName;
  const increments = { kg: profile.weightIncrementKg, lb: profile.weightIncrementLb };

  function confirmDiscard() {
    Alert.alert(t.workout.discardConfirmTitle, t.workout.discardConfirmBody, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.workout.discardConfirm,
        style: 'destructive',
        onPress: () => {
          stopRest(db);
          discardWorkout(db, workout.id);
          router.dismissAll();
        },
      },
    ]);
  }

  /** Al registrar una serie arranca el descanso, si el inicio automático está activado (SES-08). */
  function onSetLogged(exerciseId: string) {
    if (!profile.restAutoStart) return;
    const seconds = restSecondsFor(targets.get(exerciseId)?.restSeconds, profile.restSeconds);
    startRest(db, workout.id, seconds, { sound: profile.restSound, vibration: profile.restVibration });
  }


  return (
    <View style={styles.fill}>
      <Screen>
        <Stack.Screen options={{ title }} />
        <Text style={styles.started}>
          {format(t.workout.startedAt, { time: formatTimeOfDay(new Date(workout.startedAt)) })}
        </Text>

        {itemsLoaded && setsLoaded ? (
          <ExerciseList
            items={items}
            progress={progress}
            render={(item, index, open, onToggle) => (
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
                onSetLogged={() => onSetLogged(item.exerciseId)}
                open={open}
                progress={progress.get(item.id) ?? exerciseProgress([], null)}
                onToggle={onToggle}
              />
            )}
            onAdd={(exerciseId) => addWorkoutExercise(db, owner, workout.id, exerciseId)}
            onPick={(onPicked) => {
              openPicker(onPicked);
              router.push('/exercises/pick');
            }}
          />
        ) : null}
        <Button label={t.workout.finish} onPress={() => router.push('/workout/finish')} />
        <Button variant="ghost" label={t.workout.discard} onPress={confirmDiscard} />
      </Screen>
      <RestTimerBar workoutId={workout.id} profile={profile} />
    </View>
  );
}

/**
 * Lista de ejercicios plegados: solo uno abierto a la vez (SES-02). Al entrar se abre el
 * primero sin completar; después solo cambia cuando el usuario toca otro o agrega uno.
 */
function ExerciseList({
  items,
  progress,
  render,
  onAdd,
  onPick,
}: {
  items: WorkoutItem[];
  progress: Map<string, ExerciseProgress>;
  render: (item: WorkoutItem, index: number, open: boolean, onToggle: () => void) => ReactNode;
  onAdd: (exerciseId: string) => string;
  onPick: (onPicked: (exerciseId: string) => void) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(() =>
    firstPendingExercise(items.map((i) => ({ id: i.id, ...(progress.get(i.id) ?? exerciseProgress([], null)) }))),
  );

  return (
    <>
      {items.length === 0 ? (
        <EmptyState title={t.workout.noExercisesTitle} body={t.workout.noExercisesBody} />
      ) : null}
      {items.map((item, index) =>
        render(item, index, openId === item.id, () => setOpenId(openId === item.id ? null : item.id)),
      )}
      <Button
        variant="secondary"
        label={t.workout.addExercise}
        onPress={() => onPick((exerciseId) => setOpenId(onAdd(exerciseId)))}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  started: { fontSize: font.small, color: colors.textMuted },
});

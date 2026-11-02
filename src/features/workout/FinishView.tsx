import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { useDatabase } from '@/db/DatabaseProvider';
import type { ProfileRow } from '@/db/repositories/profile';
import {
  activeWorkoutQuery,
  discardWorkout,
  finishWorkout,
  toLoggedSet,
  type WorkoutRow,
  workoutSetsQuery,
} from '@/db/repositories/workouts';
import { useQuery } from '@/db/useQuery';
import { canSaveWorkout, formatDuration, formatThousands, workoutSummary } from '@/domain/workout';
import { useProfile } from '@/features/onboarding/useProfile';
import { format, t } from '@/i18n';
import { Button, Card, Chip, EmptyState, Screen, TextField, colors, font, spacing } from '@/ui';

import { stopRest } from './restTimer';

/** Cierre de la sesión: resumen, estado de ánimo y nota (SES-07, SES-11). */
export function FinishView() {
  const { db, owner } = useDatabase();
  const { profile } = useProfile();
  const { data, loaded } = useQuery(activeWorkoutQuery(db, owner), [owner]);
  const workout = data[0];

  if (!loaded || !profile) return <Screen>{null}</Screen>;
  if (!workout) {
    return (
      <Screen>
        <EmptyState title={t.workout.noActiveTitle} body={t.workout.noActiveBody} />
        <Button label={t.common.ok} onPress={() => router.dismissAll()} />
      </Screen>
    );
  }
  return <Finish workout={workout} profile={profile} />;
}

function Finish({ workout, profile }: { workout: WorkoutRow; profile: ProfileRow }) {
  const { db } = useDatabase();
  const { data: sets, loaded } = useQuery(workoutSetsQuery(db, workout.id), [workout.id]);
  const [endedAt] = useState(() => Date.now());
  const [mood, setMood] = useState<number | null>(workout.mood);
  const [notes, setNotes] = useState(workout.notes ?? '');

  if (!loaded) return <Screen>{null}</Screen>;

  const summary = workoutSummary({
    sets: sets.map((s) => ({ ...toLoggedSet(s), workoutExerciseId: s.workoutExerciseId })),
    defaultUnit: profile.weightUnit,
    startedAt: workout.startedAt,
    endedAt,
  });
  // El cardio (CAR-01) todavía no se registra; cuando exista, también cuenta aquí.
  const canSave = canSaveWorkout(sets.length, 0);

  function done() {
    router.dismissAll();
    router.navigate('/');
  }

  function save() {
    try {
      stopRest(db);
      finishWorkout(db, workout.id, { mood, notes: notes.trim() || null });
      done();
    } catch (error) {
      console.error('No se pudo guardar la sesión', error);
      Alert.alert(t.finish.saveFailed);
    }
  }

  function confirmDiscard() {
    Alert.alert(t.workout.discardConfirmTitle, t.workout.discardConfirmBody, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.workout.discardConfirm,
        style: 'destructive',
        onPress: () => {
          stopRest(db);
          discardWorkout(db, workout.id);
          done();
        },
      },
    ]);
  }

  if (!canSave) {
    return (
      <Screen title={t.finish.title}>
        <EmptyState title={t.finish.emptyTitle} body={t.finish.emptyBody} />
        <Button label={t.finish.backToWorkout} onPress={() => router.back()} />
        <Button variant="ghost" label={t.workout.discard} onPress={confirmDiscard} />
      </Screen>
    );
  }

  const setsText =
    summary.warmupSets > 0
      ? format(t.finish.setsWithWarmup, { n: summary.workingSets + summary.warmupSets, w: summary.warmupSets })
      : String(summary.workingSets);

  return (
    <Screen title={t.finish.title}>
      <Card>
        <Text style={styles.cardTitle}>{t.finish.summary}</Text>
        <Row label={t.finish.duration} value={formatDuration(summary.durationSeconds)} />
        <Row label={t.finish.exercises} value={String(summary.exercises)} />
        <Row label={t.finish.sets} value={setsText} />
        <Row
          label={t.finish.volume}
          value={format(t.finish.volumeValue, { n: formatThousands(summary.volume), unit: t.units[summary.unit] })}
        />
        <Text style={styles.help}>{t.finish.volumeHelp}</Text>
      </Card>

      <View style={styles.section} accessibilityRole="radiogroup" accessibilityLabel={t.finish.mood}>
        <Text style={styles.label}>
          {t.finish.mood} <Text style={styles.help}>· {t.finish.moodOptional}</Text>
        </Text>
        <View style={styles.moods}>
          {t.finish.moods.map((label, i) => {
            const value = i + 1;
            return (
              <Chip
                key={label}
                label={label}
                selected={mood === value}
                onPress={() => setMood(mood === value ? null : value)}
              />
            );
          })}
        </View>
      </View>

      <TextField
        label={t.finish.notes}
        placeholder={t.finish.notesPlaceholder}
        value={notes}
        onChangeText={setNotes}
        multiline
        maxLength={500}
      />

      <Button label={t.finish.save} onPress={save} />
      <Button variant="secondary" label={t.finish.backToWorkout} onPress={() => router.back()} />
      <Button variant="ghost" label={t.workout.discard} onPress={confirmDiscard} />
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cardTitle: { fontSize: font.title, fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  rowLabel: { fontSize: font.body, color: colors.textMuted },
  rowValue: { fontSize: font.body, fontWeight: '700', color: colors.text, flexShrink: 1, textAlign: 'right' },
  help: { fontSize: font.small, color: colors.textMuted, fontWeight: '400' },
  section: { gap: spacing.sm },
  label: { fontSize: font.label, color: colors.text, fontWeight: '500' },
  moods: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});

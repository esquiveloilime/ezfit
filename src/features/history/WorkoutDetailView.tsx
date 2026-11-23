import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useDatabase } from '@/db/DatabaseProvider';
import { toCardioValues, workoutCardioQuery } from '@/db/repositories/cardio';
import {
  toLoggedSet,
  type WorkoutSet,
  workoutByIdQuery,
  workoutItemsQuery,
  workoutSetsQuery,
} from '@/db/repositories/workouts';
import { useQuery } from '@/db/useQuery';
import {
  formatDuration,
  formatSet,
  formatThousands,
  type LoggedSet,
  setNumbers,
  workoutSummary,
} from '@/domain/workout';
import { useProfile } from '@/features/onboarding/useProfile';
import { formatRunDate } from '@/features/run/RunStats';
import { cardioSummary } from '@/features/workout/CardioSection';
import { format, t } from '@/i18n';
import { Button, Card, EmptyState, Screen, colors, font, minTouch, radius, spacing } from '@/ui';

import { SessionActions } from './SessionActions';

/**
 * Detalle de una sesión terminada (HIS-01): resumen, ánimo, nota, cada ejercicio con su
 * máquina y sus series, y el cardio. Se abre desde Historial y desde "Hoy entrenaste".
 * Abajo, repetirla (HIS-03) y guardarla como rutina (RUT-05).
 */
export function WorkoutDetailView({ id }: { id: string }) {
  const { db } = useDatabase();
  const { profile } = useProfile();
  const workoutQuery = useQuery(workoutByIdQuery(db, id), [id]);
  const { data: items } = useQuery(workoutItemsQuery(db, id), [id]);
  const { data: sets } = useQuery(workoutSetsQuery(db, id), [id]);
  const { data: cardio } = useQuery(workoutCardioQuery(db, id), [id]);
  const workout = workoutQuery.data[0];

  if (!workoutQuery.loaded || !profile) return <Screen>{null}</Screen>;
  if (!workout) {
    return (
      <Screen>
        <EmptyState title={t.sessionDetail.notFoundTitle} body={t.sessionDetail.notFoundBody} />
        <Button label={t.common.ok} onPress={() => router.back()} />
      </Screen>
    );
  }

  const name = workout.routineName ?? t.workout.emptyWorkoutName;
  const summary = workoutSummary({
    sets: sets.map((s) => ({ ...toLoggedSet(s), workoutExerciseId: s.workoutExerciseId })),
    defaultUnit: profile.weightUnit,
    startedAt: workout.startedAt,
    endedAt: workout.endedAt ?? workout.startedAt,
  });
  const mood = workout.mood ? (t.finish.moods[workout.mood - 1] ?? null) : null;
  const setsByItem = new Map<string, WorkoutSet[]>();
  for (const s of sets) setsByItem.set(s.workoutExerciseId, [...(setsByItem.get(s.workoutExerciseId) ?? []), s]);

  return (
    <Screen title={name}>
      <Stack.Screen options={{ title: t.sessionDetail.title }} />
      <Text style={styles.date}>{formatRunDate(workout.startedAt)}</Text>

      <Card>
        <Row label={t.sessionDetail.duration} value={formatDuration(summary.durationSeconds)} />
        <Row label={t.sessionDetail.sets} value={String(summary.workingSets + summary.warmupSets)} />
        {summary.volume > 0 ? (
          <Row
            label={t.sessionDetail.volume}
            value={format(t.finish.volumeValue, { n: formatThousands(summary.volume), unit: t.units[summary.unit] })}
          />
        ) : null}
        {mood ? <Row label={t.sessionDetail.mood} value={mood} /> : null}
        {workout.notes ? (
          <View style={styles.notes}>
            <Text style={styles.rowLabel}>{t.sessionDetail.notes}</Text>
            <Text style={styles.body}>{workout.notes}</Text>
          </View>
        ) : null}
      </Card>

      {items.length > 0 ? (
        <Text style={styles.section} accessibilityRole="header">
          {t.sessionDetail.exercises}
        </Text>
      ) : null}
      {items.map((item) => {
        const exerciseName = item.name ?? t.routines.unknownExercise;
        return (
          <Card key={item.id}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={format(t.sessionDetail.seeHistory, { name: exerciseName })}
              onPress={() => router.push({ pathname: '/exercises/history/[id]', params: { id: item.exerciseId } })}
              style={({ pressed }) => [styles.exerciseHeader, pressed && styles.pressed]}>
              <Text style={styles.exerciseName}>{exerciseName}</Text>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
            </Pressable>
            {item.machine ? (
              <Text style={styles.meta}>{format(t.sessionDetail.machine, { name: item.machine })}</Text>
            ) : null}
            <SetList sets={(setsByItem.get(item.id) ?? []).map(toLoggedSet)} />
          </Card>
        );
      })}

      {cardio.length > 0 ? (
        <>
          <Text style={styles.section} accessibilityRole="header">
            {t.sessionDetail.cardio}
          </Text>
          {cardio.map((entry) => {
            const values = toCardioValues(entry);
            return (
              <Card key={entry.id}>
                <Text style={styles.body}>{cardioSummary(values)}</Text>
                {values.notes ? <Text style={styles.meta}>{values.notes}</Text> : null}
              </Card>
            );
          })}
        </>
      ) : null}

      <SessionActions
        workoutId={workout.id}
        suggestedName={
          workout.routineName ??
          format(t.sessionDetail.routineFromSessionName, {
            day: new Date(workout.startedAt).getDate(),
            month: t.monthsShort[new Date(workout.startedAt).getMonth()] ?? '',
          })
        }
        items={items.map((i) => ({ exerciseId: i.exerciseId, sets: setsByItem.get(i.id) ?? [] }))}
      />
    </Screen>
  );
}

/** Series numeradas: las efectivas 1, 2, 3…; los calentamientos con "C" y otro color. */
export function SetList({ sets }: { sets: LoggedSet[] }) {
  if (sets.length === 0) return <Text style={styles.meta}>{t.sessionDetail.noSets}</Text>;
  const numbers = setNumbers(sets);
  return (
    <View style={styles.sets}>
      {sets.map((s, i) => {
        const n = numbers[i] ?? null;
        const warmup = s.kind === 'warmup';
        const meta = [
          s.rir !== null ? format(t.workout.setMeta.rir, { n: s.rir === 5 ? t.workout.rirMax : s.rir }) : null,
          s.technique !== null ? format(t.workout.setMeta.technique, { n: s.technique }) : null,
        ]
          .filter(Boolean)
          .join(' · ');
        return (
          <View key={i} style={[styles.setRow, warmup && styles.warmupRow]}>
            <Text style={[styles.setNumber, warmup && styles.warmupNumber]}>
              {n === null ? t.workout.warmupShort : n}
            </Text>
            <Text style={[styles.setText, warmup && styles.warmupText]}>{formatSet(s)}</Text>
            {meta ? <Text style={styles.meta}>{meta}</Text> : null}
          </View>
        );
      })}
    </View>
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
  date: { fontSize: font.body, color: colors.textMuted },
  section: { fontSize: font.title, fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  rowLabel: { fontSize: font.body, color: colors.textMuted },
  rowValue: { fontSize: font.body, fontWeight: '700', color: colors.text, flexShrink: 1, textAlign: 'right' },
  notes: { gap: 2, marginTop: spacing.xs },
  body: { fontSize: font.body, color: colors.text },
  meta: { fontSize: font.small, color: colors.textMuted },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: minTouch },
  exerciseName: { flex: 1, fontSize: font.body, fontWeight: '700', color: colors.primary },
  pressed: { opacity: 0.6 },
  sets: { gap: spacing.xs },
  setRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  warmupRow: { backgroundColor: colors.warningSoft },
  setNumber: { width: 24, fontSize: font.body, fontWeight: '700', color: colors.textMuted, textAlign: 'center' },
  warmupNumber: { color: colors.warning },
  setText: { flex: 1, fontSize: font.body, color: colors.text },
  warmupText: { color: colors.textMuted },
});

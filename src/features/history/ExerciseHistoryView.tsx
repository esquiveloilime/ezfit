import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useDatabase } from '@/db/DatabaseProvider';
import { exerciseByIdQuery } from '@/db/repositories/exercises';
import { exerciseHistoryQuery, toLoggedSet } from '@/db/repositories/workouts';
import { useQuery } from '@/db/useQuery';
import { bestWeightProgress, groupExerciseHistory, historyMachines } from '@/domain/history';
import { useProfile } from '@/features/onboarding/useProfile';
import { formatRunDate } from '@/features/run/RunStats';
import { format, t } from '@/i18n';
import { Card, Chip, EmptyState, Screen, colors, font, minTouch, spacing } from '@/ui';

import { ProgressChart } from './ProgressChart';
import { SetList } from './WorkoutDetailView';

/**
 * Historial de un ejercicio (HIS-02): sus series de todas las sesiones, agrupadas por
 * fecha, con filtro por máquina. Se abre desde la ficha del ejercicio (catálogo), desde el
 * detalle de una sesión y desde la sesión en curso.
 */
export function ExerciseHistoryView({ exerciseId }: { exerciseId: string }) {
  const { db, owner } = useDatabase();
  const { data: exercise } = useQuery(exerciseByIdQuery(db, exerciseId), [exerciseId]);
  const { data: rows, loaded } = useQuery(exerciseHistoryQuery(db, owner, exerciseId), [owner, exerciseId]);
  const [machine, setMachine] = useState<string | null>(null);
  const { profile } = useProfile();
  const defaultUnit = profile?.weightUnit ?? 'lb';

  const machines = useMemo(() => historyMachines(rows), [rows]);
  const days = useMemo(
    () =>
      groupExerciseHistory(
        rows.map((r) => ({ workoutId: r.workoutId, startedAt: r.startedAt, machine: r.machine, set: toLoggedSet(r) })),
        machine,
      ),
    [rows, machine],
  );
  const name = exercise[0]?.name ?? t.routines.unknownExercise;
  // Gráfica del mejor peso por sesión (HIS-05), con el mismo filtro de máquina que la lista.
  const weighted = exercise[0]?.trackingType === 'weight_reps';
  const progress = useMemo(
    () =>
      weighted
        ? bestWeightProgress(
            days.flatMap((d) => d.sets.map((s) => ({ workoutId: d.workoutId, startedAt: d.startedAt, ...s }))),
            defaultUnit,
          )
        : [],
    [days, weighted, defaultUnit],
  );

  return (
    <Screen title={name}>
      <Stack.Screen options={{ title: t.exerciseHistory.title }} />
      {loaded && rows.length === 0 ? (
        <EmptyState title={t.exerciseHistory.emptyTitle} body={t.exerciseHistory.emptyBody} />
      ) : null}

      {machines.length > 0 ? (
        <View style={styles.filter} accessibilityRole="radiogroup" accessibilityLabel={t.exerciseHistory.filterLabel}>
          <Text style={styles.label}>{t.exerciseHistory.filterLabel}</Text>
          <View style={styles.chips}>
            <Chip label={t.exerciseHistory.allMachines} selected={machine === null} onPress={() => setMachine(null)} />
            {machines.map((m) => (
              <Chip key={m} label={m} selected={machine === m} onPress={() => setMachine(m)} />
            ))}
          </View>
        </View>
      ) : null}
      {machine !== null && days.length === 0 ? <Text style={styles.meta}>{t.exerciseHistory.emptyFilter}</Text> : null}

      <ProgressChart points={progress} unit={defaultUnit} />

      {days.map((day) => {
        const date = formatRunDate(day.startedAt);
        return (
          <Card key={day.workoutId}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={format(t.exerciseHistory.openSession, { date })}
              onPress={() => router.push({ pathname: '/sessions/[id]', params: { id: day.workoutId } })}
              style={({ pressed }) => [styles.dayHeader, pressed && styles.pressed]}>
              <View style={styles.flex}>
                <Text style={styles.date}>{date}</Text>
                {day.machine ? (
                  <Text style={styles.meta}>{format(t.exerciseHistory.machine, { name: day.machine })}</Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>
            <SetList sets={day.sets} />
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filter: { gap: spacing.xs },
  label: { fontSize: font.label, color: colors.text, fontWeight: '500' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: minTouch },
  flex: { flex: 1 },
  date: { fontSize: font.body, fontWeight: '700', color: colors.text },
  meta: { fontSize: font.small, color: colors.textMuted },
  pressed: { opacity: 0.6 },
});

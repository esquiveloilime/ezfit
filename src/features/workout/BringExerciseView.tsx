import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useDatabase } from '@/db/DatabaseProvider';
import { activeWorkoutQuery, recentWorkoutItemsQuery } from '@/db/repositories/workouts';
import { useQuery } from '@/db/useQuery';
import { useExercisePicker } from '@/features/exercises/pickerStore';
import { formatRunDate } from '@/features/run/RunStats';
import { format, t } from '@/i18n';
import { Card, EmptyState, Screen, colors, font, minTouch, spacing } from '@/ui';

/**
 * Elegir un ejercicio de una sesión pasada para traerlo a la sesión en curso (HIS-04).
 * Lo elegido se entrega a la sesión con el mismo canal que el selector de ejercicios.
 */
export function BringExerciseView() {
  const { db, owner } = useDatabase();
  const { data: active } = useQuery(activeWorkoutQuery(db, owner), [owner]);
  const currentId = active[0]?.id ?? '';
  const { data: rows, loaded } = useQuery(recentWorkoutItemsQuery(db, owner, currentId), [owner, currentId]);

  const sessions = useMemo(() => {
    const byWorkout = new Map<string, { startedAt: number; routineName: string | null; items: typeof rows }>();
    for (const row of rows) {
      const entry = byWorkout.get(row.workoutId) ?? { startedAt: row.startedAt, routineName: row.routineName, items: [] };
      entry.items.push(row);
      byWorkout.set(row.workoutId, entry);
    }
    return [...byWorkout.entries()];
  }, [rows]);

  function bring(sourceItemId: string) {
    useExercisePicker.getState().pick(sourceItemId);
    router.back();
  }

  return (
    <Screen>
      <Text style={styles.intro}>{t.workout.bringIntro}</Text>
      {loaded && sessions.length === 0 ? (
        <EmptyState title={t.workout.bringEmptyTitle} body={t.workout.bringEmptyBody} />
      ) : null}
      {sessions.map(([workoutId, session]) => {
        const date = formatRunDate(session.startedAt);
        return (
          <Card key={workoutId}>
            <Text style={styles.session}>{session.routineName ?? t.workout.emptyWorkoutName}</Text>
            <Text style={styles.date}>{date}</Text>
            {session.items.map((item) => {
              const name = item.name ?? t.routines.unknownExercise;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityLabel={format(t.workout.bringA11y, { name, date })}
                  onPress={() => bring(item.id)}
                  style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
                  <View style={styles.flex}>
                    <Text style={styles.name}>{name}</Text>
                    {item.machine ? (
                      <Text style={styles.date}>{format(t.workout.machineLine, { name: item.machine })}</Text>
                    ) : null}
                  </View>
                  <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                </Pressable>
              );
            })}
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: font.body, color: colors.textMuted },
  session: { fontSize: font.body, fontWeight: '700', color: colors.text },
  date: { fontSize: font.small, color: colors.textMuted },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: minTouch },
  flex: { flex: 1 },
  name: { fontSize: font.body, color: colors.primary, fontWeight: '600' },
  pressed: { opacity: 0.6 },
});

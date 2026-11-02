import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { useDatabase } from '@/db/DatabaseProvider';
import { activeWorkoutQuery, workoutSetsQuery } from '@/db/repositories/workouts';
import { useQuery } from '@/db/useQuery';
import { formatTimeOfDay } from '@/domain/workout';
import { format, t } from '@/i18n';
import { Button, Card, colors, font } from '@/ui';

/** Aviso en Hoy cuando hay una sesión en curso, para continuarla (SES-01, SES-10). */
export function ActiveWorkoutCard() {
  const { db, owner } = useDatabase();
  const { data } = useQuery(activeWorkoutQuery(db, owner), [owner]);
  const workout = data[0];
  if (!workout) return null;
  return <ActiveCard workoutId={workout.id} startedAt={workout.startedAt} />;
}

function ActiveCard({ workoutId, startedAt }: { workoutId: string; startedAt: number }) {
  const { db } = useDatabase();
  const { data: sets } = useQuery(workoutSetsQuery(db, workoutId), [workoutId]);
  return (
    <Card>
      <Text style={styles.title}>{t.today.activeTitle}</Text>
      <Text style={styles.body}>
        {format(t.today.activeBody, { time: formatTimeOfDay(new Date(startedAt)), n: sets.length })}
      </Text>
      <Button label={t.today.continue} onPress={() => router.push('/workout')} />
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: font.title, fontWeight: '700', color: colors.text },
  body: { fontSize: font.body, color: colors.textMuted },
});

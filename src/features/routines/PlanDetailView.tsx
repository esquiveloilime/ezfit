import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useDatabase } from '@/db/DatabaseProvider';
import { useQuery } from '@/db/useQuery';
import { planByIdQuery, planDaysQuery } from '@/db/repositories/routines';
import { format, t } from '@/i18n';
import { Card, EmptyState, Screen, colors, font, spacing } from '@/ui';

/** Detalle de un plan semanal: qué rutina toca cada día (RUT-01). */
export function PlanDetailView({ id }: { id: string }) {
  const { db } = useDatabase();
  const { data: planRows, loaded } = useQuery(planByIdQuery(db, id), [id]);
  const { data: days } = useQuery(planDaysQuery(db, id), [id]);
  const plan = planRows[0];

  if (loaded && !plan) {
    return (
      <Screen>
        <EmptyState title={t.routines.notFoundTitle} body={t.routines.notFoundBody} />
      </Screen>
    );
  }
  if (!plan) return <Screen>{null}</Screen>;

  return (
    <Screen title={plan.name}>
      <Text style={styles.meta}>{format(t.routines.planDays, { n: plan.daysPerWeek })}</Text>
      <View style={styles.list}>
        {days.map((day) => (
          <Card
            key={day.id}
            accessibilityLabel={`${format(t.routines.dayN, { n: day.position + 1 })}: ${day.routineName ?? ''}`}
            onPress={() => router.push({ pathname: '/routines/[id]', params: { id: day.routineId } })}>
            <Text style={styles.meta}>{format(t.routines.dayN, { n: day.position + 1 })}</Text>
            <Text style={styles.name}>{day.routineName ?? t.routines.unknownExercise}</Text>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  name: { fontSize: font.body, fontWeight: '600', color: colors.text },
  meta: { fontSize: font.small, color: colors.textMuted },
});

import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useDatabase } from '@/db/DatabaseProvider';
import {
  ownRoutinesQuery,
  type RoutineRow,
  routineExerciseCountsQuery,
  templatePlansQuery,
  templateRoutinesQuery,
} from '@/db/repositories/routines';
import { format, t } from '@/i18n';
import { Button, Card, Screen, colors, font, spacing } from '@/ui';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

function RoutineCard({ routine, exerciseCount }: { routine: RoutineRow; exerciseCount: number }) {
  const meta = [format(t.routines.exerciseCount, { n: exerciseCount })];
  if (routine.estimatedMinutes) meta.push(format(t.routines.minutes, { n: routine.estimatedMinutes }));
  return (
    <Card
      accessibilityLabel={routine.name}
      onPress={() => router.push({ pathname: '/routines/[id]', params: { id: routine.id } })}>
      <Text style={styles.cardTitle}>{routine.name}</Text>
      {routine.description ? <Text style={styles.cardBody}>{routine.description}</Text> : null}
      <Text style={styles.meta}>{meta.join(' · ')}</Text>
    </Card>
  );
}

/** Pestaña Rutinas: propias, predeterminadas, planes y catálogo (RUT-01, RUT-03). */
export function RoutinesHome() {
  const { db, owner } = useDatabase();
  const { data: own } = useLiveQuery(ownRoutinesQuery(db, owner), [owner]);
  const { data: templates } = useLiveQuery(templateRoutinesQuery(db));
  const { data: plans } = useLiveQuery(templatePlansQuery(db));
  const { data: counts } = useLiveQuery(routineExerciseCountsQuery(db));

  const countOf = useMemo(() => {
    const map = new Map((counts ?? []).map((c) => [c.routineId, c.n]));
    return (id: string) => map.get(id) ?? 0;
  }, [counts]);

  const byTime = (templates ?? []).filter((r) => r.category === 'time');
  const byMuscle = (templates ?? []).filter((r) => r.category === 'muscle');

  return (
    <Screen title={t.tabs.routines}>
      <Button label={t.routines.createButton} onPress={() => router.push('/routines/edit')} />

      <Section title={t.routines.mine}>
        {own && own.length === 0 ? <Text style={styles.cardBody}>{t.routines.mineEmpty}</Text> : null}
        {(own ?? []).map((r) => (
          <RoutineCard key={r.id} routine={r} exerciseCount={countOf(r.id)} />
        ))}
      </Section>

      <Section title={t.routines.plans}>
        {(plans ?? []).map((p) => (
          <Card
            key={p.id}
            accessibilityLabel={p.name}
            onPress={() => router.push({ pathname: '/plans/[id]', params: { id: p.id } })}>
            <Text style={styles.cardTitle}>{p.name}</Text>
            <Text style={styles.meta}>{format(t.routines.planDays, { n: p.daysPerWeek })}</Text>
          </Card>
        ))}
      </Section>

      <Section title={t.routines.byTime}>
        {byTime.map((r) => (
          <RoutineCard key={r.id} routine={r} exerciseCount={countOf(r.id)} />
        ))}
      </Section>

      <Section title={t.routines.byMuscle}>
        {byMuscle.map((r) => (
          <RoutineCard key={r.id} routine={r} exerciseCount={countOf(r.id)} />
        ))}
      </Section>

      <Section title={t.exercises.catalogTitle}>
        <Card accessibilityLabel={t.exercises.catalogTitle} onPress={() => router.push('/exercises')}>
          <Text style={styles.cardBody}>{t.exercises.catalogEntry}</Text>
        </Card>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: font.title, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  cardTitle: { fontSize: font.body, fontWeight: '600', color: colors.text },
  cardBody: { fontSize: font.body, color: colors.textMuted },
  meta: { fontSize: font.small, color: colors.textMuted },
});

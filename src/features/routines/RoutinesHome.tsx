import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useDatabase } from '@/db/DatabaseProvider';
import { useQuery } from '@/db/useQuery';
import {
  ownRoutinesQuery,
  type RoutineRow,
  routineExerciseCountsQuery,
  templatePlansQuery,
  templateRoutinesQuery,
} from '@/db/repositories/routines';
import { format, t } from '@/i18n';
import { Button, Card, Chip, Screen, colors, font, spacing } from '@/ui';

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
  const { data: own, loaded: ownLoaded } = useQuery(ownRoutinesQuery(db, owner), [owner]);
  const { data: templates } = useQuery(templateRoutinesQuery(db));
  const { data: plans } = useQuery(templatePlansQuery(db));
  const { data: counts } = useQuery(routineExerciseCountsQuery(db));

  const countOf = useMemo(() => {
    const map = new Map(counts.map((c) => [c.routineId, c.n]));
    return (id: string) => map.get(id) ?? 0;
  }, [counts]);

  const byTime = templates.filter((r) => r.category === 'time');
  const split = templates.filter((r) => r.category === 'muscle');
  // Pierna, Push y Pull: una tarjeta por tipo, con sus duraciones de menor a mayor (anexo A).
  const splitGroups = t.routines.splitGroups.map((g) => ({
    ...g,
    routines: split
      .filter((r) => r.name.startsWith(`${g.prefix} `))
      .sort((a, b) => (a.estimatedMinutes ?? 0) - (b.estimatedMinutes ?? 0)),
  }));

  return (
    <Screen title={t.tabs.routines}>
      <Button label={t.routines.createButton} onPress={() => router.push('/routines/edit')} />

      <Section title={t.routines.mine}>
        {ownLoaded && own.length === 0 ? <Text style={styles.cardBody}>{t.routines.mineEmpty}</Text> : null}
        {own.map((r) => (
          <RoutineCard key={r.id} routine={r} exerciseCount={countOf(r.id)} />
        ))}
      </Section>

      <Section title={t.routines.plans}>
        {plans.map((p) => (
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

      <Section title={t.routines.split}>
        {splitGroups.map((g) => (
          <Card key={g.prefix}>
            <Text style={styles.cardTitle}>{g.title}</Text>
            <Text style={styles.cardBody}>{g.body}</Text>
            <View style={styles.durations}>
              {g.routines.map((r) => (
                <Chip
                  key={r.id}
                  label={format(t.routines.durationButton, { n: r.estimatedMinutes ?? 0 })}
                  selected={false}
                  onPress={() => router.push({ pathname: '/routines/[id]', params: { id: r.id } })}
                />
              ))}
            </View>
          </Card>
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
  durations: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
});

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
import { useQuery } from '@/db/useQuery';
import { groupTemplates, type RoutineSection } from '@/domain/routine';
import { format, t } from '@/i18n';
import { Button, Card, Chip, Screen, colors, font, spacing } from '@/ui';

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

function useExerciseCounts() {
  const { db } = useDatabase();
  const { data: counts } = useQuery(routineExerciseCountsQuery(db));
  return useMemo(() => {
    const map = new Map(counts.map((c) => [c.routineId, c.n]));
    return (id: string) => map.get(id) ?? 0;
  }, [counts]);
}

function MineList() {
  const { db, owner } = useDatabase();
  const { data: own, loaded } = useQuery(ownRoutinesQuery(db, owner), [owner]);
  const countOf = useExerciseCounts();
  return (
    <>
      <Button label={t.routines.createButton} onPress={() => router.push('/routines/edit')} />
      {loaded && own.length === 0 ? <Text style={styles.cardBody}>{t.routines.mineEmpty}</Text> : null}
      {own.map((r) => (
        <RoutineCard key={r.id} routine={r} exerciseCount={countOf(r.id)} />
      ))}
    </>
  );
}

function PlanList() {
  const { db } = useDatabase();
  const { data: plans } = useQuery(templatePlansQuery(db));
  return (
    <>
      {plans.map((p) => (
        <Card
          key={p.id}
          accessibilityLabel={p.name}
          onPress={() => router.push({ pathname: '/plans/[id]', params: { id: p.id } })}>
          <Text style={styles.cardTitle}>{p.name}</Text>
          <Text style={styles.meta}>{format(t.routines.planDays, { n: p.daysPerWeek })}</Text>
        </Card>
      ))}
    </>
  );
}

function TemplateList({ kind }: { kind: 'time' | 'split' }) {
  const { db } = useDatabase();
  const { data: templates } = useQuery(templateRoutinesQuery(db));
  const countOf = useExerciseCounts();
  const groups = groupTemplates(
    templates,
    t.routines.splitGroups.map((g) => g.prefix),
  );

  if (kind === 'time') {
    return (
      <>
        {groups.byTime.map((r) => (
          <RoutineCard key={r.id} routine={r} exerciseCount={countOf(r.id)} />
        ))}
      </>
    );
  }

  // Pierna, Push y Pull: una tarjeta por tipo, con sus duraciones de menor a mayor (anexo A).
  return (
    <>
      {t.routines.splitGroups.map((g, i) => (
        <Card key={g.prefix}>
          <Text style={styles.cardTitle}>{g.title}</Text>
          <Text style={styles.cardBody}>{g.body}</Text>
          <View style={styles.durations}>
            {(groups.split[i]?.routines ?? []).map((r) => (
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
    </>
  );
}

/** Lista de un grupo de la sección Rutinas, al tocar su tarjeta (RUT-01). */
export function RoutineSectionView({ section }: { section: RoutineSection }) {
  return (
    <Screen>
      <Text style={styles.cardBody}>{t.routines.sections[section].body}</Text>
      {section === 'mine' ? <MineList /> : null}
      {section === 'plans' ? <PlanList /> : null}
      {section === 'time' || section === 'split' ? <TemplateList kind={section} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardTitle: { fontSize: font.body, fontWeight: '600', color: colors.text },
  cardBody: { fontSize: font.body, color: colors.textMuted },
  meta: { fontSize: font.small, color: colors.textMuted },
  durations: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
});

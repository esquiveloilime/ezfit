import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useDatabase } from '@/db/DatabaseProvider';
import { activeExercisesQuery } from '@/db/repositories/exercises';
import { ownRoutinesQuery, templatePlansQuery, templateRoutinesQuery } from '@/db/repositories/routines';
import { useQuery } from '@/db/useQuery';
import { groupTemplates, ROUTINE_SECTIONS, type RoutineSection } from '@/domain/routine';
import { format, t } from '@/i18n';
import { Button, Card, Screen, colors, font, spacing } from '@/ui';

type IconName = ComponentProps<typeof Ionicons>['name'];

const ICONS: Record<RoutineSection | 'catalog', IconName> = {
  mine: 'person-outline',
  plans: 'calendar-outline',
  time: 'timer-outline',
  split: 'barbell-outline',
  catalog: 'list-outline',
};

type GroupCardProps = { icon: IconName; title: string; body: string; count: string; onPress: () => void };

function GroupCard({ icon, title, body, count, onPress }: GroupCardProps) {
  return (
    <Card accessibilityLabel={`${title}, ${count}`} onPress={onPress}>
      <View style={styles.row}>
        <Ionicons name={icon} size={28} color={colors.primary} />
        <View style={styles.texts}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
          <Text style={styles.meta}>{count}</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
      </View>
    </Card>
  );
}

/**
 * Sección Rutinas: cada grupo (propias, planes, por tiempo, Pierna Push y Pull) y el catálogo
 * van en su tarjeta; al tocarla se abre su lista (RUT-01, RUT-03).
 */
export function RoutinesHome() {
  const { db, owner } = useDatabase();
  const { data: own } = useQuery(ownRoutinesQuery(db, owner), [owner]);
  const { data: templates } = useQuery(templateRoutinesQuery(db));
  const { data: plans } = useQuery(templatePlansQuery(db));
  const { data: exercises } = useQuery(activeExercisesQuery(db));

  const groups = groupTemplates(
    templates,
    t.routines.splitGroups.map((g) => g.prefix),
  );
  const counts: Record<RoutineSection, string> = {
    mine: format(t.routines.routineCount, { n: own.length }),
    plans: format(t.routines.planCount, { n: plans.length }),
    time: format(t.routines.routineCount, { n: groups.byTime.length }),
    split: format(t.routines.routineCount, { n: groups.split.reduce((n, g) => n + g.routines.length, 0) }),
  };

  return (
    <Screen title={t.tabs.routines}>
      <Button label={t.routines.createButton} onPress={() => router.push('/routines/edit')} />
      {ROUTINE_SECTIONS.map((section) => (
        <GroupCard
          key={section}
          icon={ICONS[section]}
          title={t.routines.sections[section].title}
          body={t.routines.sections[section].body}
          count={counts[section]}
          onPress={() => router.push({ pathname: '/routines/section/[section]', params: { section } })}
        />
      ))}
      <GroupCard
        icon={ICONS.catalog}
        title={t.exercises.catalogTitle}
        body={t.exercises.catalogEntry}
        count={format(t.routines.exerciseTotal, { n: exercises.length })}
        onPress={() => router.push('/exercises')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  texts: { flex: 1, gap: 2 },
  title: { fontSize: font.body, fontWeight: '700', color: colors.text },
  body: { fontSize: font.small, color: colors.textMuted },
  meta: { fontSize: font.small, color: colors.primary, fontWeight: '600' },
});

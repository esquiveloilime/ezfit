import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useDatabase } from '@/db/DatabaseProvider';
import { activeExercisesQuery, toExerciseDetail } from '@/db/repositories/exercises';
import {
  EQUIPMENT,
  type Equipment,
  filterExercises,
  MUSCLE_GROUPS,
  type MuscleGroup,
} from '@/domain/exercise';
import { format, t } from '@/i18n';
import { Button, Card, Chip, EmptyState, TextField, colors, font, spacing } from '@/ui';

import { ExerciseThumb } from './ExerciseThumb';
import { useExercisePicker } from './pickerStore';

type Props = {
  /** `pick`: selector de ejercicios; al tocar uno se elige y se vuelve atrás. */
  mode?: 'browse' | 'pick';
};

/** Catálogo con búsqueda y filtros por músculo y equipo (EJE-01, EJE-02). */
export function ExerciseCatalog({ mode = 'browse' }: Props) {
  const { db } = useDatabase();
  const pick = useExercisePicker((s) => s.pick);
  const { data } = useLiveQuery(activeExercisesQuery(db));
  const [query, setQuery] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);

  const all = useMemo(() => (data ?? []).map(toExerciseDetail), [data]);
  const results = useMemo(
    () => filterExercises(all, { query, muscleGroup, equipment }, t.exercises.muscleGroups),
    [all, query, muscleGroup, equipment],
  );

  function onPressExercise(id: string) {
    if (mode === 'pick') {
      pick(id);
      router.back();
    } else {
      router.push({ pathname: '/exercises/[id]', params: { id } });
    }
  }

  const header = (
    <View style={styles.header}>
      <Button
        variant="secondary"
        label={t.exercises.createButton}
        onPress={() =>
          router.push(
            mode === 'pick' ? { pathname: '/exercises/new', params: { pick: '1' } } : '/exercises/new',
          )
        }
      />
      <TextField
        label={t.exercises.searchLabel}
        placeholder={t.exercises.searchPlaceholder}
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      <Text style={styles.filterLabel}>{t.exercises.muscleFilter}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label={t.common.all} selected={muscleGroup === null} onPress={() => setMuscleGroup(null)} />
        {MUSCLE_GROUPS.map((m) => (
          <Chip
            key={m}
            label={t.exercises.muscleGroups[m]}
            selected={muscleGroup === m}
            onPress={() => setMuscleGroup(muscleGroup === m ? null : m)}
          />
        ))}
      </ScrollView>
      <Text style={styles.filterLabel}>{t.exercises.equipmentFilter}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label={t.common.all} selected={equipment === null} onPress={() => setEquipment(null)} />
        {EQUIPMENT.map((e) => (
          <Chip
            key={e}
            label={t.exercises.equipment[e]}
            selected={equipment === e}
            onPress={() => setEquipment(equipment === e ? null : e)}
          />
        ))}
      </ScrollView>
      <Text style={styles.count}>{format(t.exercises.resultsCount, { n: results.length })}</Text>
    </View>
  );

  return (
    <FlatList
      data={results}
      keyExtractor={(e) => e.id}
      ListHeaderComponent={header}
      ListEmptyComponent={
        data ? <EmptyState title={t.exercises.emptyTitle} body={t.exercises.emptyBody} /> : null
      }
      contentContainerStyle={styles.list}
      keyboardShouldPersistTaps="handled"
      renderItem={({ item }) => (
        <Card
          accessibilityLabel={item.name}
          onPress={() => onPressExercise(item.id)}>
          <View style={styles.row}>
            <ExerciseThumb imageKey={item.imageKey} size={48} />
            <View style={styles.rowText}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>
                {t.exercises.muscleGroups[item.muscleGroup]} · {t.exercises.equipment[item.equipment]}
                {item.isCustom ? ` · ${t.exercises.custom}` : ''}
              </Text>
            </View>
          </View>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.sm, backgroundColor: colors.background },
  header: { gap: spacing.sm, marginBottom: spacing.sm },
  filterLabel: { fontSize: font.label, color: colors.text, fontWeight: '500', marginTop: spacing.xs },
  chips: { gap: spacing.sm, paddingRight: spacing.lg },
  count: { fontSize: font.small, color: colors.textMuted, marginTop: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowText: { flex: 1, gap: 2 },
  name: { fontSize: font.body, fontWeight: '600', color: colors.text },
  meta: { fontSize: font.small, color: colors.textMuted },
});

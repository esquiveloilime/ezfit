import { router } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { useDatabase } from '@/db/DatabaseProvider';
import { useQuery } from '@/db/useQuery';
import {
  deleteRoutine,
  duplicateRoutine,
  routineByIdQuery,
  routineItemsQuery,
} from '@/db/repositories/routines';
import { copyName, formatRest, formatTarget } from '@/domain/routine';
import { format, t } from '@/i18n';
import { Button, Card, EmptyState, Screen, colors, font, spacing } from '@/ui';

/** Detalle de una rutina propia o predeterminada (RUT-01, RUT-04). */
export function RoutineDetailView({ id }: { id: string }) {
  const { db, owner } = useDatabase();
  const { data: routineRows, loaded } = useQuery(routineByIdQuery(db, id), [id]);
  const { data: items } = useQuery(routineItemsQuery(db, id), [id]);
  const routine = routineRows[0];

  if (loaded && (!routine || routine.deletedAt !== null)) {
    return (
      <Screen>
        <EmptyState title={t.routines.notFoundTitle} body={t.routines.notFoundBody} />
      </Screen>
    );
  }
  if (!routine) return <Screen>{null}</Screen>;

  const isTemplate = routine.userId === null;

  function duplicate() {
    if (!routine) return;
    const copyId = duplicateRoutine(db, owner, routine.id, copyName(routine.name, t.routines.copySuffix));
    // Se muestra la copia y se abre su editor; al guardar se vuelve al detalle de la copia.
    router.replace({ pathname: '/routines/[id]', params: { id: copyId } });
    router.push({ pathname: '/routines/edit', params: { id: copyId } });
  }

  function confirmDelete() {
    Alert.alert(t.routines.deleteConfirmTitle, t.routines.deleteConfirmBody, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.routines.delete,
        style: 'destructive',
        onPress: () => {
          deleteRoutine(db, owner, id);
          router.back();
        },
      },
    ]);
  }

  return (
    <Screen title={routine.name}>
      {routine.description ? <Text style={styles.description}>{routine.description}</Text> : null}
      {isTemplate ? <Text style={styles.note}>{t.routines.template}</Text> : null}

      <View style={styles.list}>
        {items.map((item, index) => {
          const target = formatTarget(item.targetSets, item.repsMin, item.repsMax);
          const rest = item.restSeconds !== null ? format(t.routines.rest, { time: formatRest(item.restSeconds) }) : null;
          return (
            <Card
              key={item.id}
              accessibilityLabel={item.name ?? t.routines.unknownExercise}
              onPress={() => router.push({ pathname: '/exercises/[id]', params: { id: item.exerciseId } })}>
              <Text style={styles.itemName}>
                {index + 1}. {item.name ?? t.routines.unknownExercise}
              </Text>
              <Text style={styles.meta}>{[target, rest].filter(Boolean).join(' · ')}</Text>
            </Card>
          );
        })}
      </View>

      <View style={styles.actions}>
        {isTemplate ? (
          <Button label={t.routines.duplicateTemplate} onPress={duplicate} />
        ) : (
          <>
            <Button
              label={t.routines.edit}
              onPress={() => router.push({ pathname: '/routines/edit', params: { id: routine.id } })}
            />
            <Button variant="secondary" label={t.routines.duplicate} onPress={duplicate} />
            <Button variant="ghost" label={t.routines.delete} onPress={confirmDelete} />
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  description: { fontSize: font.body, color: colors.textMuted },
  note: { fontSize: font.small, color: colors.textMuted },
  list: { gap: spacing.sm },
  itemName: { fontSize: font.body, fontWeight: '600', color: colors.text },
  meta: { fontSize: font.small, color: colors.textMuted },
  actions: { gap: spacing.sm },
});

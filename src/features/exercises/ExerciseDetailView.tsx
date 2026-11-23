import { router } from 'expo-router';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';

import { useDatabase } from '@/db/DatabaseProvider';
import { useQuery } from '@/db/useQuery';
import { archiveExercise, exerciseByIdQuery, toExerciseDetail } from '@/db/repositories/exercises';
import { tutorialUrl } from '@/domain/exercise';
import { t } from '@/i18n';
import { isOnline } from '@/services/network';
import { Button, Card, EmptyState, Screen, colors, font, spacing } from '@/ui';

import { ExerciseThumb } from './ExerciseThumb';

/** Abre el tutorial en YouTube, o avisa si no hay internet (EJE-06). */
export async function openTutorial(exercise: { name: string; videoUrl: string | null }) {
  if (!(await isOnline())) {
    Alert.alert(t.exercises.offlineTitle, t.exercises.offlineBody, [{ text: t.common.ok }]);
    return;
  }
  try {
    await Linking.openURL(tutorialUrl(exercise));
  } catch {
    Alert.alert(t.exercises.openFailedTitle, t.exercises.openFailedBody, [{ text: t.common.ok }]);
  }
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

/** Ficha del ejercicio: datos, foto (o ícono) y botón de tutorial. */
export function ExerciseDetailView({ id }: { id: string }) {
  const { db, owner } = useDatabase();
  const { data, loaded } = useQuery(exerciseByIdQuery(db, id), [id]);
  const row = data[0];

  if (loaded && !row) {
    return (
      <Screen>
        <EmptyState title={t.exercises.notFoundTitle} body={t.exercises.notFoundBody} />
      </Screen>
    );
  }
  if (!row) return <Screen>{null}</Screen>;

  const e = toExerciseDetail(row);
  const secondary = e.secondaryMuscles.map((m) => t.exercises.muscleGroups[m]).join(', ');

  function confirmArchive() {
    Alert.alert(t.exercises.archiveConfirmTitle, t.exercises.archiveConfirmBody, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.exercises.archiveButton,
        style: 'destructive',
        onPress: () => {
          archiveExercise(db, owner, e.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <Screen title={e.name}>
      <View style={styles.thumb}>
        <ExerciseThumb imageKey={e.imageKey} size={140} />
      </View>
      <Button
        label={t.exercises.watchTutorial}
        accessibilityHint={t.exercises.watchTutorialHint}
        onPress={() => void openTutorial(e)}
      />
      <Button
        variant="secondary"
        label={t.exerciseHistory.open}
        onPress={() => router.push({ pathname: '/exercises/history/[id]', params: { id: e.id } })}
      />
      <Card>
        <Field label={t.exercises.mainMuscle} value={t.exercises.muscleGroups[e.muscleGroup]} />
        <Field label={t.exercises.secondaryMuscles} value={secondary || t.exercises.none} />
        <Field label={t.exercises.equipmentLabel} value={t.exercises.equipment[e.equipment]} />
        <Field label={t.exercises.trackingLabel} value={t.exercises.trackingTypes[e.trackingType]} />
        {e.notes ? <Field label={t.exercises.notesLabel} value={e.notes} /> : null}
      </Card>
      {e.isCustom && e.archived ? <Text style={styles.archived}>{t.exercises.archived}</Text> : null}
      {e.isCustom && !e.archived ? (
        <View style={styles.actions}>
          <Button
            variant="secondary"
            label={t.exercises.editButton}
            onPress={() => router.push({ pathname: '/exercises/edit/[id]', params: { id: e.id } })}
          />
          <Button variant="ghost" label={t.exercises.archiveButton} onPress={confirmArchive} />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  thumb: { alignItems: 'center' },
  field: { gap: 2, paddingVertical: spacing.xs },
  fieldLabel: { fontSize: font.small, color: colors.textMuted },
  fieldValue: { fontSize: font.body, color: colors.text },
  actions: { gap: spacing.sm },
  archived: { fontSize: font.body, color: colors.textMuted, textAlign: 'center' },
});

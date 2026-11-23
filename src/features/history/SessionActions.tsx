import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { useDatabase } from '@/db/DatabaseProvider';
import { saveRoutine } from '@/db/repositories/routines';
import { getActiveWorkout, repeatWorkout } from '@/db/repositories/workouts';
import { LIMITS, routineFromSession } from '@/domain/routine';
import { format, t } from '@/i18n';
import { Button, Card, TextField, colors, font, spacing } from '@/ui';

type Props = {
  workoutId: string;
  /** Nombre sugerido para la rutina: el de la rutina de origen o la fecha de la sesión. */
  suggestedName: string;
  /** Ejercicios de la sesión, en orden, con sus series. */
  items: { exerciseId: string; sets: { kind: string }[] }[];
};

/** Repetir una sesión pasada (HIS-03) y guardarla como rutina (RUT-05). */
export function SessionActions({ workoutId, suggestedName, items }: Props) {
  const { db, owner } = useDatabase();
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState(suggestedName);
  const [nameError, setNameError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  function repeat() {
    // Solo hay una sesión en curso a la vez (SES-01).
    if (getActiveWorkout(db, owner)) {
      Alert.alert(t.workout.alreadyActiveTitle, t.workout.alreadyActiveBody, [
        { text: t.common.cancel, style: 'cancel' },
        { text: t.workout.continue, onPress: () => router.push('/workout') },
      ]);
      return;
    }
    try {
      repeatWorkout(db, owner, workoutId);
      router.push('/workout');
    } catch (error) {
      console.error('No se pudo repetir la sesión', error);
      Alert.alert(t.sessionDetail.repeatFailed);
    }
  }

  function save() {
    const clean = name.trim().replace(/\s+/g, ' ');
    if (!clean) {
      setNameError(t.sessionDetail.routineNameRequired);
      return;
    }
    if (clean.length > LIMITS.name) {
      setNameError(t.sessionDetail.routineNameTooLong);
      return;
    }
    try {
      saveRoutine(db, owner, null, clean, routineFromSession(items));
      setSaved(clean);
      setNaming(false);
    } catch (error) {
      console.error('No se pudo guardar la rutina', error);
      Alert.alert(t.sessionDetail.routineFailed);
    }
  }

  return (
    <>
      {items.length > 0 ? (
        <>
          <Button label={t.sessionDetail.repeat} onPress={repeat} />
          <Text style={styles.hint}>{t.sessionDetail.repeatHint}</Text>
        </>
      ) : null}

      {saved ? (
        <Card>
          <Text style={styles.body} accessibilityLiveRegion="polite">
            {format(t.sessionDetail.routineSaved, { name: saved })}
          </Text>
          <Button
            variant="secondary"
            label={t.sessionDetail.routineOpen}
            onPress={() => router.navigate({ pathname: '/routines/section/[section]', params: { section: 'mine' } })}
          />
        </Card>
      ) : naming ? (
        <Card>
          <TextField
            autoFocus
            label={t.sessionDetail.routineName}
            value={name}
            onChangeText={(v) => {
              setName(v);
              setNameError(null);
            }}
            error={nameError}
            maxLength={80}
            returnKeyType="done"
            onSubmitEditing={save}
          />
          <View style={styles.row}>
            <View style={styles.flex}>
              <Button variant="ghost" label={t.common.cancel} onPress={() => setNaming(false)} />
            </View>
            <View style={styles.flex}>
              <Button label={t.sessionDetail.routineSave} onPress={save} />
            </View>
          </View>
        </Card>
      ) : items.length > 0 ? (
        <Button variant="secondary" label={t.sessionDetail.saveAsRoutine} onPress={() => setNaming(true)} />
      ) : (
        <Text style={styles.hint}>{t.sessionDetail.routineNoExercises}</Text>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: font.small, color: colors.textMuted },
  body: { fontSize: font.body, color: colors.text },
  row: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
});

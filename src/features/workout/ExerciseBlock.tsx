import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { useDatabase } from '@/db/DatabaseProvider';
import {
  addSet,
  deleteSet,
  type LastSession,
  removeWorkoutExercise,
  toLoggedSet,
  updateSet,
  type WorkoutSet,
} from '@/db/repositories/workouts';
import type { TrackingType } from '@/domain/exercise';
import { formatTarget } from '@/domain/routine';
import {
  formatSet,
  inputFromSet,
  prefillSet,
  type SetError,
  type SetInput,
  setNumbers,
  summarizeSets,
  validateSet,
  type WeightUnit,
} from '@/domain/workout';
import { format, t } from '@/i18n';
import { Button, Card, IconButton, colors, font, minTouch, radius, spacing } from '@/ui';

import { SetEditor } from './SetEditor';

export type WorkoutItem = {
  id: string;
  exerciseId: string;
  name: string | null;
  trackingType: TrackingType | null;
};

export type Target = { targetSets: number | null; repsMin: number | null; repsMax: number | null } | undefined;

type Props = {
  item: WorkoutItem;
  index: number;
  total: number;
  sets: WorkoutSet[];
  last: LastSession | undefined;
  target: Target;
  defaultUnit: WeightUnit;
  increments: Record<WeightUnit, number>;
  onMove: (from: number, to: number) => void;
};

/** Un ejercicio dentro de la sesión: última vez, series registradas y la siguiente serie (SES-02, SES-03, SES-09). */
export function ExerciseBlock({ item, index, total, sets, last, target, defaultUnit, increments, onMove }: Props) {
  const { db } = useDatabase();
  const [editingId, setEditingId] = useState<string | null>(null);
  const name = item.name ?? t.routines.unknownExercise;
  const tracking: TrackingType = item.trackingType ?? 'weight_reps';
  const numbers = setNumbers(sets);
  const targetText = target ? formatTarget(target.targetSets, target.repsMin, target.repsMax) : '';

  function confirmRemove() {
    if (sets.length === 0) {
      removeWorkoutExercise(db, item.id);
      return;
    }
    Alert.alert(format(t.workout.removeConfirmTitle, { name }), t.workout.removeConfirmBody, [
      { text: t.common.cancel, style: 'cancel' },
      { text: t.workout.removeConfirm, style: 'destructive', onPress: () => removeWorkoutExercise(db, item.id) },
    ]);
  }

  return (
    <Card>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={format(t.workout.openExercise, { name })}
          onPress={() => router.push({ pathname: '/exercises/[id]', params: { id: item.exerciseId } })}
          style={({ pressed }) => [styles.titleBox, pressed && styles.pressed]}>
          <Text style={styles.name}>{name}</Text>
          {targetText ? <Text style={styles.meta}>{format(t.workout.target, { target: targetText })}</Text> : null}
        </Pressable>
        <IconButton
          icon="arrow-up"
          label={format(t.workout.moveUp, { name })}
          disabled={index === 0}
          onPress={() => onMove(index, index - 1)}
        />
        <IconButton
          icon="arrow-down"
          label={format(t.workout.moveDown, { name })}
          disabled={index === total - 1}
          onPress={() => onMove(index, index + 1)}
        />
        <IconButton icon="close" tone="danger" label={format(t.workout.remove, { name })} onPress={confirmRemove} />
      </View>

      <Text style={styles.meta}>
        {last ? format(t.workout.lastTime, { summary: summarizeSets(last.sets) }) : t.workout.noLastTime}
      </Text>

      {sets.map((s, i) => {
        const label = numbers[i] ?? null;
        const number = label === null ? '–' : String(label);
        if (editingId === s.id) {
          return (
            <EditSet
              key={s.id}
              set={s}
              tracking={tracking}
              defaultUnit={defaultUnit}
              increments={increments}
              onDone={() => setEditingId(null)}
            />
          );
        }
        const text = formatSet(toLoggedSet(s));
        return (
          <Pressable
            key={s.id}
            accessibilityRole="button"
            accessibilityLabel={format(t.workout.editSet, { n: number, set: text })}
            onPress={() => setEditingId(s.id)}
            style={({ pressed }) => [styles.setRow, pressed && styles.pressed]}>
            <Text style={styles.setNumber}>{number}</Text>
            <Text style={styles.setText}>{text}</Text>
          </Pressable>
        );
      })}

      {editingId === null ? (
        <NextSet
          // Al registrar una serie cambia la clave y los campos se vuelven a precargar.
          key={`${item.id}-${sets.length}`}
          workoutExerciseId={item.id}
          tracking={tracking}
          initial={prefillSet({
            index: sets.length,
            lastSession: last?.sets ?? [],
            today: sets.map(toLoggedSet),
            defaultUnit,
          })}
          increments={increments}
        />
      ) : null}
    </Card>
  );
}

/** Campos de la siguiente serie, ya llenos (SES-03). */
function NextSet({
  workoutExerciseId,
  tracking,
  initial,
  increments,
}: {
  workoutExerciseId: string;
  tracking: TrackingType;
  initial: SetInput;
  increments: Record<WeightUnit, number>;
}) {
  const { db, owner } = useDatabase();
  const [value, setValue] = useState(initial);
  const [errors, setErrors] = useState<SetError[]>([]);
  // Evita registrar dos veces la misma serie con un doble toque mientras se actualiza la lista.
  const [submitted, setSubmitted] = useState(false);

  function submit() {
    if (submitted) return;
    const result = validateSet(tracking, value);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    try {
      addSet(db, owner, workoutExerciseId, result.values);
      setSubmitted(true);
    } catch (error) {
      console.error('No se pudo registrar la serie', error);
      Alert.alert(t.workout.saveFailed);
    }
  }

  return (
    <View style={styles.next}>
      <SetEditor
        trackingType={tracking}
        value={value}
        onChange={(v) => {
          setValue(v);
          setErrors([]);
        }}
        increments={increments}
        errors={errors}
        submitLabel={t.workout.logSet}
        onSubmit={submit}
      />
    </View>
  );
}

/** Corregir o eliminar una serie ya registrada (SES-09). */
function EditSet({
  set,
  tracking,
  defaultUnit,
  increments,
  onDone,
}: {
  set: WorkoutSet;
  tracking: TrackingType;
  defaultUnit: WeightUnit;
  increments: Record<WeightUnit, number>;
  onDone: () => void;
}) {
  const { db } = useDatabase();
  const [value, setValue] = useState(() => inputFromSet(toLoggedSet(set), defaultUnit));
  const [errors, setErrors] = useState<SetError[]>([]);

  function save() {
    const result = validateSet(tracking, value);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    try {
      updateSet(db, set.id, result.values);
      onDone();
    } catch (error) {
      console.error('No se pudo corregir la serie', error);
      Alert.alert(t.workout.saveFailed);
    }
  }

  function confirmDelete() {
    Alert.alert(t.workout.deleteSetConfirmTitle, t.workout.deleteSetConfirmBody, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.workout.deleteSet,
        style: 'destructive',
        onPress: () => {
          deleteSet(db, set.id);
          onDone();
        },
      },
    ]);
  }

  return (
    <View style={styles.editing}>
      <SetEditor
        trackingType={tracking}
        value={value}
        onChange={(v) => {
          setValue(v);
          setErrors([]);
        }}
        increments={increments}
        errors={errors}
        submitLabel={t.workout.saveSet}
        onSubmit={save}
        footer={
          <View style={styles.editActions}>
            <View style={styles.flex}>
              <Button variant="ghost" label={t.common.cancel} onPress={onDone} />
            </View>
            <View style={styles.flex}>
              <Button variant="ghost" label={t.workout.deleteSet} onPress={confirmDelete} />
            </View>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center' },
  titleBox: { flex: 1, minHeight: minTouch, justifyContent: 'center' },
  name: { fontSize: font.body, fontWeight: '700', color: colors.primary },
  meta: { fontSize: font.small, color: colors.textMuted },
  pressed: { opacity: 0.6 },
  setRow: {
    minHeight: minTouch,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  setNumber: { width: 24, fontSize: font.body, fontWeight: '700', color: colors.textMuted, textAlign: 'center' },
  setText: { flex: 1, fontSize: font.body, color: colors.text },
  next: { marginTop: spacing.xs },
  editing: {
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  editActions: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
});

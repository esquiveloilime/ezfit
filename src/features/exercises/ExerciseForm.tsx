import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useDatabase } from '@/db/DatabaseProvider';
import {
  createExercise,
  type ExerciseDetail,
  exerciseByIdQuery,
  toExerciseDetail,
  updateExercise,
} from '@/db/repositories/exercises';
import { EQUIPMENT, MUSCLE_GROUPS, TRACKING_TYPES } from '@/domain/exercise';
import {
  type ExerciseFormErrors,
  type ExerciseFormInput,
  trackingAllowsRir,
  validateExerciseForm,
} from '@/domain/exerciseForm';
import { t } from '@/i18n';
import { Button, ChipGroup, EmptyState, Screen, TextField, ToggleRow, colors, font, spacing } from '@/ui';

import { useExercisePicker } from './pickerStore';

const EMPTY: ExerciseFormInput = {
  name: '',
  muscleGroup: 'chest',
  equipment: 'machine',
  trackingType: 'weight_reps',
  usesRir: true,
  usesTechnique: true,
  notes: '',
  videoUrl: '',
};

function fromDetail(e: ExerciseDetail): ExerciseFormInput {
  return {
    name: e.name,
    muscleGroup: e.muscleGroup,
    equipment: e.equipment,
    trackingType: e.trackingType,
    usesRir: e.usesRir,
    usesTechnique: e.usesTechnique,
    notes: e.notes ?? '',
    videoUrl: e.videoUrl ?? '',
  };
}

type Props =
  /** Crear. `fromPicker`: se abrió desde el selector y el nuevo ejercicio se elige al guardar. */
  | { mode: 'create'; fromPicker: boolean }
  | { mode: 'edit'; id: string };

/** Crear o editar un ejercicio propio (EJE-03, EJE-04). */
export function ExerciseForm(props: Props) {
  const { db } = useDatabase();
  const { data } = useLiveQuery(exerciseByIdQuery(db, props.mode === 'edit' ? props.id : ''), [
    props.mode === 'edit' ? props.id : '',
  ]);
  if (props.mode === 'edit') {
    const row = data?.[0];
    if (!data) return <Screen>{null}</Screen>;
    if (!row || row.userId === null) {
      return (
        <Screen>
          <EmptyState title={t.exercises.notFoundTitle} body={t.exercises.catalogLocked} />
        </Screen>
      );
    }
    return <FormBody key={row.id} initial={fromDetail(toExerciseDetail(row))} editId={row.id} fromPicker={false} />;
  }
  return <FormBody initial={EMPTY} editId={null} fromPicker={props.fromPicker} />;
}

function FormBody({
  initial,
  editId,
  fromPicker,
}: {
  initial: ExerciseFormInput;
  editId: string | null;
  fromPicker: boolean;
}) {
  const { db, owner } = useDatabase();
  const pick = useExercisePicker((s) => s.pick);
  const [form, setForm] = useState<ExerciseFormInput>(initial);
  const [errors, setErrors] = useState<ExerciseFormErrors>({});
  const [saveError, setSaveError] = useState(false);

  function update<K extends keyof ExerciseFormInput>(key: K, value: ExerciseFormInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function save() {
    const result = validateExerciseForm(form);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    try {
      if (editId) {
        updateExercise(db, owner, editId, result.values);
        router.back();
      } else {
        const id = createExercise(db, owner, result.values);
        if (fromPicker) {
          // Vuelve a quien abrió el selector, con el ejercicio nuevo ya elegido.
          pick(id);
          router.dismiss(2);
        } else {
          router.replace({ pathname: '/exercises/[id]', params: { id } });
        }
      }
    } catch (error) {
      console.error('No se pudo guardar el ejercicio', error);
      setSaveError(true);
    }
  }

  const rirAllowed = trackingAllowsRir(form.trackingType);

  return (
    <Screen title={editId ? t.exercises.editTitle : t.exercises.createTitle}>
      <TextField
        label={t.exercises.form.name}
        placeholder={t.exercises.form.namePlaceholder}
        value={form.name}
        onChangeText={(v) => update('name', v)}
        error={
          errors.name === 'required'
            ? t.exercises.form.nameRequired
            : errors.name === 'too_long'
              ? t.exercises.form.nameTooLong
              : null
        }
        maxLength={100}
      />
      <ChipGroup
        label={t.exercises.form.muscle}
        options={MUSCLE_GROUPS}
        value={form.muscleGroup}
        labelFor={(m) => t.exercises.muscleGroups[m]}
        onChange={(m) => update('muscleGroup', m)}
      />
      <ChipGroup
        label={t.exercises.form.equipment}
        options={EQUIPMENT}
        value={form.equipment}
        labelFor={(e) => t.exercises.equipment[e]}
        onChange={(e) => update('equipment', e)}
      />
      <ChipGroup
        label={t.exercises.form.tracking}
        options={TRACKING_TYPES}
        value={form.trackingType}
        labelFor={(k) => t.exercises.trackingTypes[k]}
        onChange={(k) => update('trackingType', k)}
      />
      <View>
        <ToggleRow
          label={t.exercises.form.usesRir}
          description={rirAllowed ? t.exercises.form.usesRirHelp : t.exercises.form.usesRirDisabled}
          value={rirAllowed && form.usesRir}
          onChange={(v) => update('usesRir', v)}
          disabled={!rirAllowed}
        />
        <ToggleRow
          label={t.exercises.form.usesTechnique}
          description={t.exercises.form.usesTechniqueHelp}
          value={form.usesTechnique}
          onChange={(v) => update('usesTechnique', v)}
        />
      </View>
      <TextField
        label={t.exercises.form.notes}
        value={form.notes}
        onChangeText={(v) => update('notes', v)}
        multiline
      />
      <TextField
        label={t.exercises.form.videoUrl}
        placeholder={t.exercises.form.videoUrlPlaceholder}
        value={form.videoUrl}
        onChangeText={(v) => update('videoUrl', v)}
        error={errors.videoUrl ? t.exercises.form.videoUrlInvalid : null}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />
      {saveError ? <Text style={styles.error}>{t.exercises.form.saveFailed}</Text> : null}
      <Button label={t.exercises.form.save} onPress={save} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { fontSize: font.body, color: colors.danger, marginTop: spacing.sm },
});

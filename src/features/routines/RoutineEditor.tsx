import Ionicons from '@expo/vector-icons/Ionicons';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useDatabase } from '@/db/DatabaseProvider';
import { exercises } from '@/db/schema';
import { loadRoutineForEdit, saveRoutine } from '@/db/repositories/routines';
import { newId } from '@/domain/id';
import { type DraftErrors, type DraftItem, type RoutineDraft, validateRoutineDraft } from '@/domain/routine';
import { useExercisePicker } from '@/features/exercises/pickerStore';
import { format, t } from '@/i18n';
import { Button, Card, Screen, TextField, colors, font, minTouch, spacing } from '@/ui';

import { useRoutineDraft } from './draftStore';

const text = (n: number | null) => (n === null ? '' : String(n));

/** Crear o editar una rutina propia (RUT-03, RUT-04). `id` vacío: rutina nueva. */
export function RoutineEditor({ id }: { id: string | undefined }) {
  const { db, owner } = useDatabase();
  const editingKey = id ?? 'new';
  const editing = useRoutineDraft((s) => s.editing);
  const draft = useRoutineDraft((s) => s.draft);
  const { start, clear, setName, addExercise, updateItem, removeItem, move } = useRoutineDraft.getState();
  const openPicker = useExercisePicker((s) => s.open);
  const [errors, setErrors] = useState<DraftErrors>({});
  const [saveError, setSaveError] = useState(false);

  // Nombres de todos los ejercicios (incluidos los archivados que ya estaban en la rutina).
  const { data: allExercises } = useLiveQuery(
    db.select({ id: exercises.id, name: exercises.name }).from(exercises),
  );
  const names = useMemo(() => new Map((allExercises ?? []).map((e) => [e.id, e.name])), [allExercises]);

  // Al entrar, carga la rutina en el borrador; al salir de la pantalla, lo descarta.
  useEffect(() => {
    if (useRoutineDraft.getState().editing !== editingKey) {
      let initial: RoutineDraft = { name: '', items: [] };
      if (id) {
        const loaded = loadRoutineForEdit(db, id);
        if (loaded) {
          initial = {
            name: loaded.routine.name,
            items: loaded.items.map(
              (i): DraftItem => ({
                key: newId(),
                routineExerciseId: i.id,
                exerciseId: i.exerciseId,
                targetSets: text(i.targetSets),
                repsMin: text(i.repsMin),
                repsMax: text(i.repsMax),
                restSeconds: text(i.restSeconds),
              }),
            ),
          };
        }
      }
      start(editingKey, initial);
    }
    return () => clear();
  }, [db, id, editingKey, start, clear]);

  if (editing !== editingKey) return <Screen>{null}</Screen>;

  function onAddExercise() {
    openPicker((exerciseId) => addExercise(exerciseId));
    router.push('/exercises/pick');
  }

  function save() {
    const result = validateRoutineDraft(draft);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    try {
      const savedId = saveRoutine(db, owner, id ?? null, result.name, result.items);
      if (id) router.back();
      else router.replace({ pathname: '/routines/[id]', params: { id: savedId } });
    } catch (error) {
      console.error('No se pudo guardar la rutina', error);
      setSaveError(true);
    }
  }

  const nameError =
    errors.name === 'required'
      ? t.routines.editor.nameRequired
      : errors.name === 'too_long'
        ? t.routines.editor.nameTooLong
        : null;

  return (
    <Screen title={id ? t.routines.editor.editTitle : t.routines.editor.newTitle}>
      <TextField
        label={t.routines.editor.name}
        placeholder={t.routines.editor.namePlaceholder}
        value={draft.name}
        onChangeText={setName}
        error={nameError}
        maxLength={80}
      />

      <Text style={styles.sectionTitle}>{t.routines.editor.exercises}</Text>
      <Text style={styles.hint}>{t.routines.editor.optionalHint}</Text>
      {errors.items ? <Text style={styles.error}>{t.routines.editor.empty}</Text> : null}

      {draft.items.map((item, index) => {
        const name = names.get(item.exerciseId) ?? t.routines.unknownExercise;
        const itemErrors = errors.byItem?.[item.key] ?? [];
        return (
          <Card key={item.key}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemName}>
                {index + 1}. {name}
              </Text>
              <IconButton
                icon="arrow-up"
                label={format(t.routines.editor.moveUp, { name })}
                disabled={index === 0}
                onPress={() => move(index, index - 1)}
              />
              <IconButton
                icon="arrow-down"
                label={format(t.routines.editor.moveDown, { name })}
                disabled={index === draft.items.length - 1}
                onPress={() => move(index, index + 1)}
              />
              <IconButton
                icon="close"
                label={format(t.routines.editor.remove, { name })}
                onPress={() => removeItem(item.key)}
              />
            </View>
            <View style={styles.fields}>
              <NumberField
                label={t.routines.editor.sets}
                value={item.targetSets}
                onChange={(v) => updateItem(item.key, 'targetSets', v)}
              />
              <NumberField
                label={t.routines.editor.repsMin}
                value={item.repsMin}
                onChange={(v) => updateItem(item.key, 'repsMin', v)}
              />
              <NumberField
                label={t.routines.editor.repsMax}
                value={item.repsMax}
                onChange={(v) => updateItem(item.key, 'repsMax', v)}
              />
              <NumberField
                label={t.routines.editor.rest}
                placeholder={t.routines.editor.restPlaceholder}
                value={item.restSeconds}
                onChange={(v) => updateItem(item.key, 'restSeconds', v)}
              />
            </View>
            {itemErrors.map((e) => (
              <Text key={e} style={styles.error}>
                {t.routines.editor.errors[e]}
              </Text>
            ))}
          </Card>
        );
      })}

      <Button variant="secondary" label={t.routines.editor.addExercise} onPress={onAddExercise} />
      {saveError ? <Text style={styles.error}>{t.routines.editor.saveFailed}</Text> : null}
      <Button label={t.routines.editor.save} onPress={save} />
    </Screen>
  );
}

function NumberField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.numberField}>
      <TextField
        label={label}
        value={value}
        onChangeText={(v) => onChange(v.replace(/[^0-9]/g, ''))}
        keyboardType="number-pad"
        maxLength={4}
        placeholder={placeholder}
      />
    </View>
  );
}

function IconButton({
  icon,
  label,
  onPress,
  disabled = false,
}: {
  icon: 'arrow-up' | 'arrow-down' | 'close';
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, (pressed || disabled) && styles.dim]}>
      <Ionicons name={icon} size={22} color={icon === 'close' ? colors.danger : colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: font.title, fontWeight: '700', color: colors.text },
  hint: { fontSize: font.small, color: colors.textMuted },
  itemHeader: { flexDirection: 'row', alignItems: 'center' },
  itemName: { flex: 1, fontSize: font.body, fontWeight: '600', color: colors.text },
  fields: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  numberField: { flexBasis: '45%', flexGrow: 1 },
  iconButton: { width: minTouch, height: minTouch, alignItems: 'center', justifyContent: 'center' },
  dim: { opacity: 0.35 },
  error: { fontSize: font.small, color: colors.danger },
});

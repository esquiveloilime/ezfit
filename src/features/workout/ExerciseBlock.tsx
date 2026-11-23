import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { useDatabase } from '@/db/DatabaseProvider';
import {
  addSet,
  deleteSet,
  type LastSession,
  lastSetsForRecommendation,
  machineHistory,
  removeWorkoutExercise,
  setMachine,
  toLoggedSet,
  updateSet,
  type WorkoutSet,
} from '@/db/repositories/workouts';
import type { TrackingType } from '@/domain/exercise';
import { type Recommendation, recommend } from '@/domain/recommendation';
import { formatTarget } from '@/domain/routine';
import {
  cleanMachine,
  type ExerciseProgress,
  fieldsFor,
  formatNumber,
  formatSet,
  inputFromSet,
  machineSuggestions,
  prefillSet,
  type SetError,
  type SetInput,
  setNumbers,
  summarizeSets,
  validateSet,
  type WeightUnit,
} from '@/domain/workout';
import { formatRunDate } from '@/features/run/RunStats';
import { format, t } from '@/i18n';
import { Button, Card, Chip, IconButton, TextField, colors, font, minTouch, radius, spacing } from '@/ui';

import { SetEditor } from './SetEditor';

export type WorkoutItem = {
  id: string;
  exerciseId: string;
  name: string | null;
  trackingType: TrackingType | null;
  usesRir: boolean | null;
  usesTechnique: boolean | null;
  machine: string | null;
  referenceId: string | null;
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
  onSetLogged: () => void;
  /** Plegado: solo se ve el nombre y el avance; al tocarlo se abre (SES-02). */
  open: boolean;
  progress: ExerciseProgress;
  onToggle: () => void;
};

/** Un ejercicio dentro de la sesión: última vez, series registradas y la siguiente serie (SES-02, SES-03, SES-09). */
export function ExerciseBlock({
  item,
  index,
  total,
  sets,
  last,
  target,
  defaultUnit,
  increments,
  onMove,
  onSetLogged,
  open,
  progress,
  onToggle,
}: Props) {
  const { db, owner } = useDatabase();
  const [editingId, setEditingId] = useState<string | null>(null);
  // Valores de la sugerencia tocada (REC-01), solo para la serie que sigue en ese momento.
  const [applied, setApplied] = useState<{ at: number; input: SetInput } | null>(null);
  const name = item.name ?? t.routines.unknownExercise;
  const tracking: TrackingType = item.trackingType ?? 'weight_reps';
  // Sugerencia de peso (REC-01): solo en peso y repeticiones, con la última sesión en la misma máquina.
  const recommendation = useMemo(
    () =>
      tracking === 'weight_reps'
        ? recommend({
            lastSets: lastSetsForRecommendation(db, owner, item.exerciseId, item.machine),
            repsMin: target?.repsMin,
            repsMax: target?.repsMax,
            increments,
          })
        : null,
    // `increments` se arma en cada dibujo; sus valores son los que importan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, owner, item.exerciseId, item.machine, tracking, target?.repsMin, target?.repsMax, increments.kg, increments.lb],
  );
  const startedExercise = sets.some((s) => s.kind === 'working');
  const numbers = setNumbers(sets);
  const targetText = target ? formatTarget(target.targetSets, target.repsMin, target.repsMax) : '';
  // El RIR solo tiene sentido cuando se cuentan repeticiones (EJE-03).
  const options = {
    showRir: !!item.usesRir && fieldsFor(tracking).reps,
    showTechnique: !!item.usesTechnique,
  };

  // Siempre con confirmación: la X está cerca de otros botones y un toque accidental borra el ejercicio.
  function confirmRemove() {
    const body = sets.length > 0 ? t.workout.removeConfirmBody : t.workout.removeConfirmBodyEmpty;
    Alert.alert(format(t.workout.removeConfirmTitle, { name }), body, [
      { text: t.common.cancel, style: 'cancel' },
      { text: t.workout.removeConfirm, style: 'destructive', onPress: () => removeWorkoutExercise(db, item.id) },
    ]);
  }

  const progressText =
    progress.target !== null
      ? format(t.workout.progressOf, { done: progress.done, target: progress.target })
      : progress.done === 1
        ? t.workout.progressOne
        : format(t.workout.progressCount, { n: progress.done });

  if (!open) {
    return (
      <Card>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: false }}
          accessibilityLabel={format(t.workout.expand, { name, progress: progressText })}
          onPress={onToggle}
          style={({ pressed }) => [styles.collapsed, pressed && styles.pressed]}>
          <View style={styles.titleBox}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.meta}>{progressText}</Text>
          </View>
          {progress.complete ? (
            <Ionicons name="checkmark-circle" size={24} color={colors.success} accessibilityLabel={t.workout.complete} />
          ) : null}
          <Ionicons name="chevron-down" size={22} color={colors.textMuted} />
        </Pressable>
      </Card>
    );
  }

  return (
    <Card>
      {/* El nombre va arriba con todo el ancho y los botones en una fila debajo. */}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: true }}
        accessibilityLabel={format(t.workout.collapse, { name })}
        onPress={onToggle}
        style={({ pressed }) => [styles.titleBox, pressed && styles.pressed]}>
        <Text style={styles.name}>{name}</Text>
        {targetText ? <Text style={styles.meta}>{format(t.workout.target, { target: targetText })}</Text> : null}
      </Pressable>
      <View style={styles.header}>
        <IconButton icon="close" tone="danger" label={format(t.workout.remove, { name })} onPress={confirmRemove} />
        <IconButton
          icon="information-circle-outline"
          label={format(t.workout.openExercise, { name })}
          onPress={() => router.push({ pathname: '/exercises/[id]', params: { id: item.exerciseId } })}
        />
        <IconButton
          icon="time-outline"
          label={format(t.sessionDetail.seeHistory, { name })}
          onPress={() => router.push({ pathname: '/exercises/history/[id]', params: { id: item.exerciseId } })}
        />
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
        <View style={styles.spacer} />
        {/* Cerrar va en la orilla derecha, en el mismo lugar que la flecha para abrir. */}
        <IconButton icon="chevron-up" tone="muted" label={format(t.workout.collapse, { name })} onPress={onToggle} />
      </View>

      <Text style={styles.meta}>
        {last
          ? last.fromReference
            ? format(t.workout.referenceTime, { date: formatRunDate(last.startedAt), summary: summarizeSets(last.sets) })
            : format(t.workout.lastTime, { summary: summarizeSets(last.sets) })
          : t.workout.noLastTime}
      </Text>

      <MachineField workoutExerciseId={item.id} exerciseId={item.exerciseId} saved={item.machine} />

      {recommendation && !startedExercise && editingId === null ? (
        <Suggestion
          recommendation={recommendation}
          onApply={(choice) => {
            const base = prefillSet({ index: sets.length, lastSession: last?.sets ?? [], today: sets.map(toLoggedSet), defaultUnit });
            setApplied({
              at: sets.length,
              input: {
                ...base,
                kind: 'working',
                weight: formatNumber(choice.weight),
                unit: recommendation.unit,
                reps: String(choice.reps),
              },
            });
          }}
        />
      ) : null}

      {sets.map((s, i) => {
        const label = numbers[i] ?? null;
        const warmup = s.kind === 'warmup';
        const number = label === null ? t.workout.warmupShort : String(label);
        const meta = [
          s.rir !== null ? format(t.workout.setMeta.rir, { n: s.rir === 5 ? t.workout.rirMax : s.rir }) : null,
          s.technique !== null ? format(t.workout.setMeta.technique, { n: s.technique }) : null,
        ]
          .filter(Boolean)
          .join(' · ');
        if (editingId === s.id) {
          return (
            <EditSet
              key={s.id}
              set={s}
              tracking={tracking}
              defaultUnit={defaultUnit}
              increments={increments}
              {...options}
              onDone={() => setEditingId(null)}
            />
          );
        }
        const text = formatSet(toLoggedSet(s));
        return (
          <Pressable
            key={s.id}
            accessibilityRole="button"
            accessibilityLabel={format(t.workout.editSet, { n: warmup ? t.workout.warmup : number, set: text })}
            onPress={() => setEditingId(s.id)}
            style={({ pressed }) => [styles.setRow, warmup && styles.warmupRow, pressed && styles.pressed]}>
            <Text style={[styles.setNumber, warmup && styles.warmupNumber]}>{number}</Text>
            <Text style={[styles.setText, warmup && styles.warmupText]}>{text}</Text>
            {meta ? <Text style={styles.setMeta}>{meta}</Text> : null}
          </Pressable>
        );
      })}

      {editingId === null ? (
        <NextSet
          // Al registrar una serie o tocar la sugerencia cambia la clave y los campos se vuelven a llenar.
          key={`${item.id}-${sets.length}-${applied?.at === sets.length ? 'suggested' : 'prefill'}-${applied?.input.weight ?? ''}`}
          workoutExerciseId={item.id}
          tracking={tracking}
          initial={
            applied?.at === sets.length
              ? applied.input
              : prefillSet({
                  index: sets.length,
                  lastSession: last?.sets ?? [],
                  today: sets.map(toLoggedSet),
                  defaultUnit,
                })
          }
          increments={increments}
          onLogged={onSetLogged}
          {...options}
        />
      ) : null}
    </Card>
  );
}

/**
 * Sugerencia de peso para hoy con su motivo en una línea (REC-01). Nunca cambia los campos
 * por su cuenta: solo al tocarla.
 */
function Suggestion({
  recommendation: rec,
  onApply,
}: {
  recommendation: Recommendation;
  onApply: (choice: { weight: number; reps: number }) => void;
}) {
  const values = {
    weight: formatNumber(rec.weight),
    unit: t.units[rec.unit],
    reps: rec.reps,
    best: rec.bestReps,
    min: rec.range.min,
    max: rec.range.max,
    technique: rec.techniqueAverage === null ? '' : formatNumber(Math.round(rec.techniqueAverage * 10) / 10),
  };
  const title = format(t.workout.suggestion[rec.action], values);
  const reason = format(t.workout.suggestion.reasons[rec.reason], values);
  const icon = rec.action === 'increase' ? 'trending-up' : rec.action === 'decrease' ? 'trending-down' : 'repeat';
  const alt = rec.alternative;
  const altValues = alt ? { weight: formatNumber(alt.weight), unit: values.unit, reps: alt.reps } : null;
  return (
    <View style={styles.suggestionBox}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={format(t.workout.suggestion.applyA11y, { ...values, reason })}
        onPress={() => onApply({ weight: rec.weight, reps: rec.reps })}
        style={({ pressed }) => [styles.suggestion, pressed && styles.pressed]}>
        <Ionicons name={icon} size={22} color={colors.primary} />
        <View style={styles.flex}>
          <Text style={styles.suggestionTitle}>{title}</Text>
          <Text style={styles.meta}>{reason}</Text>
          <Text style={styles.suggestionHint}>{t.workout.suggestion.apply}</Text>
        </View>
      </Pressable>
      {/* Con una mejor serie de 6, la segunda opción es bajar un poco el peso (REC-01). */}
      {alt && altValues ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={format(t.workout.suggestion.alternativeA11y, altValues)}
          onPress={() => onApply(alt)}
          style={({ pressed }) => [styles.suggestion, pressed && styles.pressed]}>
          <Ionicons name="trending-down" size={22} color={colors.primary} />
          <Text style={[styles.flex, styles.suggestionHint]}>{format(t.workout.suggestion.alternative, altValues)}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Campos de la siguiente serie, ya llenos (SES-03). */
type Options = { showRir: boolean; showTechnique: boolean };

function NextSet({
  workoutExerciseId,
  tracking,
  initial,
  increments,
  showRir,
  showTechnique,
  onLogged,
}: {
  workoutExerciseId: string;
  tracking: TrackingType;
  initial: SetInput;
  increments: Record<WeightUnit, number>;
  onLogged: () => void;
} & Options) {
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
      onLogged();
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
        showRir={showRir}
        showTechnique={showTechnique}
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
  showRir,
  showTechnique,
  onDone,
}: {
  set: WorkoutSet;
  tracking: TrackingType;
  defaultUnit: WeightUnit;
  increments: Record<WeightUnit, number>;
  onDone: () => void;
} & Options) {
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
        showRir={showRir}
        showTechnique={showTechnique}
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

/**
 * Máquina o marca usada en el ejercicio (SES-06). Viene con la última que se usó y, al
 * escribir, sugiere las que ya se anotaron antes. Se guarda al salir del campo o al
 * tocar una sugerencia.
 */
function MachineField({
  workoutExerciseId,
  exerciseId,
  saved,
}: {
  workoutExerciseId: string;
  exerciseId: string;
  saved: string | null;
}) {
  const { db, owner } = useDatabase();
  const [value, setValue] = useState(saved ?? '');
  const [focused, setFocused] = useState(false);
  // Plegado ocupa una sola línea; se abre al tocarlo (SES-06).
  const [editing, setEditing] = useState(false);
  const history = useMemo(() => machineHistory(db, owner, exerciseId), [db, owner, exerciseId]);
  const suggestions = focused ? machineSuggestions(history, value, 4) : [];

  function save(text: string) {
    const machine = cleanMachine(text);
    if (machine !== saved) setMachine(db, workoutExerciseId, machine);
  }

  if (!editing) {
    const current = cleanMachine(value);
    const text = current ? format(t.workout.machineLine, { name: current }) : t.workout.machineAdd;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={current ? format(t.workout.machineEdit, { name: current }) : t.workout.machineAdd}
        onPress={() => setEditing(true)}
        style={({ pressed }) => [styles.machineLine, pressed && styles.pressed]}>
        <Ionicons name="construct-outline" size={18} color={colors.textMuted} />
        <Text style={[styles.machineText, !current && styles.machineEmpty]} numberOfLines={1}>
          {text}
        </Text>
        <Ionicons name="pencil-outline" size={18} color={colors.primary} />
      </Pressable>
    );
  }

  return (
    <View style={styles.machine}>
      <TextField
        autoFocus
        label={t.workout.machine}
        placeholder={t.workout.machinePlaceholder}
        value={value}
        onChangeText={setValue}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          setEditing(false);
          save(value);
        }}
        maxLength={60}
        returnKeyType="done"
      />
      {suggestions.length ? (
        <View style={styles.suggestions}>
          {suggestions.map((m) => (
            <Chip
              key={m}
              label={m}
              selected={false}
              onPress={() => {
                setValue(m);
                save(m);
                setEditing(false);
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  machine: { gap: spacing.xs },
  machineLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: minTouch },
  machineText: { flex: 1, fontSize: font.body, color: colors.text },
  machineEmpty: { color: colors.primary },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  warmupRow: { backgroundColor: colors.warningSoft },
  warmupNumber: { color: colors.warning },
  warmupText: { color: colors.textMuted },
  setMeta: { fontSize: font.small, color: colors.textMuted },
  header: { flexDirection: 'row', alignItems: 'center' },
  spacer: { flex: 1 },
  titleBox: { flex: 1, minHeight: minTouch, justifyContent: 'center' },
  collapsed: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
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
  suggestionBox: { gap: spacing.xs },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: minTouch,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  suggestionTitle: { fontSize: font.body, fontWeight: '700', color: colors.text },
  suggestionHint: { fontSize: font.small, color: colors.primary, fontWeight: '600' },
  flex: { flex: 1 },
});

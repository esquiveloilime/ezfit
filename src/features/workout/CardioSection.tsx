import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { useDatabase } from '@/db/DatabaseProvider';
import {
  addCardio,
  type CardioRow,
  deleteCardio,
  lastCardioByMachine,
  toCardioValues,
  updateCardio,
  workoutCardioQuery,
} from '@/db/repositories/cardio';
import { useQuery } from '@/db/useQuery';
import {
  CARDIO_MACHINES,
  type CardioError,
  type CardioInput,
  type CardioMachine,
  type CardioValues,
  cardioParts,
  emptyCardio,
  inputFromCardio,
  pauseStopwatch,
  prefillCardio,
  type Stopwatch,
  STOPWATCH_ZERO,
  startStopwatch,
  stopwatchMs,
  stopwatchToFields,
  validateCardio,
} from '@/domain/cardio';
import { formatClock } from '@/domain/workout';
import { useNow } from '@/features/run/useLocation';
import { format, t } from '@/i18n';
import { Button, Card, ChipGroup, TextField, colors, font, minTouch, radius, spacing } from '@/ui';

/** Texto corto de un bloque: "Caminadora · 20:30 · nivel 5 · 6.5 km/h · 2.1 km". */
export function cardioSummary(values: CardioValues): string {
  const p = cardioParts(values);
  return [
    t.cardio.machines[values.machineType],
    p.duration,
    p.level ? format(t.cardio.parts.level, { n: p.level }) : null,
    p.speed ? format(t.cardio.parts.speed, { n: p.speed }) : null,
    p.distanceKm ? format(t.cardio.parts.distance, { n: p.distanceKm }) : null,
    p.incline ? format(t.cardio.parts.incline, { n: p.incline }) : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

/** Bloques de cardio de la sesión en curso y el botón para agregar otro (CAR-01, CAR-02). */
export function CardioSection({ workoutId }: { workoutId: string }) {
  const { db, owner } = useDatabase();
  const { data: entries } = useQuery(workoutCardioQuery(db, workoutId), [workoutId]);
  // Últimos valores por aparato, leídos al abrir el formulario: así incluyen lo registrado
  // antes en esta misma sesión. Vacío mientras no se está agregando un bloque.
  const [last, setLast] = useState<Map<CardioMachine, CardioValues> | null>(null);
  const adding = last !== null;
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <>
      {entries.length > 0 || adding ? (
        <Text style={styles.section} accessibilityRole="header">
          {t.cardio.title}
        </Text>
      ) : null}
      {entries.map((entry) =>
        editingId === entry.id ? (
          <EditCardio key={entry.id} entry={entry} onDone={() => setEditingId(null)} />
        ) : (
          <CardioLine key={entry.id} entry={entry} onPress={() => setEditingId(entry.id)} />
        ),
      )}
      {adding ? (
        <Card>
          <CardioForm
            last={last}
            initial={emptyCardio()}
            submitLabel={t.cardio.save}
            onSubmit={(values) => {
              addCardio(db, owner, workoutId, values);
              setLast(null);
            }}
            onCancel={() => setLast(null)}
          />
        </Card>
      ) : (
        <Button variant="secondary" label={t.cardio.add} onPress={() => setLast(lastCardioByMachine(db, owner))} />
      )}
    </>
  );
}

function CardioLine({ entry, onPress }: { entry: CardioRow; onPress: () => void }) {
  const values = toCardioValues(entry);
  const summary = cardioSummary(values);
  return (
    <Card onPress={onPress} accessibilityLabel={format(t.cardio.edit, { summary })}>
      <View style={styles.line}>
        <Ionicons name="bicycle-outline" size={22} color={colors.primary} />
        <View style={styles.flex}>
          <Text style={styles.lineText}>{summary}</Text>
          {values.notes ? <Text style={styles.meta}>{values.notes}</Text> : null}
        </View>
        <Ionicons name="pencil-outline" size={18} color={colors.primary} />
      </View>
    </Card>
  );
}

function EditCardio({ entry, onDone }: { entry: CardioRow; onDone: () => void }) {
  const { db } = useDatabase();
  const values = toCardioValues(entry);

  function confirmDelete() {
    Alert.alert(t.cardio.deleteConfirmTitle, t.cardio.deleteConfirmBody, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.cardio.delete,
        style: 'destructive',
        onPress: () => {
          deleteCardio(db, entry.id);
          onDone();
        },
      },
    ]);
  }

  return (
    <Card>
      <CardioForm
        last={null}
        initial={{ ...inputFromCardio(values), notes: values.notes ?? '' }}
        submitLabel={t.cardio.saveChanges}
        onSubmit={(next) => {
          updateCardio(db, entry.id, next);
          onDone();
        }}
        onCancel={onDone}
        onDelete={confirmDelete}
      />
    </Card>
  );
}

/**
 * Campos de un bloque de cardio. Al elegir el aparato se llenan con los valores de la
 * última vez que se usó (CAR-01). La duración se escribe o se toma con el cronómetro (CAR-02).
 */
function CardioForm({
  last,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  onDelete,
}: {
  /** Últimos valores por aparato; vacío al corregir un bloque que ya existe. */
  last: Map<CardioMachine, CardioValues> | null;
  initial: CardioInput;
  submitLabel: string;
  onSubmit: (values: CardioValues) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const [value, setValue] = useState(initial);
  const [errors, setErrors] = useState<CardioError[]>([]);
  const [prefilled, setPrefilled] = useState(false);
  const set = (patch: Partial<CardioInput>) => {
    setValue((v) => ({ ...v, ...patch }));
    setErrors([]);
  };
  const has = (e: CardioError) => errors.includes(e);

  function chooseMachine(machine: CardioMachine) {
    if (!last) {
      set({ machineType: machine });
      return;
    }
    const previous = last.get(machine);
    setValue({ ...prefillCardio(machine, previous), notes: value.notes });
    setPrefilled(!!previous);
    setErrors([]);
  }

  function submit() {
    const result = validateCardio(value);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    try {
      onSubmit(result.values);
    } catch (error) {
      console.error('No se pudo guardar el cardio', error);
      Alert.alert(t.cardio.saveFailed);
    }
  }

  const machineError = has('machine') ? t.cardio.errors.machine : null;
  const durationError = has('duration') ? t.cardio.errors.duration : null;

  return (
    <View style={styles.form}>
      <ChipGroup
        label={t.cardio.machine}
        options={CARDIO_MACHINES}
        value={value.machineType}
        labelFor={(m) => t.cardio.machines[m]}
        onChange={chooseMachine}
      />
      {machineError ? <Text style={styles.error}>{machineError}</Text> : null}
      {last && !value.machineType ? <Text style={styles.meta}>{t.cardio.chooseMachine}</Text> : null}
      {prefilled ? <Text style={styles.meta}>{t.cardio.prefilled}</Text> : null}

      {value.machineType ? (
        <>
          <Text style={styles.label}>{t.cardio.duration}</Text>
          <View style={styles.row}>
            <View style={styles.flex}>
              <TextField
                label={t.cardio.minutes}
                value={value.minutes}
                onChangeText={(minutes) => set({ minutes: minutes.replace(/[^0-9]/g, '') })}
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>
            <View style={styles.flex}>
              <TextField
                label={t.cardio.seconds}
                value={value.seconds}
                onChangeText={(seconds) => set({ seconds: seconds.replace(/[^0-9]/g, '') })}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
          </View>
          {durationError ? <Text style={styles.error}>{durationError}</Text> : null}

          <StopwatchPanel onUse={(fields) => set(fields)} />

          <View style={styles.row}>
            <View style={styles.flex}>
              <TextField
                label={t.cardio.level}
                value={value.level}
                onChangeText={(level) => set({ level })}
                keyboardType="decimal-pad"
                maxLength={6}
                error={has('level') ? t.cardio.errors.level : null}
              />
            </View>
            <View style={styles.flex}>
              <TextField
                label={t.cardio.speed}
                value={value.speed}
                onChangeText={(speed) => set({ speed })}
                keyboardType="decimal-pad"
                maxLength={6}
                error={has('speed') ? t.cardio.errors.speed : null}
              />
            </View>
          </View>
          <Text style={styles.meta}>{t.cardio.optionalHint}</Text>
          <View style={styles.row}>
            <View style={styles.flex}>
              <TextField
                label={t.cardio.distance}
                value={value.distanceKm}
                onChangeText={(distanceKm) => set({ distanceKm })}
                keyboardType="decimal-pad"
                maxLength={7}
                error={has('distance') ? t.cardio.errors.distance : null}
              />
            </View>
            <View style={styles.flex}>
              <TextField
                label={t.cardio.incline}
                value={value.incline}
                onChangeText={(incline) => set({ incline })}
                keyboardType="decimal-pad"
                maxLength={5}
                error={has('incline') ? t.cardio.errors.incline : null}
              />
            </View>
          </View>
          <TextField
            label={t.cardio.notes}
            placeholder={t.cardio.notesPlaceholder}
            value={value.notes}
            onChangeText={(notes) => set({ notes })}
            maxLength={300}
            multiline
          />
        </>
      ) : null}

      <Button label={submitLabel} onPress={submit} />
      <View style={styles.row}>
        <View style={styles.flex}>
          <Button variant="ghost" label={t.cardio.cancel} onPress={onCancel} />
        </View>
        {onDelete ? (
          <View style={styles.flex}>
            <Button variant="ghost" label={t.cardio.delete} onPress={onDelete} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

/** Cronómetro opcional para tomar la duración en lugar de escribirla (CAR-02). */
function StopwatchPanel({ onUse }: { onUse: (fields: { minutes: string; seconds: string }) => void }) {
  const [watch, setWatch] = useState<Stopwatch>(STOPWATCH_ZERO);
  const running = watch.runningSince !== null;
  const now = useNow(running ? 250 : 60_000);
  const time = formatClock(stopwatchMs(watch, now) / 1000);
  const started = running || watch.accumulatedMs > 0;

  return (
    <View style={styles.watch}>
      <View style={styles.watchHeader}>
        <Text style={styles.label}>{t.cardio.stopwatch}</Text>
        <Text style={styles.clock} accessibilityLabel={format(t.cardio.stopwatchA11y, { time })}>
          {time}
        </Text>
      </View>
      {!started ? <Text style={styles.meta}>{t.cardio.stopwatchHelp}</Text> : null}
      <View style={styles.row}>
        <View style={styles.flex}>
          <Button
            variant={running ? 'secondary' : 'primary'}
            label={running ? t.cardio.stopwatchPause : started ? t.cardio.stopwatchResume : t.cardio.stopwatchStart}
            onPress={() => setWatch((w) => (running ? pauseStopwatch(w, Date.now()) : startStopwatch(w, Date.now())))}
          />
        </View>
        {started ? (
          <View style={styles.flex}>
            <Button
              variant="secondary"
              label={t.cardio.stopwatchUse}
              onPress={() => {
                const paused = pauseStopwatch(watch, Date.now());
                setWatch(paused);
                onUse(stopwatchToFields(stopwatchMs(paused, Date.now())));
              }}
            />
          </View>
        ) : null}
      </View>
      {started && !running ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setWatch(STOPWATCH_ZERO)}
          style={({ pressed }) => [styles.reset, pressed && styles.pressed]}>
          <Text style={styles.resetText}>{t.cardio.stopwatchReset}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { fontSize: font.title, fontWeight: '700', color: colors.text },
  line: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  lineText: { fontSize: font.body, fontWeight: '600', color: colors.text },
  flex: { flex: 1 },
  form: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
  label: { fontSize: font.label, color: colors.text, fontWeight: '500' },
  meta: { fontSize: font.small, color: colors.textMuted },
  error: { fontSize: font.small, color: colors.danger },
  watch: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  watchHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  clock: { fontSize: font.heading, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  reset: { minHeight: minTouch, alignItems: 'center', justifyContent: 'center' },
  resetText: { fontSize: font.body, color: colors.primary, fontWeight: '600' },
  pressed: { opacity: 0.6 },
});

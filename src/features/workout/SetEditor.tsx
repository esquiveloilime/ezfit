import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { TrackingType } from '@/domain/exercise';
import { fieldsFor, type SetError, type SetInput, stepValue, type WeightUnit } from '@/domain/workout';
import { format, t } from '@/i18n';
import { Button, IconButton, colors, font, minTouch, radius, spacing } from '@/ui';

type Props = {
  trackingType: TrackingType;
  value: SetInput;
  onChange: (value: SetInput) => void;
  /** Cuánto suben o bajan los botones de más y menos del peso, según la unidad. */
  increments: Record<WeightUnit, number>;
  errors: SetError[];
  submitLabel: string;
  onSubmit: () => void;
  /** Controles extra debajo de los campos (por ejemplo, cancelar o eliminar). */
  footer?: ReactNode;
};

const DURATION_STEP = 5;
const DISTANCE_STEP = 10;

/**
 * Campos de una serie según el tipo de registro del ejercicio (SES-03). Con los valores
 * ya llenos, registrar la serie es un solo toque en el botón principal.
 */
export function SetEditor({ trackingType, value, onChange, increments, errors, submitLabel, onSubmit, footer }: Props) {
  const fields = fieldsFor(trackingType);
  const set = (patch: Partial<SetInput>) => onChange({ ...value, ...patch });
  const other: WeightUnit = value.unit === 'lb' ? 'kg' : 'lb';

  return (
    <View style={styles.container}>
      {fields.weight ? (
        <Stepper
          label={t.workout.weight}
          value={value.weight}
          onChange={(weight) => set({ weight })}
          step={increments[value.unit]}
          decimal
          error={errors.includes('weight')}
          trailing={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={format(t.workout.unitToggle, { unit: t.units[value.unit], other: t.units[other] })}
              onPress={() => set({ unit: other })}
              style={({ pressed }) => [styles.unit, pressed && styles.pressed]}>
              <Text style={styles.unitText}>{t.units[value.unit]}</Text>
            </Pressable>
          }
        />
      ) : null}
      {fields.distance ? (
        <Stepper
          label={t.workout.distance}
          value={value.distance}
          onChange={(distance) => set({ distance })}
          step={DISTANCE_STEP}
          decimal
          error={errors.includes('distance')}
        />
      ) : null}
      {fields.reps ? (
        <Stepper
          label={t.workout.reps}
          value={value.reps}
          onChange={(reps) => set({ reps })}
          step={1}
          error={errors.includes('reps')}
        />
      ) : null}
      {fields.duration ? (
        <Stepper
          label={t.workout.duration}
          value={value.duration}
          onChange={(duration) => set({ duration })}
          step={DURATION_STEP}
          error={errors.includes('duration')}
        />
      ) : null}
      {errors.map((e) => (
        <Text key={e} style={styles.error} accessibilityLiveRegion="polite">
          {t.workout.errors[e]}
        </Text>
      ))}
      <Button label={submitLabel} onPress={onSubmit} />
      {footer}
    </View>
  );
}

function Stepper({
  label,
  value,
  onChange,
  step,
  decimal = false,
  error,
  trailing,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  step: number;
  decimal?: boolean;
  error: boolean;
  trailing?: ReactNode;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <IconButton
        icon="remove"
        outlined
        label={format(t.workout.decrease, { field: label })}
        onPress={() => onChange(stepValue(value, -step))}
      />
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={(v) => onChange(decimal ? v.replace(/[^0-9.,]/g, '') : v.replace(/[^0-9]/g, ''))}
        keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
        selectTextOnFocus
        maxLength={7}
        style={[styles.input, error && styles.inputError]}
      />
      <IconButton
        icon="add"
        outlined
        label={format(t.workout.increase, { field: label })}
        onPress={() => onChange(stepValue(value, step))}
      />
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { width: 72, fontSize: font.label, color: colors.text, fontWeight: '500' },
  input: {
    flex: 1,
    minWidth: 64,
    minHeight: minTouch,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    textAlign: 'center',
    fontSize: font.title,
    fontWeight: '600',
    color: colors.text,
  },
  inputError: { borderColor: colors.danger },
  unit: {
    minWidth: minTouch,
    height: minTouch,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitText: { fontSize: font.body, fontWeight: '700', color: colors.primary },
  pressed: { opacity: 0.7 },
  error: { fontSize: font.small, color: colors.danger },
});

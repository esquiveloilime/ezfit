import { StyleSheet, Text, View } from 'react-native';

import { Chip } from './Chip';
import { colors, font, spacing } from './tokens';

type Props<T extends string | number> = {
  label: string;
  options: readonly T[];
  /** Vacío mientras no se ha elegido ninguna. */
  value: T | null;
  labelFor: (option: T) => string;
  onChange: (option: T) => void;
};

/** Elegir una opción de una lista corta, con botones que se acomodan en varias filas. */
export function ChipGroup<T extends string | number>({ label, options, value, labelFor, onChange }: Props<T>) {
  return (
    <View style={styles.container} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.wrap}>
        {options.map((o) => (
          <Chip key={o} label={labelFor(o)} selected={o === value} onPress={() => onChange(o)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: { fontSize: font.label, color: colors.text, fontWeight: '500' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});

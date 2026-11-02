import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, font, minTouch, radius, spacing } from './tokens';

type Props = { label: string; selected: boolean; onPress: () => void };

/** Opción seleccionable, usada en los filtros. */
export function Chip({ label, selected, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}>
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: minTouch,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  pressed: { opacity: 0.7 },
  label: { fontSize: font.label, color: colors.text },
  labelSelected: { color: colors.onPrimary, fontWeight: '600' },
});

import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { colors, font, minTouch, spacing } from './tokens';

type Props = {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
};

/** Fila con un interruptor de sí o no. Toda la fila se puede tocar. */
export function ToggleRow({ label, description, value, onChange, disabled = false }: Props) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onChange(!value)}
      style={[styles.row, disabled && styles.disabled]}>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ true: colors.primary, false: colors.border }}
        thumbColor={colors.surface}
        accessible={false}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: minTouch, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  text: { flex: 1, gap: 2 },
  label: { fontSize: font.body, color: colors.text },
  description: { fontSize: font.small, color: colors.textMuted },
  disabled: { opacity: 0.5 },
});

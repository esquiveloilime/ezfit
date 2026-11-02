import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { colors, minTouch, radius } from './tokens';

type Props = {
  icon: ComponentProps<typeof Ionicons>['name'];
  /** Texto para lectores de pantalla; viene de src/i18n. */
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'primary' | 'danger' | 'muted';
  /** Con borde, para los botones de más y menos. */
  outlined?: boolean;
};

/** Botón de solo ícono, de al menos 48 puntos (RNF-01). */
export function IconButton({ icon, label, onPress, disabled = false, tone = 'primary', outlined = false }: Props) {
  const color = tone === 'danger' ? colors.danger : tone === 'muted' ? colors.textMuted : colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [styles.button, outlined && styles.outlined, (pressed || disabled) && styles.dim]}>
      <Ionicons name={icon} size={22} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: minTouch, height: minTouch, alignItems: 'center', justifyContent: 'center' },
  outlined: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  dim: { opacity: 0.35 },
});

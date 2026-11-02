import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, font, minTouch, radius, spacing } from './tokens';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  accessibilityHint,
}: Props) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && variant === 'primary' && styles.primaryPressed,
        pressed && variant !== 'primary' && styles.pressed,
        inactive && styles.disabled,
      ]}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.onPrimary : colors.primary} />
      ) : (
        <Text style={[styles.label, labelStyles[variant]]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: minTouch,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.primary },
  primaryPressed: { backgroundColor: colors.primaryPressed },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  danger: { backgroundColor: colors.danger },
  ghost: { backgroundColor: 'transparent' },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.5 },
  label: { fontSize: font.body, fontWeight: '600', textAlign: 'center' },
});

const labelStyles = StyleSheet.create({
  primary: { color: colors.onPrimary },
  secondary: { color: colors.primary },
  danger: { color: colors.onPrimary },
  ghost: { color: colors.primary },
});

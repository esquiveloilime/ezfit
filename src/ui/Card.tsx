import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from './tokens';

type Props = {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
};

export function Card({ children, onPress, accessibilityLabel }: Props) {
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        {children}
      </Pressable>
    );
  }
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  pressed: { opacity: 0.7 },
});

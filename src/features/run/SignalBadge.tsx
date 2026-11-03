import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { SignalQuality } from '@/domain/run';
import { t } from '@/i18n';
import { colors, font, radius, spacing } from '@/ui';

const COLOR: Record<SignalQuality, string> = {
  good: colors.success,
  fair: colors.warning,
  none: colors.danger,
};

/** Indicador de la señal GPS: buena, regular o sin señal (RUN-02). */
export function SignalBadge({ quality }: { quality: SignalQuality }) {
  const color = COLOR[quality];
  return (
    <View
      style={[styles.badge, { borderColor: color }]}
      accessibilityLabel={`${t.run.signal}: ${t.run.signalQuality[quality]}`}>
      <Ionicons name={quality === 'none' ? 'cellular-outline' : 'cellular'} size={18} color={color} />
      <Text style={[styles.text, { color }]}>
        {t.run.signal}: {t.run.signalQuality[quality]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  text: { fontSize: font.small, fontWeight: '600' },
});

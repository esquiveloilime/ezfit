import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDatabase } from '@/db/DatabaseProvider';
import type { ProfileRow } from '@/db/repositories/profile';
import { REST_PRESETS, REST_STEP_SECONDS, remainingSeconds } from '@/domain/restTimer';
import { formatClock } from '@/domain/workout';
import { format, t } from '@/i18n';
import { colors, font, minTouch, radius, spacing } from '@/ui';

import { adjustRest, startRest, stopRest, useRestTick, useRestTimerStore } from './restTimer';

/**
 * Barra fija al pie de la sesión (SES-08): muestra el descanso en curso con más y menos
 * 15 segundos y saltar, o permite iniciarlo a mano con una duración.
 */
export function RestTimerBar({ workoutId, profile }: { workoutId: string; profile: ProfileRow }) {
  const { db } = useDatabase();
  const alert = { sound: profile.restSound, vibration: profile.restVibration };
  const now = useRestTick(db, workoutId, profile.restVibration);
  const timer = useRestTimerStore((s) => s.timer);
  const finishedAt = useRestTimerStore((s) => s.finishedAt);

  let content;
  if (timer) {
    const left = remainingSeconds(timer, now);
    content = (
      <View style={styles.row}>
        <View style={styles.clockBox} accessibilityLiveRegion="polite">
          <Text style={styles.caption}>{t.rest.running}</Text>
          <Text style={styles.clock} accessibilityLabel={format(t.rest.remainingA11y, { time: formatClock(left) })}>
            {formatClock(left)}
          </Text>
        </View>
        <BarButton label={t.rest.minus} a11y={t.rest.minusA11y} onPress={() => adjustRest(db, -REST_STEP_SECONDS, alert)} />
        <BarButton label={t.rest.plus} a11y={t.rest.plusA11y} onPress={() => adjustRest(db, REST_STEP_SECONDS, alert)} />
        <BarButton label={t.rest.skip} a11y={t.rest.skip} onPress={() => stopRest(db)} strong />
      </View>
    );
  } else {
    content = (
      <View style={styles.idle}>
        <Text style={styles.caption} accessibilityLiveRegion="polite">
          {finishedAt !== null ? t.rest.finished : t.rest.manual}
        </Text>
        <View style={styles.row}>
          {REST_PRESETS.map((seconds) => (
            <BarButton
              key={seconds}
              label={formatClock(seconds)}
              a11y={format(t.rest.startA11y, { time: formatClock(seconds) })}
              onPress={() => startRest(db, workoutId, seconds, alert)}
            />
          ))}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.bar, timer && styles.barActive]}>
      {content}
    </SafeAreaView>
  );
}

function BarButton({ label, a11y, onPress, strong = false }: { label: string; a11y: string; onPress: () => void; strong?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      onPress={onPress}
      style={({ pressed }) => [styles.button, strong && styles.buttonStrong, pressed && styles.pressed]}>
      <Text style={[styles.buttonText, strong && styles.buttonTextStrong]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  barActive: { backgroundColor: colors.primarySoft, borderTopColor: colors.primary },
  idle: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  clockBox: { flex: 1 },
  caption: { fontSize: font.small, color: colors.textMuted },
  clock: { fontSize: font.heading, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  button: {
    flex: 1,
    minWidth: minTouch,
    minHeight: minTouch,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonStrong: { backgroundColor: colors.primary },
  buttonText: { fontSize: font.body, fontWeight: '600', color: colors.primary },
  buttonTextStrong: { color: colors.onPrimary },
  pressed: { opacity: 0.7 },
});

import { router, Stack } from 'expo-router';
import { useMemo } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { useDatabase } from '@/db/DatabaseProvider';
import {
  currentPace,
  formatElapsed,
  formatKm,
  formatPace,
  movingMs,
  paceSecondsPerKm,
  signalQuality,
  splitSegments,
} from '@/domain/run';
import { t } from '@/i18n';
import { Button, Card, EmptyState, Screen, colors, font, radius, spacing } from '@/ui';

import { RunMap } from './RunMap';
import { finishRun, pauseRun, resumeRun, useRunStore } from './runStore';
import { SignalBadge } from './SignalBadge';
import { useNow } from './useLocation';

/** Actividad en curso: métricas, ruta en vivo, pausar, reanudar y terminar (RUN-03, RUN-04). */
export function RunLiveView() {
  const { db } = useDatabase();
  const active = useRunStore((s) => s.active);
  const lastFix = useRunStore((s) => s.lastFix);
  const now = useNow(1000);
  const points = active?.points;
  const segments = useMemo(() => splitSegments(points ?? []), [points]);

  if (!active) {
    return (
      <Screen>
        <EmptyState title={t.run.noActiveTitle} body={t.run.noActiveBody} />
        <Button label={t.common.ok} onPress={() => router.back()} />
      </Screen>
    );
  }

  const paused = active.clock.segmentStartedAt === null;
  const seconds = movingMs(active.clock, now) / 1000;
  const last = active.points[active.points.length - 1];
  const follow = last ?? lastFix;

  function confirmFinish() {
    Alert.alert(t.run.finishConfirmTitle, t.run.finishConfirmBody, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.run.finish,
        onPress: () => {
          const runId = finishRun(db);
          if (runId) router.back();
        },
      },
    ]);
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: t.run.kinds[active.kind] }} />
      <RunMap follow={follow} segments={segments} showsUser height={280} />
      <View style={styles.row}>
        <SignalBadge quality={signalQuality(lastFix, now)} />
        {paused ? <Text style={styles.paused}>{t.run.pausedTag}</Text> : null}
      </View>

      <Card>
        <Metric label={t.run.time} value={formatElapsed(seconds)} big />
        <View style={styles.grid}>
          <Metric label={t.run.distance} value={`${formatKm(active.distance)} ${t.run.km}`} />
          <Metric
            label={t.run.currentPace}
            value={`${paused ? formatPace(null) : formatPace(currentPace(active.points, now))} ${t.run.paceUnit}`}
          />
          <Metric
            label={t.run.avgPace}
            value={`${formatPace(paceSecondsPerKm(active.distance, seconds))} ${t.run.paceUnit}`}
          />
        </View>
      </Card>

      {paused ? (
        <Button label={t.run.resume} onPress={() => resumeRun(db)} />
      ) : (
        <Button label={t.run.pause} onPress={() => pauseRun(db)} />
      )}
      <Button variant="secondary" label={t.run.finish} onPress={confirmFinish} />
      <Text style={styles.hint}>{t.run.keepScreenOn}</Text>
    </Screen>
  );
}

function Metric({ label, value, big = false }: { label: string; value: string; big?: boolean }) {
  return (
    <View style={[styles.metric, big && styles.metricBig]} accessibilityLabel={`${label}: ${value}`}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, big && styles.metricValueBig]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  paused: {
    fontSize: font.small,
    fontWeight: '700',
    color: colors.warning,
    backgroundColor: colors.warningSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  metric: { flexGrow: 1, flexBasis: '28%', gap: 2 },
  metricBig: { alignItems: 'center' },
  metricLabel: { fontSize: font.small, color: colors.textMuted },
  metricValue: { fontSize: font.title, fontWeight: '700', color: colors.text },
  metricValueBig: { fontSize: 44 },
  hint: { fontSize: font.small, color: colors.textMuted, textAlign: 'center' },
});

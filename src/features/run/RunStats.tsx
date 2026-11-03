import { StyleSheet, Text, View } from 'react-native';

import type { RunRow } from '@/db/repositories/runs';
import { avgSpeedKmh, formatElapsed, formatKm, formatPace, paceSecondsPerKm } from '@/domain/run';
import { formatTimeOfDay } from '@/domain/workout';
import { format, t } from '@/i18n';
import { Card, colors, font, spacing } from '@/ui';

/** Fecha y hora de una actividad: "lun 3 nov 2026 · 7:15". */
export function formatRunDate(ms: number): string {
  const d = new Date(ms);
  return format(t.dateTime, {
    weekday: t.weekdaysShort[d.getDay()] ?? '',
    day: d.getDate(),
    month: t.monthsShort[d.getMonth()] ?? '',
    year: d.getFullYear(),
    time: formatTimeOfDay(d),
  });
}

/** Métricas del resumen y del detalle (RUN-05, RUN-06): distancia, tiempo, ritmo y velocidad. */
export function RunStats({ run }: { run: RunRow }) {
  const pace = run.avgPaceSecondsPerKm ?? paceSecondsPerKm(run.distanceMeters, run.movingSeconds);
  const speed = avgSpeedKmh(run.distanceMeters, run.movingSeconds);
  return (
    <Card>
      <View style={styles.grid}>
        <Stat label={t.run.distance} value={`${formatKm(run.distanceMeters)} ${t.run.km}`} />
        <Stat label={t.run.time} value={formatElapsed(run.movingSeconds)} />
        <Stat label={t.run.avgPace} value={`${formatPace(pace)} ${t.run.paceUnit}`} />
        <Stat
          label={t.run.avgSpeed}
          value={`${speed === null ? t.run.noSpeed : speed.toFixed(1)} ${t.run.speedUnit}`}
        />
      </View>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat} accessibilityLabel={`${label}: ${value}`}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.md },
  stat: { width: '50%', gap: 2 },
  label: { fontSize: font.small, color: colors.textMuted },
  value: { fontSize: font.title, fontWeight: '700', color: colors.text },
});

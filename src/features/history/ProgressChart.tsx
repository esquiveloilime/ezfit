import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ProgressPoint } from '@/domain/history';
import type { WeightUnit } from '@/domain/workout';
import { formatNumber } from '@/domain/workout';
import { format, t } from '@/i18n';
import { Card, colors, font, spacing } from '@/ui';

const HEIGHT = 140;
const DOT = 8;
const LINE = 2;

function shortDate(ms: number): string {
  const d = new Date(ms);
  return format(t.exerciseHistory.chartDate, { day: d.getDate(), month: t.monthsShort[d.getMonth()] ?? '' });
}

/**
 * Gráfica de líneas del mejor peso por sesión (HIS-05). Se dibuja con vistas simples de
 * React Native, sin librería de gráficas: cada tramo de la línea es una barra delgada girada.
 */
export function ProgressChart({ points, unit }: { points: readonly ProgressPoint[]; unit: WeightUnit }) {
  const [width, setWidth] = useState(0);
  if (points.length === 0) return null;

  const unitLabel = t.units[unit];
  const title = format(t.exerciseHistory.chartTitle, { unit: unitLabel });
  if (points.length === 1) {
    return (
      <Card>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.meta}>{t.exerciseHistory.chartNeedsMore}</Text>
      </Card>
    );
  }

  const weights = points.map((p) => p.weight);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const first = points[0];
  const last = points[points.length - 1];
  const inner = Math.max(0, width - DOT);
  const xy = points.map((p, i) => ({
    x: DOT / 2 + (inner * i) / (points.length - 1),
    // Si todos los pesos son iguales, la línea va a media altura.
    y: max === min ? HEIGHT / 2 : DOT / 2 + (HEIGHT - DOT) * (1 - (p.weight - min) / (max - min)),
  }));

  const summary = format(t.exerciseHistory.chartA11y, {
    n: points.length,
    first: formatNumber(first?.weight ?? 0),
    last: formatNumber(last?.weight ?? 0),
    max: formatNumber(max),
    unit: unitLabel,
  });

  return (
    <Card>
      <Text style={styles.title}>{title}</Text>
      <View accessible accessibilityRole="image" accessibilityLabel={summary} style={styles.body}>
        <View style={styles.axis}>
          <Text style={styles.axisText}>{formatNumber(max)}</Text>
          <Text style={styles.axisText}>{formatNumber(min)}</Text>
        </View>
        <View style={styles.plot} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
          <View style={[styles.grid, { top: DOT / 2 }]} />
          <View style={[styles.grid, { top: HEIGHT - DOT / 2 }]} />
          {width > 0
            ? xy.slice(1).map((b, i) => {
                const a = xy[i];
                if (!a) return null;
                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                return (
                  <View
                    key={`l${i}`}
                    style={[
                      styles.line,
                      {
                        width: length,
                        left: (a.x + b.x) / 2 - length / 2,
                        top: (a.y + b.y) / 2 - LINE / 2,
                        transform: [{ rotate: `${Math.atan2(dy, dx)}rad` }],
                      },
                    ]}
                  />
                );
              })
            : null}
          {width > 0
            ? xy.map((p, i) => <View key={`d${i}`} style={[styles.dot, { left: p.x - DOT / 2, top: p.y - DOT / 2 }]} />)
            : null}
        </View>
      </View>
      <View style={styles.dates} importantForAccessibility="no-hide-descendants">
        <Text style={styles.axisText}>{first ? shortDate(first.startedAt) : ''}</Text>
        <Text style={styles.axisText}>{last ? shortDate(last.startedAt) : ''}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: font.body, fontWeight: '700', color: colors.text },
  meta: { fontSize: font.small, color: colors.textMuted },
  body: { flexDirection: 'row', gap: spacing.sm },
  axis: { height: HEIGHT, justifyContent: 'space-between' },
  axisText: { fontSize: font.small, color: colors.textMuted },
  plot: { flex: 1, height: HEIGHT },
  grid: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: colors.border },
  line: { position: 'absolute', height: LINE, backgroundColor: colors.primary },
  dot: { position: 'absolute', width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: colors.primary },
  dates: { flexDirection: 'row', justifyContent: 'space-between' },
});

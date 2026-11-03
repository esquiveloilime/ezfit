import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { useDatabase } from '@/db/DatabaseProvider';
import { finishedRunsQuery } from '@/db/repositories/runs';
import { useQuery } from '@/db/useQuery';
import { formatElapsed, formatKm, formatPace } from '@/domain/run';
import { format, t } from '@/i18n';
import { Card, EmptyState, colors, font } from '@/ui';

import { formatRunDate } from './RunStats';

/** Lista de actividades con fecha, distancia, tiempo y ritmo (RUN-06). */
export function RunList() {
  const { db, owner } = useDatabase();
  const { data: runs, loaded } = useQuery(finishedRunsQuery(db, owner), [owner]);

  if (!loaded) return null;
  if (runs.length === 0) return <EmptyState title={t.run.emptyListTitle} body={t.run.emptyListBody} />;

  return (
    <>
      {runs.map((run) => {
        const name = run.name ?? t.run.kinds[run.kind];
        return (
          <Card
            key={run.id}
            accessibilityLabel={name}
            onPress={() => router.push({ pathname: '/runs/[id]', params: { id: run.id } })}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.date}>{formatRunDate(run.startedAt)}</Text>
            <Text style={styles.body}>
              {format(t.run.listItem, {
                km: formatKm(run.distanceMeters),
                time: formatElapsed(run.movingSeconds),
                pace: formatPace(run.avgPaceSecondsPerKm),
              })}
            </Text>
          </Card>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: font.body, fontWeight: '700', color: colors.text },
  date: { fontSize: font.small, color: colors.textMuted },
  body: { fontSize: font.body, color: colors.text },
});

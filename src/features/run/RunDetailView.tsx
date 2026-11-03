import { router, Stack } from 'expo-router';
import { useMemo } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import { useDatabase } from '@/db/DatabaseProvider';
import { discardRun, runByIdQuery } from '@/db/repositories/runs';
import { useQuery } from '@/db/useQuery';
import { decodeRoute } from '@/domain/run';
import { t } from '@/i18n';
import { Button, Card, EmptyState, Screen, colors, font } from '@/ui';

import { RunMap } from './RunMap';
import { formatRunDate, RunStats } from './RunStats';

/** Detalle de una actividad guardada: el mismo contenido que el resumen, y eliminar (RUN-06). */
export function RunDetailView({ runId }: { runId: string }) {
  const { db } = useDatabase();
  const { data, loaded } = useQuery(runByIdQuery(db, runId), [runId]);
  const run = data[0];
  const route = run?.route ?? null;
  const segments = useMemo(() => decodeRoute(route), [route]);

  if (!loaded) return <Screen>{null}</Screen>;
  if (!run) {
    return (
      <Screen>
        <EmptyState title={t.run.notFoundTitle} body={t.run.notFoundBody} />
        <Button label={t.common.ok} onPress={() => router.back()} />
      </Screen>
    );
  }

  function confirmDelete() {
    Alert.alert(t.run.deleteConfirmTitle, t.run.deleteConfirmBody, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.run.delete,
        style: 'destructive',
        onPress: () => {
          discardRun(db, runId);
          router.back();
        },
      },
    ]);
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: run.name ?? t.run.detailTitle }} />
      <Text style={styles.date}>
        {t.run.kinds[run.kind]} · {formatRunDate(run.startedAt)}
      </Text>
      <RunMap segments={segments} fitRoute height={260} />
      {segments.length === 0 ? <Text style={styles.hint}>{t.run.noRoute}</Text> : null}
      <RunStats run={run} />
      {run.notes ? (
        <Card>
          <Text style={styles.notesLabel}>{t.run.notes}</Text>
          <Text style={styles.notes}>{run.notes}</Text>
        </Card>
      ) : null}
      <Button variant="ghost" label={t.run.delete} onPress={confirmDelete} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  date: { fontSize: font.small, color: colors.textMuted },
  hint: { fontSize: font.small, color: colors.textMuted },
  notesLabel: { fontSize: font.small, color: colors.textMuted },
  notes: { fontSize: font.body, color: colors.text },
});

import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import { useDatabase } from '@/db/DatabaseProvider';
import { discardRun, runByIdQuery, type RunRow, saveRun } from '@/db/repositories/runs';
import { useQuery } from '@/db/useQuery';
import { dayPart, decodeRoute } from '@/domain/run';
import { t } from '@/i18n';
import { Button, EmptyState, Screen, TextField, colors, font } from '@/ui';

import { RunMap } from './RunMap';
import { formatRunDate, RunStats } from './RunStats';

/** Resumen al terminar: mapa de la ruta completa, métricas, nombre y notas; guardar o descartar (RUN-05). */
export function RunSummaryView({ runId }: { runId: string }) {
  const { db } = useDatabase();
  const { data, loaded } = useQuery(runByIdQuery(db, runId), [runId]);
  const run = data[0];

  if (!loaded) return <Screen>{null}</Screen>;
  if (!run) {
    return (
      <Screen>
        <EmptyState title={t.run.notFoundTitle} body={t.run.notFoundBody} />
        <Button label={t.common.ok} onPress={() => router.back()} />
      </Screen>
    );
  }
  return <Summary run={run} />;
}

function Summary({ run }: { run: RunRow }) {
  const { db } = useDatabase();
  const [segments] = useState(() => decodeRoute(run.route));
  const [name, setName] = useState(
    () => run.name ?? t.run.defaultName[run.kind][dayPart(new Date(run.startedAt))],
  );
  const [notes, setNotes] = useState(run.notes ?? '');

  function save() {
    try {
      const fallback = t.run.defaultName[run.kind][dayPart(new Date(run.startedAt))];
      saveRun(db, run.id, { name: name.trim() || fallback, notes: notes.trim() || null });
      router.back();
    } catch (error) {
      console.error('No se pudo guardar la actividad', error);
      Alert.alert(t.run.saveFailed);
    }
  }

  function confirmDiscard() {
    Alert.alert(t.run.discardConfirmTitle, t.run.discardConfirmBody, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.run.discard,
        style: 'destructive',
        onPress: () => {
          discardRun(db, run.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <Screen>
      <Text style={styles.date}>{formatRunDate(run.startedAt)}</Text>
      <RunMap segments={segments} fitRoute height={260} />
      {segments.length === 0 ? <Text style={styles.hint}>{t.run.noRoute}</Text> : null}
      <RunStats run={run} />
      <TextField label={t.run.name} value={name} onChangeText={setName} maxLength={80} />
      <TextField
        label={t.run.notes}
        placeholder={t.run.notesPlaceholder}
        value={notes}
        onChangeText={setNotes}
        multiline
        maxLength={500}
      />
      <Button label={t.run.save} onPress={save} />
      <Button variant="ghost" label={t.run.discard} onPress={confirmDiscard} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  date: { fontSize: font.small, color: colors.textMuted },
  hint: { fontSize: font.small, color: colors.textMuted },
});

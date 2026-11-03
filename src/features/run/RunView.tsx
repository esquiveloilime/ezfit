import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import { useDatabase } from '@/db/DatabaseProvider';
import { activeRunQuery, discardRun, type RunRow } from '@/db/repositories/runs';
import { useQuery } from '@/db/useQuery';
import { canStartRun, formatElapsed, formatKm, RUN_KINDS, type RunKind, signalQuality } from '@/domain/run';
import { format, t } from '@/i18n';
import { openAppSettings } from '@/services/location';
import { Button, Card, ChipGroup, Screen, colors, font } from '@/ui';

import { RunMap } from './RunMap';
import { beginRun, recoverRun, useRunStore } from './runStore';
import { SignalBadge } from './SignalBadge';
import { useLiveFix, useLocationPermission, useNow } from './useLocation';

/**
 * Sección Correr. Si hay una actividad en curso, lleva a ella; si quedó una sin guardar,
 * ofrece guardarla o descartarla (RUN-08); si no, pide el permiso (RUN-01) y muestra la
 * pantalla previa (RUN-02).
 */
export function RunView() {
  const { db, owner } = useDatabase();
  const active = useRunStore((s) => s.active);
  const { data, loaded } = useQuery(activeRunQuery(db, owner), [owner]);
  const pending = data[0];

  if (active) {
    return (
      <Screen title={t.tabs.run}>
        <Card>
          <Text style={styles.title}>{t.run.inProgressTitle}</Text>
          <Text style={styles.body}>{format(t.run.inProgressBody, { km: formatKm(active.distance) })}</Text>
          <Button label={t.run.backToRun} onPress={() => router.push('/run/live')} />
        </Card>
      </Screen>
    );
  }

  if (!loaded) return <Screen title={t.tabs.run}>{null}</Screen>;
  if (pending) return <PendingRun run={pending} />;
  return <PermissionGate />;
}

/** Actividad que quedó sin guardar: terminada sin guardar, o interrumpida porque la app se cerró (RUN-08). */
function PendingRun({ run }: { run: RunRow }) {
  const { db } = useDatabase();
  const interrupted = run.endedAt === null;

  // Si la app se cerró a media actividad, se cierra con lo que alcanzó a guardarse.
  useEffect(() => {
    if (interrupted) recoverRun(db, run);
  }, [db, run, interrupted]);

  function confirmDiscard() {
    Alert.alert(t.run.discardConfirmTitle, t.run.discardConfirmBody, [
      { text: t.common.cancel, style: 'cancel' },
      { text: t.run.discard, style: 'destructive', onPress: () => discardRun(db, run.id) },
    ]);
  }

  return (
    <Screen title={t.tabs.run}>
      <Card>
        <Text style={styles.title}>{t.run.pendingTitle}</Text>
        <Text style={styles.body}>
          {format(t.run.pendingBody, {
            kind: t.run.kinds[run.kind],
            km: formatKm(run.distanceMeters),
            time: formatElapsed(run.movingSeconds),
          })}
        </Text>
      </Card>
      {!interrupted ? (
        <Button
          label={t.run.saveAndReview}
          onPress={() => router.push({ pathname: '/run/summary', params: { id: run.id } })}
        />
      ) : null}
      <Button variant="ghost" label={t.run.discard} onPress={confirmDiscard} />
    </Screen>
  );
}

function PermissionGate() {
  const { permission, request } = useLocationPermission();

  if (!permission) return <Screen title={t.tabs.run}>{null}</Screen>;

  if (permission.state === 'undetermined') {
    return (
      <Screen title={t.tabs.run}>
        <Card>
          <Text style={styles.title}>{t.run.permissionTitle}</Text>
          <Text style={styles.body}>{t.run.permissionBody}</Text>
          <Text style={styles.hint}>{t.run.permissionPrivacy}</Text>
        </Card>
        <Button label={t.run.permissionAllow} onPress={() => void request()} />
      </Screen>
    );
  }

  if (permission.state === 'denied') {
    return (
      <Screen title={t.tabs.run}>
        <Card>
          <Text style={styles.title}>{t.run.deniedTitle}</Text>
          <Text style={styles.body}>{t.run.deniedBody}</Text>
          <Text style={styles.body}>{t.run.deniedSteps}</Text>
        </Card>
        <Button label={t.run.openSettings} onPress={openAppSettings} />
        {permission.canAskAgain ? (
          <Button variant="secondary" label={t.run.permissionAllow} onPress={() => void request()} />
        ) : null}
      </Screen>
    );
  }

  return <RunPreview />;
}

function RunPreview() {
  const { db, owner } = useDatabase();
  const { fix, servicesOn } = useLiveFix(true);
  const now = useNow();
  const [kind, setKind] = useState<RunKind>('run');
  const [starting, setStarting] = useState(false);
  const quality = signalQuality(fix, now);

  async function start() {
    if (starting) return;
    setStarting(true);
    try {
      await beginRun(db, owner, kind);
      router.push('/run/live');
    } catch (error) {
      console.error('No se pudo iniciar la actividad', error);
      Alert.alert(t.run.startFailed);
    } finally {
      setStarting(false);
    }
  }

  return (
    <Screen title={t.tabs.run}>
      <RunMap follow={fix} showsUser />
      <SignalBadge quality={quality} />
      {!servicesOn ? <Text style={styles.warning}>{t.run.servicesOff}</Text> : null}
      {servicesOn && quality === 'none' ? <Text style={styles.hint}>{t.run.waitingSignal}</Text> : null}
      <ChipGroup
        label={t.run.kindLabel}
        options={RUN_KINDS}
        value={kind}
        labelFor={(k) => t.run.kinds[k]}
        onChange={setKind}
      />
      <Button label={t.run.start} disabled={!canStartRun(quality) || starting} onPress={() => void start()} />
      {/* Mientras no exista el seguimiento con la pantalla apagada (RUN-10), se avisa al iniciar. */}
      <Text style={styles.hint}>{t.run.keepScreenOn}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: font.title, fontWeight: '700', color: colors.text },
  body: { fontSize: font.body, color: colors.text },
  hint: { fontSize: font.small, color: colors.textMuted },
  warning: { fontSize: font.body, color: colors.warning },
});

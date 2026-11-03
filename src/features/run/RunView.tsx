import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { RUN_KINDS, type RunKind, signalQuality } from '@/domain/run';
import { t } from '@/i18n';
import { openAppSettings } from '@/services/location';
import { Button, Card, ChipGroup, Screen, colors, font } from '@/ui';

import { RunMap } from './RunMap';
import { SignalBadge } from './SignalBadge';
import { useLiveFix, useLocationPermission, useNow } from './useLocation';

/** Sección Correr: permiso de ubicación (RUN-01) y pantalla previa (RUN-02). */
export function RunView() {
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
  const { fix, servicesOn } = useLiveFix(true);
  const now = useNow();
  const [kind, setKind] = useState<RunKind>('run');
  const quality = signalQuality(fix, now);

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
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: font.title, fontWeight: '700', color: colors.text },
  body: { fontSize: font.body, color: colors.text },
  hint: { fontSize: font.small, color: colors.textMuted },
  warning: { fontSize: font.body, color: colors.warning },
});

import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatTimeOfDay } from '@/domain/workout';
import { format, t } from '@/i18n';
import { requestSync, usePendingCount, useSyncStore } from '@/sync';
import { Button, Card, colors, font, spacing } from '@/ui';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Estado de la sincronización y botón para sincronizar a mano (SIN-03). Solo con cuenta. */
export function SyncStatusCard() {
  const status = useSyncStore((s) => s.status);
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt);
  const pending = usePendingCount();

  let icon: IconName = 'cloud-done-outline';
  let color: string = colors.success;
  let text: string = t.sync.synced;
  if (status === 'syncing') {
    icon = 'sync-outline';
    color = colors.primary;
    text = t.sync.syncing;
  } else if (status === 'error') {
    icon = 'alert-circle-outline';
    color = colors.danger;
    text = t.sync.error;
  } else if (pending > 0) {
    icon = 'cloud-upload-outline';
    color = colors.warning;
    text = pending === 1 ? t.sync.pendingOne : format(t.sync.pending, { n: pending });
  }

  return (
    <Card>
      <Text style={styles.title}>{t.sync.title}</Text>
      <View style={styles.row} accessibilityLiveRegion="polite">
        <Ionicons name={icon} size={22} color={color} />
        <Text style={[styles.status, { color }]}>{text}</Text>
      </View>
      {status === 'offline' ? <Text style={styles.hint}>{t.sync.offline}</Text> : null}
      {lastSyncedAt !== null ? (
        <Text style={styles.hint}>{format(t.sync.lastSynced, { time: formatTimeOfDay(new Date(lastSyncedAt)) })}</Text>
      ) : null}
      <Button
        variant="secondary"
        label={t.sync.button}
        loading={status === 'syncing'}
        onPress={() => void requestSync()}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: font.title, fontWeight: '600', color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.xs },
  status: { flex: 1, fontSize: font.body, fontWeight: '600' },
  hint: { fontSize: font.small, color: colors.textMuted, marginBottom: spacing.xs },
});

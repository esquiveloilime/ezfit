import { type ReactNode, useEffect, useState } from 'react';
import { ActivityIndicator, AppState, StyleSheet, Text, View } from 'react-native';

import { useDatabase } from '@/db/DatabaseProvider';
import { t } from '@/i18n';
import { onReconnect } from '@/services/network';
import { Button, colors, font, spacing } from '@/ui';

import { hasPulledBefore } from './sqliteLocal';
import { requestSync, setSyncTarget } from './syncStore';

/**
 * Sincroniza solo, con cuenta: al abrir la app, al volver a ella y al recuperar la conexión
 * (SIN-02). La primera vez que se abre la base de una cuenta en este teléfono, espera a bajar
 * sus datos antes de mostrar la app, para no pedir la incorporación a quien ya la hizo en
 * otro teléfono (SIN-04). En modo sin cuenta no se monta.
 */
export function AutoSync({ children }: { children: ReactNode }) {
  const { sqlite, owner } = useDatabase();
  const [restoring, setRestoring] = useState(() => !hasPulledBefore(sqlite));

  useEffect(() => {
    setSyncTarget({ sqlite, owner });
    void requestSync().finally(() => setRestoring(false));
    const stopReconnect = onReconnect(() => void requestSync());
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') void requestSync();
    });
    return () => {
      stopReconnect();
      appState.remove();
      setSyncTarget(null);
    };
  }, [sqlite, owner]);

  if (restoring) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.title}>{t.sync.restoringTitle}</Text>
        <Text style={styles.body}>{t.sync.restoringBody}</Text>
        <Button variant="ghost" label={t.sync.restoringSkip} onPress={() => setRestoring(false)} />
      </View>
    );
  }
  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  title: { fontSize: font.title, fontWeight: '700', color: colors.text, textAlign: 'center' },
  body: { fontSize: font.body, color: colors.textMuted, textAlign: 'center' },
});

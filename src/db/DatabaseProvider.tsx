import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { t } from '@/i18n';
import { colors, EmptyState } from '@/ui';

import { type OpenDatabase, openAppDatabase } from './client';

const DatabaseContext = createContext<OpenDatabase | null>(null);

type Props = { owner: string; children: ReactNode };

/** Abre la base de datos del dueño actual y la comparte con las pantallas. */
export function DatabaseProvider({ owner, children }: Props) {
  // El resultado guarda para qué dueño se abrió; si no coincide con el actual, se está cargando.
  const [state, setState] = useState<
    { owner: string; status: 'ready'; value: OpenDatabase } | { owner: string; status: 'error' } | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    let opened: OpenDatabase | null = null;
    openAppDatabase(owner)
      .then((value) => {
        opened = value;
        if (!cancelled) setState({ owner, status: 'ready', value });
      })
      .catch((error: unknown) => {
        console.error('No se pudo abrir la base de datos', error);
        if (!cancelled) setState({ owner, status: 'error' });
      });
    return () => {
      cancelled = true;
      opened?.sqlite.closeAsync().catch(() => undefined);
    };
  }, [owner]);

  if (state?.owner === owner && state.status === 'error') {
    return (
      <View style={styles.center}>
        <EmptyState title={t.errors.databaseTitle} body={t.errors.databaseBody} />
      </View>
    );
  }
  if (!state || state.owner !== owner || state.status !== 'ready') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }
  return <DatabaseContext.Provider value={state.value}>{children}</DatabaseContext.Provider>;
}

/** Base de datos del usuario actual. Solo se usa dentro de `DatabaseProvider`. */
export function useDatabase(): OpenDatabase {
  const value = useContext(DatabaseContext);
  if (!value) throw new Error('useDatabase se usó fuera de DatabaseProvider');
  return value;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.background },
});

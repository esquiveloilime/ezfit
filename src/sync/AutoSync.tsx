import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useDatabase } from '@/db/DatabaseProvider';
import { onReconnect } from '@/services/network';

import { requestSync, setSyncTarget } from './syncStore';

/**
 * Sincroniza solo, con cuenta: al abrir la app, al volver a ella y al recuperar la conexión
 * (SIN-02). No dibuja nada. En modo sin cuenta no se monta.
 */
export function AutoSync() {
  const { sqlite, owner } = useDatabase();

  useEffect(() => {
    setSyncTarget({ sqlite, owner });
    void requestSync();
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

  return null;
}

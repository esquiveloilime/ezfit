import { addDatabaseChangeListener } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import { useDatabase } from '@/db/DatabaseProvider';
import { SYNCED_TABLES } from '@/db/schema';

import { pendingCount } from './sqliteLocal';

// Espera entre un cambio y el recuento, para no contar en cada serie de una ráfaga.
const DEBOUNCE_MS = 300;

/** Cuántos cambios faltan por subir; se actualiza solo al cambiar la base (SIN-03). */
export function usePendingCount(): number {
  const { sqlite, owner } = useDatabase();
  const [count, setCount] = useState(() => pendingCount(sqlite, owner, SYNCED_TABLES));

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const recount = () => setCount(pendingCount(sqlite, owner, SYNCED_TABLES));
    recount();
    const subscription = addDatabaseChangeListener((event) => {
      if (!(SYNCED_TABLES as readonly string[]).includes(event.tableName)) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(recount, DEBOUNCE_MS);
    });
    return () => {
      subscription.remove();
      if (timer) clearTimeout(timer);
    };
  }, [sqlite, owner]);

  return count;
}

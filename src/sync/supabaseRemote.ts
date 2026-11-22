import type { SupabaseClient } from '@supabase/supabase-js';

import type { Row } from './columns';
import type { Remote } from './engine';

// Único lugar, junto con la autenticación, que habla con las tablas de Supabase
// (plan técnico, sección 3). La seguridad por fila limita todo a los datos del usuario.

export function supabaseRemote(client: SupabaseClient): Remote {
  return {
    async upsert(table, rows) {
      if (rows.length === 0) return;
      const { error } = await client.from(table).upsert(rows, { onConflict: 'id' });
      if (error) throw new Error(`No se pudo subir ${table}: ${error.message}`);
    },

    async profile(userId) {
      const { data, error } = await client.from('profiles').select('*').eq('user_id', userId).maybeSingle<Row>();
      if (error) throw new Error(`No se pudo leer el perfil: ${error.message}`);
      return data ?? null;
    },
  };
}

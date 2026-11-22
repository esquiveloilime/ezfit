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

    async pull(table, userId, after, limit) {
      let query = client.from(table).select('*').eq('user_id', userId);
      if (after) {
        // Después del punto de corte; con la misma fecha, los de id mayor.
        query = query.or(`server_updated_at.gt."${after.at}",and(server_updated_at.eq."${after.at}",id.gt.${after.id})`);
      }
      const { data, error } = await query
        .order('server_updated_at', { ascending: true })
        .order('id', { ascending: true })
        .limit(limit)
        .returns<Row[]>();
      if (error) throw new Error(`No se pudo bajar ${table}: ${error.message}`);
      return data ?? [];
    },
  };
}

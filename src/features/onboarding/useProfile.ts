import { useDatabase } from '@/db/DatabaseProvider';
import { profileQuery, type ProfileRow } from '@/db/repositories/profile';
import { useQuery } from '@/db/useQuery';

/**
 * Ajustes del usuario actual. `loading` mientras se leen; `profile` es nulo si todavía
 * no hizo la incorporación.
 */
export function useProfile(): { loading: boolean; profile: ProfileRow | null } {
  const { db, owner } = useDatabase();
  const { data, loaded } = useQuery(profileQuery(db, owner), [owner]);
  return { loading: !loaded, profile: data[0] ?? null };
}

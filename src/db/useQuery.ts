import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

/**
 * Consulta en vivo de la base de datos: se vuelve a leer cuando cambia la tabla
 * principal de la consulta. A diferencia de `useLiveQuery`, indica con `loaded` si ya
 * terminó la primera lectura (antes de eso `data` viene vacío, aunque haya datos).
 */
export function useQuery<T extends Parameters<typeof useLiveQuery>[0]>(query: T, deps: unknown[] = []) {
  const { data, error, updatedAt } = useLiveQuery(query, deps);
  return { data, error, loaded: updatedAt !== undefined || error !== undefined };
}

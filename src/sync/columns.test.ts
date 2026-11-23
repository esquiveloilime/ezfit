import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

import { SYNCED_TABLES } from '@/db/schema';

import { booleanColumns, LOCAL_ONLY_COLUMN, localColumns, SERVER_ONLY_COLUMN } from './columns';
import { shouldApplyRemote, toLocal, toRemote } from './transform';

/** Columnas de cada tabla según las migraciones de Supabase: las tablas y las columnas agregadas después. */
function remoteColumns(): Map<string, string[]> {
  const dir = join(__dirname, '../../supabase/migrations');
  const out = new Map<string, string[]>();
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
    const sql = readFileSync(join(dir, file), 'utf8');
    for (const match of sql.matchAll(/create table public\.(\w+) \(([\s\S]*?)\n\);/g)) {
      const columns = match[2]!
        .split('\n')
        .map((line) => line.trim().match(/^([a-z_]+) /)?.[1])
        .filter((c): c is string => Boolean(c));
      out.set(match[1]!, columns);
    }
    for (const match of sql.matchAll(/alter table public\.(\w+) add column (\w+) /g)) {
      out.get(match[1]!)?.push(match[2]!);
    }
  }
  return out;
}

describe('columnas', () => {
  it('cada tabla sincronizada tiene las mismas columnas en SQLite y en Supabase', () => {
    const remote = remoteColumns();
    for (const table of SYNCED_TABLES) {
      const local = localColumns(table).filter((c) => c !== LOCAL_ONLY_COLUMN);
      const server = (remote.get(table) ?? []).filter((c) => c !== SERVER_ONLY_COLUMN);
      expect({ table, columns: [...local].sort() }).toEqual({ table, columns: [...server].sort() });
    }
  });

  it('reconoce los sí/no del esquema', () => {
    expect([...booleanColumns('exercises')].sort()).toEqual(['archived', 'uses_rir', 'uses_technique']);
    expect(booleanColumns('sets').size).toBe(0);
  });
});

describe('toRemote y toLocal', () => {
  it('ida y vuelta conserva el registro y lo deja sincronizado', () => {
    const local = { id: 'e1', archived: 0, uses_rir: 1, name: 'Sentadilla', sync_status: 'pending' };
    const remote = toRemote('exercises', local);
    expect(remote).toEqual({ id: 'e1', archived: false, uses_rir: true, name: 'Sentadilla' });

    const back = toLocal('exercises', { ...remote, server_updated_at: '2026-11-22T10:00:00Z' }, [
      'id',
      'archived',
      'uses_rir',
      'name',
      'notes',
      'sync_status',
    ]);
    expect(back).toEqual({ id: 'e1', archived: 0, uses_rir: 1, name: 'Sentadilla', notes: null, sync_status: 'synced' });
  });
});

describe('shouldApplyRemote', () => {
  it('aplica si no existe en el teléfono o si no está pendiente', () => {
    expect(shouldApplyRemote(null, { updated_at: 1 })).toBe(true);
    expect(shouldApplyRemote({ updated_at: 9, sync_status: 'synced' }, { updated_at: 1 })).toBe(true);
  });

  it('un pendiente del teléfono solo se reemplaza por una versión más reciente', () => {
    expect(shouldApplyRemote({ updated_at: 5, sync_status: 'pending' }, { updated_at: 4 })).toBe(false);
    expect(shouldApplyRemote({ updated_at: 5, sync_status: 'pending' }, { updated_at: 5 })).toBe(false);
    expect(shouldApplyRemote({ updated_at: 5, sync_status: 'pending' }, { updated_at: 6 })).toBe(true);
  });
});

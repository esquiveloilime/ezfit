import { claimStatements, guestSelects, insertOrIgnore, ownerUpdates } from './claim';
import { SYNCED_TABLES } from './schema';

const uid = '11111111-2222-4333-8444-555555555555';

describe('guestSelects (CUE-07)', () => {
  it('lee todas las tablas sincronizadas y los puntos GPS', () => {
    const tables = guestSelects({ copyProfile: true }).map((s) => s.table);
    expect(tables).toEqual([...SYNCED_TABLES, 'run_points']);
  });

  it('solo lee registros del modo sin cuenta, nunca el catálogo', () => {
    for (const s of guestSelects({ copyProfile: true })) {
      expect(s.sql).toContain("user_id = 'local'");
    }
  });

  it('si la cuenta ya tiene ajustes, no lee los del modo sin cuenta (D-03)', () => {
    const tables = guestSelects({ copyProfile: false }).map((s) => s.table);
    expect(tables).not.toContain('profiles');
    expect(tables).toContain('exercises');
  });
});

describe('insertOrIgnore', () => {
  it('inserta la fila completa sin pisar registros existentes', () => {
    expect(insertOrIgnore('sets', { id: 'a', reps: 10, weight: null })).toEqual({
      sql: 'INSERT OR IGNORE INTO "sets" ("id", "reps", "weight") VALUES (?, ?, ?)',
      params: ['a', 10, null],
    });
  });

  it('rechaza nombres de columna extraños', () => {
    expect(() => insertOrIgnore('sets', { 'id; DROP TABLE sets': 'x' })).toThrow();
    expect(() => insertOrIgnore('sets', {})).toThrow();
  });
});

describe('ownerUpdates', () => {
  it('asigna el dueño y marca como pendiente en todas las tablas', () => {
    const updates = ownerUpdates(uid);
    expect(updates).toHaveLength(SYNCED_TABLES.length);
    for (const u of updates) {
      expect(u.sql).toContain("sync_status = 'pending'");
      expect(u.sql).toContain("WHERE user_id = 'local'");
      expect(u.params).toEqual([uid]);
    }
  });
});

describe('claimStatements', () => {
  it('primero copia y después cambia el dueño', () => {
    const statements = claimStatements(uid, [
      { table: 'workouts', rows: [{ id: 'w1', user_id: 'local' }] },
      { table: 'sets', rows: [{ id: 's1', user_id: 'local' }, { id: 's2', user_id: 'local' }] },
    ]);
    expect(statements.slice(0, 3).every((s) => s.sql.startsWith('INSERT'))).toBe(true);
    expect(statements.slice(3).every((s) => s.sql.startsWith('UPDATE'))).toBe(true);
    expect(statements).toHaveLength(3 + SYNCED_TABLES.length);
  });
});

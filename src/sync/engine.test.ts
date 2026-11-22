import type { Row, SyncedTable } from './columns';
import { BATCH_SIZE, type Local, push, type Remote } from './engine';

const USER = '11111111-1111-4111-8111-111111111111';

/** Base del teléfono en memoria. */
class FakeLocal implements Local {
  tables = new Map<SyncedTable, Map<string, Row>>();

  put(table: SyncedTable, row: Row) {
    if (!this.tables.has(table)) this.tables.set(table, new Map());
    this.tables.get(table)!.set(String(row.id), { sync_status: 'pending', user_id: USER, deleted_at: null, ...row });
  }
  get(table: SyncedTable, id: string) {
    return this.tables.get(table)?.get(id) ?? null;
  }
  pending(table: SyncedTable, owner: string): Row[] {
    return [...(this.tables.get(table)?.values() ?? [])]
      .filter((r) => r.user_id === owner && r.sync_status === 'pending')
      .map((r) => ({ ...r }));
  }
  markSynced(table: SyncedTable, rows: readonly { id: string; updatedAt: number }[]) {
    for (const { id, updatedAt } of rows) {
      const row = this.get(table, id);
      if (row && row.updated_at === updatedAt) row.sync_status = 'synced';
    }
  }
  profile(owner: string) {
    return [...(this.tables.get('profiles')?.values() ?? [])].find((r) => r.user_id === owner) ?? null;
  }
  replaceProfile(localId: string, remote: Row) {
    this.tables.get('profiles')!.delete(localId);
    this.put('profiles', { ...remote, sync_status: 'synced' });
  }
  renameProfile(localId: string, remoteId: string) {
    const row = this.get('profiles', localId)!;
    this.tables.get('profiles')!.delete(localId);
    this.put('profiles', { ...row, id: remoteId });
  }
}

/** Supabase en memoria: inserta o actualiza por id, como el `upsert` real. */
class FakeRemote implements Remote {
  tables = new Map<SyncedTable, Map<string, Row>>();
  calls = 0;
  failOnCall: number | null = null;
  onUpsert: (() => void) | null = null;

  async upsert(table: SyncedTable, rows: Row[]) {
    this.calls++;
    if (this.failOnCall === this.calls) throw new Error('sin conexión');
    if (!this.tables.has(table)) this.tables.set(table, new Map());
    for (const row of rows) this.tables.get(table)!.set(String(row.id), row);
    this.onUpsert?.();
  }
  async profile(userId: string) {
    return [...(this.tables.get('profiles')?.values() ?? [])].find((r) => r.user_id === userId) ?? null;
  }
  count(table: SyncedTable) {
    return this.tables.get(table)?.size ?? 0;
  }
}

const workout = (id: string, over: Partial<Row> = {}): Row => ({
  id,
  created_at: 1,
  updated_at: 1,
  routine_id: null,
  started_at: 1,
  ended_at: null,
  status: 'finished',
  mood: null,
  notes: null,
  ...over,
});

describe('push', () => {
  it('sube lo pendiente sin sync_status, con booleanos de verdad, y lo marca como sincronizado', async () => {
    const local = new FakeLocal();
    const remote = new FakeRemote();
    local.put('profiles', { id: 'p1', updated_at: 1, onboarding_completed: 1, rest_sound: 0 });
    local.put('workouts', workout('w1'));

    expect(await push(local, remote, USER)).toBe(2);

    const profile = remote.tables.get('profiles')!.get('p1')!;
    expect(profile.onboarding_completed).toBe(true);
    expect(profile.rest_sound).toBe(false);
    expect('sync_status' in profile).toBe(false);
    expect(local.pending('workouts', USER)).toEqual([]);
  });

  it('no sube lo ya sincronizado ni lo de otro dueño', async () => {
    const local = new FakeLocal();
    const remote = new FakeRemote();
    local.put('workouts', workout('w1', { sync_status: 'synced' }));
    local.put('workouts', workout('w2', { user_id: 'local' }));

    expect(await push(local, remote, USER)).toBe(0);
    expect(remote.count('workouts')).toBe(0);
  });

  it('si falla, lo no confirmado queda pendiente y al reintentar no se duplica', async () => {
    const local = new FakeLocal();
    const remote = new FakeRemote();
    local.put('workouts', workout('w1'));
    local.put('sets', { id: 's1', updated_at: 1, workout_exercise_id: 'we1', position: 0, performed_at: 1 });
    remote.failOnCall = 2; // Las sesiones suben; las series fallan.

    await expect(push(local, remote, USER)).rejects.toThrow('sin conexión');
    expect(local.pending('sets', USER)).toHaveLength(1);

    remote.failOnCall = null;
    await push(local, remote, USER);
    // Volver a subir todo, como si la confirmación anterior se hubiera perdido.
    local.get('workouts', 'w1')!.sync_status = 'pending';
    await push(local, remote, USER);

    expect(remote.count('workouts')).toBe(1);
    expect(remote.count('sets')).toBe(1);
    expect(local.pending('sets', USER)).toEqual([]);
  });

  it('un cambio hecho mientras se subía queda pendiente para la próxima vez', async () => {
    const local = new FakeLocal();
    const remote = new FakeRemote();
    local.put('workouts', workout('w1'));
    remote.onUpsert = () => {
      local.get('workouts', 'w1')!.updated_at = 2;
    };

    await push(local, remote, USER);
    expect(local.pending('workouts', USER)).toHaveLength(1);
  });

  it('sube en tandas cuando hay muchos registros', async () => {
    const local = new FakeLocal();
    const remote = new FakeRemote();
    for (let i = 0; i < BATCH_SIZE + 3; i++) {
      local.put('sets', { id: `s${i}`, updated_at: 1, workout_exercise_id: 'we1', position: i, performed_at: 1 });
    }
    expect(await push(local, remote, USER)).toBe(BATCH_SIZE + 3);
    expect(remote.calls).toBe(2);
  });

  it('del modo sin cuenta a una cuenta nueva: sube todos los registros, sin duplicados', async () => {
    const local = new FakeLocal();
    const remote = new FakeRemote();
    // Así quedan tras el paso a la cuenta: con el dueño nuevo y pendientes (CUE-07).
    local.put('profiles', { id: 'p1', updated_at: 1, onboarding_completed: 1 });
    local.put('workouts', workout('w1'));
    local.put('runs', { id: 'r1', updated_at: 1, kind: 'run', status: 'finished', started_at: 1 });

    await push(local, remote, USER);
    await push(local, remote, USER);

    expect([remote.count('profiles'), remote.count('workouts'), remote.count('runs')]).toEqual([1, 1, 1]);
  });

  describe('perfil', () => {
    it('si la cuenta ya tiene un perfil con la incorporación hecha, se queda el de la cuenta (D-03)', async () => {
      const local = new FakeLocal();
      const remote = new FakeRemote();
      local.put('profiles', { id: 'guest', updated_at: 5, weight_unit: 'kg', onboarding_completed: 1 });
      await remote.upsert('profiles', [{ id: 'acct', user_id: USER, updated_at: 1, weight_unit: 'lb', onboarding_completed: true }]);

      await push(local, remote, USER);

      expect(local.get('profiles', 'guest')).toBeNull();
      expect(local.get('profiles', 'acct')?.weight_unit).toBe('lb');
      expect(remote.count('profiles')).toBe(1);
    });

    it('si el perfil de la cuenta no terminó la incorporación, el del teléfono lo reemplaza', async () => {
      const local = new FakeLocal();
      const remote = new FakeRemote();
      local.put('profiles', { id: 'guest', updated_at: 5, weight_unit: 'kg', onboarding_completed: 1 });
      await remote.upsert('profiles', [{ id: 'acct', user_id: USER, updated_at: 1, onboarding_completed: false }]);

      await push(local, remote, USER);

      const uploaded = remote.tables.get('profiles')!;
      expect(uploaded.size).toBe(1);
      expect(uploaded.get('acct')?.weight_unit).toBe('kg');
    });
  });
});

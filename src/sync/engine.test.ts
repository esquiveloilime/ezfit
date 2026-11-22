import type { Row, SyncedTable } from './columns';
import { BATCH_SIZE, type Cursor, type Local, pull, push, type Remote, sync } from './engine';

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
  cursors = new Map<SyncedTable, Cursor>();
  cursor(table: SyncedTable) {
    return this.cursors.get(table) ?? null;
  }
  setCursor(table: SyncedTable, cursor: Cursor) {
    this.cursors.set(table, cursor);
  }
  versions(table: SyncedTable, ids: readonly string[]) {
    const out = new Map<string, { updated_at: number; sync_status: string }>();
    for (const id of ids) {
      const row = this.get(table, id);
      if (row) out.set(id, { updated_at: Number(row.updated_at), sync_status: String(row.sync_status) });
    }
    return out;
  }
  applied = 0;
  apply(table: SyncedTable, rows: readonly Row[]) {
    for (const row of rows) {
      const copy = { ...row };
      delete copy.server_updated_at;
      this.put(table, { ...copy, sync_status: 'synced' });
      this.applied++;
    }
  }
}

/** Supabase en memoria: inserta o actualiza por id, como el `upsert` real. */
class FakeRemote implements Remote {
  tables = new Map<SyncedTable, Map<string, Row>>();
  calls = 0;
  failOnCall: number | null = null;
  onUpsert: (() => void) | null = null;

  /** Reloj del servidor: todo lo de una misma petición queda con la misma fecha, como en Postgres. */
  clock = 0;
  async upsert(table: SyncedTable, rows: Row[]) {
    this.calls++;
    if (this.failOnCall === this.calls) throw new Error('sin conexión');
    if (!this.tables.has(table)) this.tables.set(table, new Map());
    const at = `t${String(++this.clock).padStart(6, '0')}`;
    const stored = this.tables.get(table)!;
    for (const row of rows) {
      // Como la migración 0004: una versión más antigua que la guardada se ignora.
      const old = stored.get(String(row.id));
      if (old && Number(row.updated_at) < Number(old.updated_at)) continue;
      stored.set(String(row.id), { ...row, server_updated_at: at });
    }
    this.onUpsert?.();
  }
  async pull(table: SyncedTable, userId: string, after: Cursor | null, limit: number) {
    const key = (r: Row) => `${String(r.server_updated_at)}|${String(r.id)}`;
    const from = after ? `${after.at}|${after.id}` : '';
    return [...(this.tables.get(table)?.values() ?? [])]
      .filter((r) => r.user_id === userId && key(r) > from)
      .sort((a, b) => (key(a) < key(b) ? -1 : 1))
      .slice(0, limit);
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

describe('pull', () => {
  it('un teléfono nuevo recupera todo lo de la cuenta, ya sincronizado (SIN-04)', async () => {
    const phoneA = new FakeLocal();
    const phoneB = new FakeLocal();
    const remote = new FakeRemote();
    phoneA.put('workouts', workout('w1'));
    phoneA.put('runs', { id: 'r1', updated_at: 1, kind: 'run', status: 'finished', started_at: 1, route: 'abc' });
    await sync(phoneA, remote, USER);

    await sync(phoneB, remote, USER);

    expect(phoneB.get('workouts', 'w1')?.sync_status).toBe('synced');
    expect(phoneB.get('runs', 'r1')?.route).toBe('abc');
    expect('server_updated_at' in phoneB.get('runs', 'r1')!).toBe(false);
  });

  it('solo baja los registros de la cuenta', async () => {
    const phone = new FakeLocal();
    const remote = new FakeRemote();
    await remote.upsert('workouts', [{ ...workout('ajeno'), user_id: 'otra-cuenta' }]);

    await pull(phone, remote, USER);
    expect(phone.get('workouts', 'ajeno')).toBeNull();
  });

  it('un pendiente del teléfono no se reemplaza por una versión más antigua del servidor', async () => {
    const phone = new FakeLocal();
    const remote = new FakeRemote();
    await remote.upsert('workouts', [{ ...workout('w1', { updated_at: 5, notes: 'servidor' }), user_id: USER }]);
    phone.put('workouts', workout('w1', { updated_at: 9, notes: 'teléfono' }));

    await pull(phone, remote, USER);
    expect(phone.get('workouts', 'w1')?.notes).toBe('teléfono');
    expect(phone.get('workouts', 'w1')?.sync_status).toBe('pending');
  });

  it('si el mismo registro cambió en dos teléfonos, queda el más reciente en los dos (SIN-05)', async () => {
    const phoneA = new FakeLocal();
    const phoneB = new FakeLocal();
    const remote = new FakeRemote();
    phoneA.put('workouts', workout('w1', { notes: 'original' }));
    await sync(phoneA, remote, USER);
    await sync(phoneB, remote, USER);

    phoneA.put('workouts', workout('w1', { updated_at: 10, notes: 'de A, antes' }));
    phoneB.put('workouts', workout('w1', { updated_at: 20, notes: 'de B, después' }));
    await sync(phoneB, remote, USER);
    await sync(phoneA, remote, USER);
    await sync(phoneB, remote, USER);

    expect(phoneA.get('workouts', 'w1')?.notes).toBe('de B, después');
    expect(phoneB.get('workouts', 'w1')?.notes).toBe('de B, después');
  });

  it('un borrado hecho sin conexión llega al servidor y a otro teléfono', async () => {
    const phoneA = new FakeLocal();
    const phoneB = new FakeLocal();
    const remote = new FakeRemote();
    phoneA.put('routines', { id: 'rt1', updated_at: 1, name: 'Mi rutina', category: 'own' });
    await sync(phoneA, remote, USER);
    await sync(phoneB, remote, USER);

    // Sin conexión: el borrado queda pendiente en el teléfono A.
    phoneA.put('routines', { id: 'rt1', updated_at: 2, name: 'Mi rutina', category: 'own', deleted_at: 2 });
    await sync(phoneA, remote, USER);
    await sync(phoneB, remote, USER);

    expect(remote.tables.get('routines')!.get('rt1')?.deleted_at).toBe(2);
    expect(phoneB.get('routines', 'rt1')?.deleted_at).toBe(2);
  });

  it('la segunda bajada solo trae lo nuevo', async () => {
    const phone = new FakeLocal();
    const remote = new FakeRemote();
    await remote.upsert('workouts', [{ ...workout('w1'), user_id: USER }]);
    await pull(phone, remote, USER);
    phone.applied = 0;

    await remote.upsert('workouts', [{ ...workout('w2'), user_id: USER }]);
    await pull(phone, remote, USER);
    expect(phone.applied).toBe(1);
  });

  it('no se salta registros guardados en el mismo instante aunque sean más que una tanda', async () => {
    const phone = new FakeLocal();
    const remote = new FakeRemote();
    const many = Array.from({ length: BATCH_SIZE * 2 + 1 }, (_, i) => ({
      id: `s${String(i).padStart(4, '0')}`,
      user_id: USER,
      updated_at: 1,
      workout_exercise_id: 'we1',
      position: i,
      performed_at: 1,
    }));
    await remote.upsert('sets', many);

    await pull(phone, remote, USER);
    expect(phone.tables.get('sets')?.size).toBe(BATCH_SIZE * 2 + 1);
  });

  it('del modo sin cuenta a una cuenta con datos: conserva los de los dos lados y los ajustes de la cuenta', async () => {
    const otherPhone = new FakeLocal();
    const remote = new FakeRemote();
    otherPhone.put('profiles', { id: 'acct', updated_at: 1, weight_unit: 'lb', onboarding_completed: 1 });
    otherPhone.put('workouts', workout('de-la-cuenta'));
    await sync(otherPhone, remote, USER);

    // Datos del modo sin cuenta, ya con el dueño nuevo (CUE-07).
    const phone = new FakeLocal();
    phone.put('profiles', { id: 'guest', updated_at: 9, weight_unit: 'kg', onboarding_completed: 1 });
    phone.put('workouts', workout('del-telefono'));
    await sync(phone, remote, USER);

    expect(phone.get('workouts', 'de-la-cuenta')).not.toBeNull();
    expect(phone.get('workouts', 'del-telefono')).not.toBeNull();
    expect(remote.count('workouts')).toBe(2);
    expect(phone.profile(USER)?.weight_unit).toBe('lb');
    expect(remote.count('profiles')).toBe(1);
  });
});

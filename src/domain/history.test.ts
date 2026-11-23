import {
  bestMarks,
  bestWeightProgress,
  groupExerciseHistory,
  historyMachines,
  type MarkRun,
  mergeHistory,
  monthOf,
  monthRange,
  sameMonth,
  shiftMonth,
} from './history';

describe('meses (HIS-01)', () => {
  it('el rango va del día 1 al día 1 del mes siguiente', () => {
    const { from, to } = monthRange({ year: 2026, month: 10 });
    expect(new Date(from)).toEqual(new Date(2026, 10, 1));
    expect(new Date(to)).toEqual(new Date(2026, 11, 1));
  });

  it('diciembre termina el 1 de enero del año siguiente', () => {
    expect(new Date(monthRange({ year: 2026, month: 11 }).to)).toEqual(new Date(2027, 0, 1));
  });

  it('cambia de mes cruzando años', () => {
    expect(shiftMonth({ year: 2026, month: 0 }, -1)).toEqual({ year: 2025, month: 11 });
    expect(shiftMonth({ year: 2025, month: 11 }, 1)).toEqual({ year: 2026, month: 0 });
    expect(shiftMonth({ year: 2026, month: 5 }, -14)).toEqual({ year: 2025, month: 3 });
  });

  it('monthOf y sameMonth', () => {
    const m = monthOf(new Date(2026, 10, 22, 18, 30));
    expect(m).toEqual({ year: 2026, month: 10 });
    expect(sameMonth(m, { year: 2026, month: 10 })).toBe(true);
    expect(sameMonth(m, { year: 2025, month: 10 })).toBe(false);
  });
});

describe('mergeHistory (HIS-01)', () => {
  it('junta sesiones y actividades de la más reciente a la más antigua', () => {
    const list = mergeHistory(
      [
        { id: 'w1', startedAt: 100 },
        { id: 'w2', startedAt: 300 },
      ],
      [{ id: 'r1', startedAt: 200 }],
    );
    expect(list.map((e) => `${e.type}:${e.id}`)).toEqual(['workout:w2', 'run:r1', 'workout:w1']);
  });

  it('vacío si no hay nada', () => {
    expect(mergeHistory([], [])).toEqual([]);
  });
});

const run = (id: string, over: Partial<MarkRun>): MarkRun => ({
  id,
  kind: 'run',
  startedAt: 0,
  distanceMeters: 0,
  movingSeconds: 0,
  avgPaceSecondsPerKm: null,
  ...over,
});

describe('bestMarks (RUN-13)', () => {
  const runs = [
    run('largo', { startedAt: 1, distanceMeters: 10000, avgPaceSecondsPerKm: 360 }),
    run('rapido', { startedAt: 2, distanceMeters: 5000, avgPaceSecondsPerKm: 300 }),
    run('corto', { startedAt: 3, distanceMeters: 800, avgPaceSecondsPerKm: 240 }),
    run('caminata', { kind: 'walk', startedAt: 4, distanceMeters: 3000, avgPaceSecondsPerKm: 600 }),
  ];

  it('correr y caminar van por separado', () => {
    const marks = bestMarks(runs);
    expect(marks.run.longest?.id).toBe('largo');
    expect(marks.run.fastest?.id).toBe('rapido');
    expect(marks.walk.longest?.id).toBe('caminata');
    expect(marks.walk.fastest?.id).toBe('caminata');
  });

  it('para el ritmo solo cuentan actividades de al menos 1 km', () => {
    expect(bestMarks(runs).run.fastest?.id).not.toBe('corto');
  });

  it('al eliminar la que tenía la marca, pasa a la siguiente mejor', () => {
    const marks = bestMarks(runs.filter((r) => r.id !== 'rapido' && r.id !== 'largo'));
    expect(marks.run.longest?.id).toBe('corto');
    expect(marks.run.fastest).toBeNull();
  });

  it('sin actividades de un tipo, no hay marca', () => {
    const marks = bestMarks([]);
    expect(marks.run).toEqual({ longest: null, fastest: null });
    expect(marks.walk).toEqual({ longest: null, fastest: null });
  });

  it('en empate gana la más antigua', () => {
    const marks = bestMarks([
      run('nuevo', { startedAt: 9, distanceMeters: 5000, avgPaceSecondsPerKm: 300 }),
      run('viejo', { startedAt: 1, distanceMeters: 5000, avgPaceSecondsPerKm: 300 }),
    ]);
    expect(marks.run.longest?.id).toBe('viejo');
    expect(marks.run.fastest?.id).toBe('viejo');
  });
});

describe('historial por ejercicio (HIS-02)', () => {
  const rows = [
    { workoutId: 'a', startedAt: 100, machine: 'Smith', set: 1 },
    { workoutId: 'a', startedAt: 100, machine: 'Smith', set: 2 },
    { workoutId: 'b', startedAt: 300, machine: 'Hammer', set: 3 },
    { workoutId: 'c', startedAt: 200, machine: null, set: 4 },
  ];

  it('agrupa por sesión, de la más reciente a la más antigua', () => {
    const days = groupExerciseHistory(rows);
    expect(days.map((d) => d.workoutId)).toEqual(['b', 'c', 'a']);
    expect(days[2]?.sets).toEqual([1, 2]);
  });

  it('filtra por máquina sin importar mayúsculas ni espacios', () => {
    const days = groupExerciseHistory(rows, ' smith ');
    expect(days.map((d) => d.workoutId)).toEqual(['a']);
  });

  it('lista las máquinas sin repetir, la más reciente primero', () => {
    expect(
      historyMachines([
        { startedAt: 1, machine: 'smith' },
        { startedAt: 5, machine: 'Hammer' },
        { startedAt: 3, machine: 'Smith ' },
        { startedAt: 4, machine: null },
      ]),
    ).toEqual(['Hammer', 'Smith']);
  });
});

describe('gráfica de progreso (HIS-05)', () => {
  const row = (workoutId: string, startedAt: number, weight: number | null, unit: 'kg' | 'lb' | null, kind: 'working' | 'warmup' = 'working') => ({
    workoutId,
    startedAt,
    kind,
    weight,
    unit,
  });

  it('toma el mejor peso de cada sesión, de la más antigua a la más reciente', () => {
    const points = bestWeightProgress(
      [row('b', 2, 140, 'lb'), row('b', 2, 135, 'lb'), row('a', 1, 130, 'lb'), row('a', 1, 125, 'lb')],
      'lb',
    );
    expect(points).toEqual([
      { workoutId: 'a', startedAt: 1, weight: 130 },
      { workoutId: 'b', startedAt: 2, weight: 140 },
    ]);
  });

  it('convierte a la unidad por defecto para comparar', () => {
    const points = bestWeightProgress([row('a', 1, 60, 'kg'), row('a', 1, 130, 'lb')], 'lb');
    expect(points).toEqual([{ workoutId: 'a', startedAt: 1, weight: 132.3 }]);
  });

  it('ignora calentamientos y series sin peso', () => {
    expect(bestWeightProgress([row('a', 1, 200, 'lb', 'warmup'), row('b', 2, null, null)], 'lb')).toEqual([]);
  });
});

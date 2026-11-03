import {
  canSaveWorkout,
  cleanMachine,
  convertWeight,
  exerciseProgress,
  firstPendingExercise,
  startOfDay,
  fieldsFor,
  formatDuration,
  formatThousands,
  machineSuggestions,
  workoutSummary,
  formatClock,
  formatSet,
  formatTimeOfDay,
  inputFromSet,
  type LoggedSet,
  parseDecimal,
  prefillSet,
  type SetInput,
  setNumbers,
  stepValue,
  summarizeSets,
  validateSet,
} from './workout';

const set = (weight: number | null, unit: 'kg' | 'lb' | null, reps: number | null, extra: Partial<LoggedSet> = {}): LoggedSet => ({
  kind: 'working',
  weight,
  unit,
  reps,
  durationSeconds: null,
  distanceMeters: null,
  rir: null,
  technique: null,
  ...extra,
});

const input = (values: Partial<SetInput>): SetInput => ({
  kind: 'working',
  weight: '',
  unit: 'lb',
  reps: '',
  duration: '',
  distance: '',
  rir: null,
  technique: null,
  ...values,
});

describe('fieldsFor (SES-03)', () => {
  it('pide peso y repeticiones en ejercicios de peso', () => {
    expect(fieldsFor('weight_reps')).toEqual({ weight: true, reps: true, duration: false, distance: false });
  });

  it('en "solo tiempo" pide tiempo y no peso', () => {
    expect(fieldsFor('time')).toEqual({ weight: false, reps: false, duration: true, distance: false });
  });

  it('cubre los demás tipos', () => {
    expect(fieldsFor('reps').reps).toBe(true);
    expect(fieldsFor('weight_time')).toMatchObject({ weight: true, duration: true });
    expect(fieldsFor('distance_time')).toMatchObject({ distance: true, duration: true, weight: false });
  });
});

describe('prefillSet (SES-03)', () => {
  const lastSession = [set(135, 'lb', 10), set(145, 'lb', 8)];

  it('usa la serie equivalente de la última sesión', () => {
    const result = prefillSet({ index: 1, lastSession, today: [set(100, 'kg', 5)], defaultUnit: 'kg' });
    expect(result).toMatchObject({ weight: '145', unit: 'lb', reps: '8' });
  });

  it('si no hay equivalente, usa la serie anterior de hoy con su unidad', () => {
    const result = prefillSet({ index: 2, lastSession, today: [set(60, 'kg', 12), set(62.5, 'kg', 10)], defaultUnit: 'lb' });
    expect(result).toMatchObject({ weight: '62.5', unit: 'kg', reps: '10', kind: 'working' });
  });

  it('si no hay nada, viene vacío con la unidad por defecto', () => {
    expect(prefillSet({ index: 0, lastSession: [], today: [], defaultUnit: 'lb' })).toEqual(input({ unit: 'lb' }));
  });

  it('copia el calentamiento de la última sesión, pero no el de la serie anterior de hoy', () => {
    const warm = set(45, 'lb', 10, { kind: 'warmup' });
    expect(prefillSet({ index: 0, lastSession: [warm], today: [], defaultUnit: 'lb' }).kind).toBe('warmup');
    expect(prefillSet({ index: 1, lastSession: [], today: [warm], defaultUnit: 'lb' }).kind).toBe('working');
  });

  it('una serie sin unidad guardada toma la unidad por defecto', () => {
    const result = prefillSet({ index: 0, lastSession: [set(null, null, 15)], today: [], defaultUnit: 'kg' });
    expect(result).toMatchObject({ unit: 'kg', reps: '15', weight: '' });
  });
});

describe('validateSet', () => {
  it('guarda el peso tal como se escribió, con su unidad y sin convertir', () => {
    expect(validateSet('weight_reps', input({ weight: '22,5', unit: 'kg', reps: '10' }))).toEqual({
      ok: true,
      values: { kind: 'working', weight: 22.5, unit: 'kg', reps: 10, durationSeconds: null, distanceMeters: null, rir: null, technique: null },
    });
  });

  it('acepta peso cero (por ejemplo, la barra sola sin contar)', () => {
    expect(validateSet('weight_reps', input({ weight: '0', reps: '10' })).ok).toBe(true);
  });

  it('rechaza campos vacíos o inválidos', () => {
    expect(validateSet('weight_reps', input({ weight: '', reps: '0' }))).toEqual({ ok: false, errors: ['weight', 'reps'] });
    expect(validateSet('weight_reps', input({ weight: 'abc', reps: '1.5' }))).toEqual({ ok: false, errors: ['weight', 'reps'] });
    expect(validateSet('time', input({ duration: '' }))).toEqual({ ok: false, errors: ['duration'] });
    expect(validateSet('distance_time', input({ distance: '0', duration: '60' }))).toEqual({ ok: false, errors: ['distance'] });
  });

  it('ignora los campos que el ejercicio no pide', () => {
    expect(validateSet('time', input({ weight: '100', reps: '5', duration: '45' }))).toEqual({
      ok: true,
      values: { kind: 'working', weight: null, unit: null, reps: null, durationSeconds: 45, distanceMeters: null, rir: null, technique: null },
    });
  });
});

describe('números y formato', () => {
  it('parseDecimal acepta coma o punto', () => {
    expect(parseDecimal('22,5')).toBe(22.5);
    expect(parseDecimal('.5')).toBe(0.5);
    expect(parseDecimal('10.')).toBe(10);
    expect(parseDecimal('')).toBeNull();
    expect(parseDecimal('-5')).toBeNull();
  });

  it('stepValue suma y resta sin bajar de cero', () => {
    expect(stepValue('135', 5)).toBe('140');
    expect(stepValue('22.5', -2.5)).toBe('20');
    expect(stepValue('2', -5)).toBe('0');
    expect(stepValue('', 5)).toBe('5');
  });

  it('formatClock', () => {
    expect(formatClock(45)).toBe('0:45');
    expect(formatClock(90)).toBe('1:30');
    expect(formatClock(3725)).toBe('1:02:05');
  });

  it('formatTimeOfDay', () => {
    expect(formatTimeOfDay(new Date(2026, 10, 2, 7, 5))).toBe('7:05');
    expect(formatTimeOfDay(new Date(2026, 10, 2, 18, 30))).toBe('18:30');
  });

  it('formatSet muestra cada serie con su unidad', () => {
    expect(formatSet(set(135, 'lb', 10))).toBe('135 lb × 10');
    expect(formatSet(set(60, 'kg', null, { durationSeconds: 45 }))).toBe('60 kg × 0:45');
    expect(formatSet(set(null, null, 12))).toBe('× 12');
    expect(formatSet(set(null, null, null, { durationSeconds: 45 }))).toBe('0:45');
    expect(formatSet(set(null, null, null, { distanceMeters: 400, durationSeconds: 90 }))).toBe('400 m · 1:30');
  });
});

describe('summarizeSets (resumen de la última vez)', () => {
  it('agrupa las series seguidas con el mismo peso', () => {
    expect(summarizeSets([set(135, 'lb', 10), set(135, 'lb', 10), set(135, 'lb', 8)])).toBe('135 lb × 10, 10, 8');
  });

  it('separa pesos y unidades distintos', () => {
    expect(summarizeSets([set(135, 'lb', 10), set(60, 'kg', 8)])).toBe('135 lb × 10 · 60 kg × 8');
  });

  it('sirve para ejercicios sin peso', () => {
    expect(summarizeSets([set(null, null, 12), set(null, null, 10)])).toBe('× 12 · × 10');
    expect(summarizeSets([])).toBe('');
  });
});

describe('setNumbers', () => {
  it('numera solo las series efectivas', () => {
    expect(setNumbers([{ kind: 'warmup' }, { kind: 'working' }, { kind: 'working' }])).toEqual([null, 1, 2]);
  });
});

describe('RIR y técnica (SES-04, SES-05)', () => {
  it('no se precargan aunque la serie de referencia los tenga', () => {
    const last = [set(100, 'lb', 8, { rir: 2, technique: 4 })];
    expect(prefillSet({ index: 0, lastSession: last, today: [], defaultUnit: 'lb' })).toMatchObject({ rir: null, technique: null });
    expect(prefillSet({ index: 1, lastSession: [], today: last, defaultUnit: 'lb' })).toMatchObject({ rir: null, technique: null });
  });

  it('se guardan si están en rango y se ignoran si no', () => {
    const ok = validateSet('weight_reps', input({ weight: '100', reps: '8', rir: 5, technique: 1 }));
    expect(ok).toMatchObject({ ok: true, values: { rir: 5, technique: 1 } });
    const bad = validateSet('weight_reps', input({ weight: '100', reps: '8', rir: 9, technique: 0 }));
    expect(bad).toMatchObject({ ok: true, values: { rir: null, technique: null } });
  });

  it('se conservan al corregir una serie', () => {
    expect(inputFromSet(set(null, null, 10, { rir: 1, technique: 3 }), 'lb')).toMatchObject({ rir: 1, technique: 3, reps: '10' });
  });
});

describe('resumen al terminar (SES-11, AJU-01)', () => {
  it('convierte cada serie a la unidad por defecto antes de sumar el volumen', () => {
    const sets = [
      { ...set(100, 'lb', 10), workoutExerciseId: 'a' },
      { ...set(50, 'kg', 10), workoutExerciseId: 'b' },
    ];
    // 100 × 10 = 1000 lb; 50 kg × 10 = 500 kg = 1102.31 lb → 2102 lb.
    expect(workoutSummary({ sets, defaultUnit: 'lb', startedAt: 0, endedAt: 3600_000 })).toEqual({
      durationSeconds: 3600,
      exercises: 2,
      workingSets: 2,
      warmupSets: 0,
      volume: 2102,
      unit: 'lb',
    });
    // En kg: 1000 lb = 453.59 kg + 500 kg → 954 kg.
    expect(workoutSummary({ sets, defaultUnit: 'kg', startedAt: 0, endedAt: 0 }).volume).toBe(954);
  });

  it('cuenta calentamientos aparte y no suma series sin peso', () => {
    const sets = [
      { ...set(45, 'lb', 10, { kind: 'warmup' }), workoutExerciseId: 'a' },
      { ...set(null, null, 15), workoutExerciseId: 'a' },
      { ...set(null, null, null, { durationSeconds: 60 }), workoutExerciseId: 'b' },
    ];
    expect(workoutSummary({ sets, defaultUnit: 'lb', startedAt: 0, endedAt: 0 })).toMatchObject({
      exercises: 2,
      workingSets: 2,
      warmupSets: 1,
      volume: 450,
    });
  });

  it('convertWeight usa 1 kg = 2.20462 lb', () => {
    expect(convertWeight(10, 'kg', 'lb')).toBeCloseTo(22.0462);
    expect(convertWeight(22.0462, 'lb', 'kg')).toBeCloseTo(10);
    expect(convertWeight(10, 'lb', 'lb')).toBe(10);
  });

  it('una sesión sin series ni cardio no se guarda', () => {
    expect(canSaveWorkout(0, 0)).toBe(false);
    expect(canSaveWorkout(1, 0)).toBe(true);
    expect(canSaveWorkout(0, 1)).toBe(true);
  });

  it('formatos del resumen', () => {
    expect(formatThousands(12345)).toBe('12,345');
    expect(formatThousands(999)).toBe('999');
    expect(formatThousands(1234567.6)).toBe('1,234,568');
    expect(formatDuration(20)).toBe('1 min');
    expect(formatDuration(45 * 60)).toBe('45 min');
    expect(formatDuration(65 * 60)).toBe('1 h 05 min');
  });
});

describe('máquina (SES-06)', () => {
  const history = ['Hammer Strength', 'hammer strength', 'Life Fitness', 'Matrix', ''];

  it('sugiere las anotadas antes, sin repetir y en orden de uso', () => {
    expect(machineSuggestions(history, '')).toEqual(['Hammer Strength', 'Life Fitness', 'Matrix']);
  });

  it('filtra por lo escrito sin importar mayúsculas ni acentos', () => {
    expect(machineSuggestions(history, 'fít')).toEqual(['Life Fitness']);
  });

  it('no sugiere lo que ya está escrito completo', () => {
    expect(machineSuggestions(history, 'matrix')).toEqual([]);
  });

  it('cleanMachine', () => {
    expect(cleanMachine('  Hammer   Strength ')).toBe('Hammer Strength');
    expect(cleanMachine('   ')).toBeNull();
  });
});

describe('ejercicios plegados (SES-02)', () => {
  const w = { kind: 'working' as const };
  const c = { kind: 'warmup' as const };

  it('exerciseProgress cuenta solo las series efectivas contra el objetivo', () => {
    expect(exerciseProgress([c, w, w], 3)).toEqual({ done: 2, target: 3, complete: false });
    expect(exerciseProgress([w, w, w, w], 3)).toEqual({ done: 4, target: 3, complete: true });
    expect(exerciseProgress([w], null)).toEqual({ done: 1, target: null, complete: false });
    expect(exerciseProgress([], 0)).toEqual({ done: 0, target: null, complete: false });
  });

  it('firstPendingExercise abre el primero sin completar', () => {
    expect(
      firstPendingExercise([
        { id: 'a', done: 3, target: 3, complete: true },
        { id: 'b', done: 1, target: 3, complete: false },
        { id: 'c', done: 0, target: 3, complete: false },
      ]),
    ).toBe('b');
  });

  it('firstPendingExercise: sin objetivo, pendiente mientras no tenga series', () => {
    expect(
      firstPendingExercise([
        { id: 'a', done: 2, target: null, complete: false },
        { id: 'b', done: 0, target: null, complete: false },
      ]),
    ).toBe('b');
    expect(firstPendingExercise([{ id: 'a', done: 3, target: 3, complete: true }])).toBeNull();
    expect(firstPendingExercise([])).toBeNull();
  });
});

describe('startOfDay', () => {
  it('devuelve la medianoche local del mismo día', () => {
    const start = startOfDay(new Date(2026, 10, 3, 18, 45, 12));
    expect(start).toBe(new Date(2026, 10, 3, 0, 0, 0, 0).getTime());
    expect(startOfDay(new Date(2026, 10, 3, 0, 0, 0))).toBe(start);
  });
});

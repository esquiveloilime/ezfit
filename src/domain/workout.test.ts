import {
  fieldsFor,
  formatClock,
  formatSet,
  formatTimeOfDay,
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
  ...extra,
});

const input = (values: Partial<SetInput>): SetInput => ({
  kind: 'working',
  weight: '',
  unit: 'lb',
  reps: '',
  duration: '',
  distance: '',
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
      values: { kind: 'working', weight: 22.5, unit: 'kg', reps: 10, durationSeconds: null, distanceMeters: null },
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
      values: { kind: 'working', weight: null, unit: null, reps: null, durationSeconds: 45, distanceMeters: null },
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

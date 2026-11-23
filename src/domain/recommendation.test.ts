import { recommend, repRange } from './recommendation';
import type { LoggedSet } from './workout';

const set = (
  weight: number,
  reps: number,
  extra: Partial<LoggedSet> = {},
): LoggedSet => ({
  kind: 'working',
  weight,
  unit: 'lb',
  reps,
  durationSeconds: null,
  distanceMeters: null,
  rir: null,
  technique: null,
  ...extra,
});

describe('rango de repeticiones', () => {
  it('sin rutina usa 8 a 12', () => {
    expect(repRange(null, null)).toEqual({ min: 8, max: 12 });
  });
  it('si falta un extremo usa el otro', () => {
    expect(repRange(10, null)).toEqual({ min: 10, max: 10 });
    expect(repRange(null, 6)).toEqual({ min: 6, max: 6 });
  });
});

describe('sugerencia de peso (REC-01)', () => {
  it('sin series anteriores no sugiere nada', () => {
    expect(recommend({ lastSets: [] })).toBeNull();
  });

  it('solo con calentamientos o sin peso no sugiere nada', () => {
    expect(recommend({ lastSets: [set(45, 12, { kind: 'warmup' })] })).toBeNull();
    expect(recommend({ lastSets: [set(0, 12, { weight: null, unit: null })] })).toBeNull();
  });

  it('todas al máximo con RIR de 1 o más y buena técnica: sube un incremento', () => {
    const rec = recommend({
      lastSets: [set(135, 12, { rir: 2, technique: 4 }), set(135, 12, { rir: 1, technique: 5 })],
    });
    expect(rec).toMatchObject({ action: 'increase', reason: 'allTop', weight: 140, unit: 'lb', reps: 8 });
  });

  it('usa el rango de la rutina', () => {
    const rec = recommend({ lastSets: [set(100, 8), set(100, 8)], repsMin: 6, repsMax: 8 });
    expect(rec).toMatchObject({ action: 'increase', weight: 105, reps: 6 });
  });

  it('el RIR y la técnica solo cuentan si se registraron', () => {
    expect(recommend({ lastSets: [set(135, 12), set(135, 12)] })?.action).toBe('increase');
  });

  it('sube en la unidad de la última sesión con su incremento', () => {
    const rec = recommend({ lastSets: [set(60, 12, { unit: 'kg' })], increments: { kg: 2.5, lb: 5 } });
    expect(rec).toMatchObject({ action: 'increase', weight: 62.5, unit: 'kg' });
  });

  it('respeta el incremento elegido en Perfil (AJU-03)', () => {
    const rec = recommend({ lastSets: [set(60, 12, { unit: 'kg' })], increments: { kg: 1.25, lb: 5 } });
    expect(rec?.weight).toBe(61.25);
  });

  it('al máximo pero con RIR 0: mantiene e intenta una más', () => {
    const rec = recommend({ lastSets: [set(135, 12, { rir: 0 }), set(135, 12, { rir: 2 })] });
    expect(rec).toMatchObject({ action: 'keep', reason: 'noReserve', weight: 135, reps: 13 });
  });

  it('al máximo pero con técnica promedio de 3: mantiene', () => {
    const rec = recommend({ lastSets: [set(135, 12, { technique: 3 }), set(135, 12, { technique: 3 })] });
    expect(rec).toMatchObject({ action: 'keep', reason: 'technique' });
  });

  it('la mayoría por debajo del mínimo: baja un incremento', () => {
    const rec = recommend({ lastSets: [set(135, 6), set(135, 7), set(135, 9)] });
    expect(rec).toMatchObject({ action: 'decrease', reason: 'belowMin', weight: 130, reps: 8 });
  });

  it('la mitad exacta por debajo del mínimo no es mayoría: mantiene', () => {
    const rec = recommend({ lastSets: [set(135, 6), set(135, 10)] });
    expect(rec).toMatchObject({ action: 'keep', reason: 'notAllTop', weight: 135, reps: 11 });
  });

  it('técnica promedio de 2 o menos: baja aunque las repeticiones salieran', () => {
    const rec = recommend({ lastSets: [set(135, 12, { technique: 2 }), set(135, 12, { technique: 2 })] });
    expect(rec).toMatchObject({ action: 'decrease', reason: 'lowTechnique', weight: 130 });
  });

  it('nunca sugiere un peso negativo', () => {
    expect(recommend({ lastSets: [set(2.5, 3)] })?.weight).toBe(0);
  });

  it('con pesos distintos usa el más alto y sus repeticiones', () => {
    const rec = recommend({ lastSets: [set(115, 10), set(135, 9), set(135, 10)] });
    expect(rec).toMatchObject({ action: 'keep', weight: 135, reps: 11 });
  });

  it('con unidades mezcladas compara convertido y sugiere en la unidad de la serie más pesada', () => {
    const rec = recommend({ lastSets: [set(100, 12, { unit: 'lb' }), set(50, 12, { unit: 'kg' })] });
    expect(rec).toMatchObject({ action: 'increase', unit: 'kg', weight: 52.5 });
  });

  it('las series de calentamiento no cuentan', () => {
    const rec = recommend({ lastSets: [set(45, 5, { kind: 'warmup' }), set(135, 12), set(135, 12)] });
    expect(rec?.action).toBe('increase');
  });
});

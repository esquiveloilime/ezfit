import {
  copyName,
  type DraftItem,
  formatRest,
  formatTarget,
  moveItem,
  validateRoutineDraft,
} from './routine';

const item = (key: string, over: Partial<DraftItem> = {}): DraftItem => ({
  key,
  routineExerciseId: null,
  exerciseId: `ex-${key}`,
  targetSets: '3',
  repsMin: '8',
  repsMax: '12',
  restSeconds: '90',
  ...over,
});

describe('validateRoutineDraft (RUT-03)', () => {
  it('acepta una rutina válida y numera las posiciones', () => {
    const result = validateRoutineDraft({ name: '  Mi   rutina ', items: [item('a'), item('b')] });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.name).toBe('Mi rutina');
    expect(result.items.map((i) => [i.exerciseId, i.position, i.targetSets, i.repsMin, i.repsMax, i.restSeconds])).toEqual([
      ['ex-a', 0, 3, 8, 12, 90],
      ['ex-b', 1, 3, 8, 12, 90],
    ]);
  });

  it('series, repeticiones y descanso son opcionales', () => {
    const result = validateRoutineDraft({
      name: 'R',
      items: [item('a', { targetSets: '', repsMin: '', repsMax: '', restSeconds: '' })],
    });
    expect(result.ok && result.items[0]).toEqual(
      expect.objectContaining({ targetSets: null, repsMin: null, repsMax: null, restSeconds: null }),
    );
  });

  it('con un solo extremo del rango, el rango es ese número', () => {
    const result = validateRoutineDraft({ name: 'R', items: [item('a', { repsMin: '', repsMax: '10' })] });
    expect(result.ok && [result.items[0]!.repsMin, result.items[0]!.repsMax]).toEqual([10, 10]);
  });

  it('pide nombre y al menos un ejercicio', () => {
    expect(validateRoutineDraft({ name: ' ', items: [] })).toEqual({
      ok: false,
      errors: { name: 'required', items: 'empty' },
    });
  });

  it('marca los valores fuera de rango o al revés en cada ejercicio', () => {
    const result = validateRoutineDraft({
      name: 'R',
      items: [
        item('a', { targetSets: '0' }),
        item('b', { repsMin: '12', repsMax: '8' }),
        item('c', { restSeconds: '2000' }),
        item('d', { repsMin: 'diez' }),
        item('e'),
      ],
    });
    expect(result).toEqual({
      ok: false,
      errors: { byItem: { a: ['sets'], b: ['reps_order'], c: ['rest'], d: ['reps'] } },
    });
  });
});

describe('moveItem', () => {
  it('cambia el orden sin modificar la lista original', () => {
    const list = ['a', 'b', 'c', 'd'];
    expect(moveItem(list, 0, 2)).toEqual(['b', 'c', 'a', 'd']);
    expect(moveItem(list, 3, 0)).toEqual(['d', 'a', 'b', 'c']);
    expect(list).toEqual(['a', 'b', 'c', 'd']);
  });

  it('ignora movimientos fuera de la lista', () => {
    expect(moveItem(['a', 'b'], 0, 5)).toEqual(['a', 'b']);
    expect(moveItem(['a', 'b'], -1, 0)).toEqual(['a', 'b']);
  });
});

describe('formatos', () => {
  it('objetivo del ejercicio', () => {
    expect(formatTarget(3, 8, 12)).toBe('3 × 8–12');
    expect(formatTarget(4, 10, 10)).toBe('4 × 10');
    expect(formatTarget(3, null, null)).toBe('3 series');
    expect(formatTarget(1, null, null)).toBe('1 serie');
    expect(formatTarget(null, 8, 12)).toBe('8–12');
    expect(formatTarget(null, null, null)).toBe('');
  });

  it('descanso', () => {
    expect(formatRest(90)).toBe('1:30');
    expect(formatRest(45)).toBe('0:45');
    expect(formatRest(120)).toBe('2:00');
  });

  it('nombre de la copia', () => {
    expect(copyName('Pecho', '(copia)')).toBe('Pecho (copia)');
    expect(copyName('x'.repeat(58), '(copia)')).toHaveLength(60);
  });
});

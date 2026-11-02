import { EQUIPMENT, MUSCLE_GROUPS, normalizeText, TRACKING_TYPES } from '@/domain/exercise';
import { isUuid } from '@/domain/id';

import { CATALOG_EXERCISES, catalogExerciseId } from './exercises';

describe('catálogo de ejercicios (EJE-01)', () => {
  it('tiene al menos 80 ejercicios', () => {
    expect(CATALOG_EXERCISES.length).toBeGreaterThanOrEqual(80);
  });

  it('cada grupo muscular tiene al menos 5 ejercicios', () => {
    for (const group of MUSCLE_GROUPS) {
      const count = CATALOG_EXERCISES.filter((e) => e.muscle === group).length;
      expect(count).toBeGreaterThanOrEqual(5);
    }
  });

  it('los números y los nombres no se repiten', () => {
    const numbers = CATALOG_EXERCISES.map((e) => e.n);
    expect(new Set(numbers).size).toBe(numbers.length);
    const names = CATALOG_EXERCISES.map((e) => normalizeText(e.name));
    expect(new Set(names).size).toBe(names.length);
  });

  it('usa solo valores válidos', () => {
    for (const e of CATALOG_EXERCISES) {
      expect(MUSCLE_GROUPS).toContain(e.muscle);
      expect(EQUIPMENT).toContain(e.equipment);
      expect(TRACKING_TYPES).toContain(e.tracking);
      for (const s of e.secondary) expect(MUSCLE_GROUPS).toContain(s);
      expect(e.secondary).not.toContain(e.muscle);
    }
  });

  it('los identificadores son UUID fijos', () => {
    expect(catalogExerciseId(7)).toBe('c0000000-0000-4000-8000-000000000007');
    for (const e of CATALOG_EXERCISES) expect(isUuid(catalogExerciseId(e.n))).toBe(true);
  });
});

import { isUuid, newId } from './id';

describe('newId', () => {
  it('genera UUID versión 4 válidos', () => {
    for (let i = 0; i < 200; i++) {
      const id = newId();
      expect(isUuid(id)).toBe(true);
      expect(id[14]).toBe('4');
      expect('89ab').toContain(id[19]);
    }
  });

  it('no repite identificadores en 10 000 intentos', () => {
    const ids = new Set(Array.from({ length: 10000 }, () => newId()));
    expect(ids.size).toBe(10000);
  });
});

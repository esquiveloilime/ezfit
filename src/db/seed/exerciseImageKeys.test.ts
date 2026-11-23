import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { CATALOG_IMAGE_KEYS } from './exerciseImageKeys';
import { CATALOG_EXERCISES } from './exercises';

// Fotos de los ejercicios (EJE-05).
const root = join(__dirname, '..', '..', '..');
const folder = join(root, 'assets', 'exercises');
const photos = readdirSync(folder).filter((f) => f.endsWith('.jpg'));
const keys = Object.entries(CATALOG_IMAGE_KEYS);

describe('fotos de los ejercicios (EJE-05)', () => {
  it('al menos 60 ejercicios del catálogo tienen foto', () => {
    expect(keys.length).toBeGreaterThanOrEqual(60);
  });

  it('cada clave es de un ejercicio del catálogo y tiene su foto en assets/exercises', () => {
    const numbers = new Set(CATALOG_EXERCISES.map((e) => e.n));
    for (const [n, key] of keys) {
      expect(numbers.has(Number(n))).toBe(true);
      expect(photos).toContain(`${key}.jpg`);
    }
  });

  it('no se repite la misma foto en dos ejercicios', () => {
    const values = keys.map(([, key]) => key);
    expect(new Set(values).size).toBe(values.length);
  });

  it('cada foto está en el índice de la app y anotada en el archivo de fuente', () => {
    const index = readFileSync(join(root, 'src', 'db', 'exerciseImages.ts'), 'utf8');
    const source = readFileSync(join(folder, 'FUENTE.md'), 'utf8');
    for (const photo of photos) {
      expect(index).toContain(`require('../../assets/exercises/${photo}')`);
      expect(source).toContain(`\`${photo}\``);
    }
    expect(source).toContain('Unlicense');
  });

  it('las fotos pesan menos de 8 MB en total', () => {
    const total = photos.reduce((sum, f) => sum + statSync(join(folder, f)).size, 0);
    expect(total).toBeLessThan(8 * 1024 * 1024);
  });
});

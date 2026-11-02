import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { catalogSql } from './catalogSql';
import { CATALOG_EXERCISES, catalogExerciseId } from './exercises';

describe('catálogo en Supabase', () => {
  it('incluye todos los ejercicios con sus identificadores fijos', () => {
    const sql = catalogSql();
    for (const e of CATALOG_EXERCISES) expect(sql).toContain(catalogExerciseId(e.n));
  });

  it('el archivo de migración está al día (si falla: npm run supabase:catalog)', () => {
    const file = readFileSync(
      join(__dirname, '..', '..', '..', 'supabase', 'migrations', '0002_catalogo.sql'),
      'utf8',
    );
    expect(file.replace(/\r\n/g, '\n')).toBe(catalogSql());
  });
});

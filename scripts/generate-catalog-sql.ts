// Escribe los SQL del catálogo (0002) y de las plantillas (0003) a partir de los datos del teléfono.
// Uso: npm run supabase:catalog (se ejecuta con tsx desde npx; no es dependencia del proyecto).

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { catalogSql, templatesSql } from '../src/db/seed/catalogSql';

const dir = join(process.cwd(), 'supabase', 'migrations');
writeFileSync(join(dir, '0002_catalogo.sql'), catalogSql(), 'utf8');
writeFileSync(join(dir, '0003_plantillas.sql'), templatesSql(), 'utf8');
console.log(`Catálogo y plantillas escritos en ${dir}`);

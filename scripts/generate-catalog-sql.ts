// Escribe supabase/migrations/0002_catalogo.sql a partir del catálogo del teléfono.
// Uso: npm run supabase:catalog (se ejecuta con tsx desde npx; no es dependencia del proyecto).

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { catalogSql } from '../src/db/seed/catalogSql';

const out = join(process.cwd(), 'supabase', 'migrations', '0002_catalogo.sql');
writeFileSync(out, catalogSql(), 'utf8');
console.log(`Catálogo escrito en ${out}`);

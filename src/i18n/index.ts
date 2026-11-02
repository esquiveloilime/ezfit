import { es } from './es';

/** Textos de la interfaz. Hoy solo hay español; el resto de la app solo importa `t`. */
export const t = es;

/**
 * Sustituye marcadores `{nombre}` en un texto.
 * format('Hola, {name}', { name: 'Ana' }) → 'Hola, Ana'
 */
export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

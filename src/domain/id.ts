/**
 * Identificador único (UUID versión 4) generado en el teléfono, para poder crear
 * registros sin conexión (plan técnico, sección 4).
 *
 * Usa Math.random para no agregar una dependencia: con 122 bits aleatorios por
 * registro y los volúmenes de un solo usuario, la probabilidad de repetir uno es
 * despreciable. No se usa para nada relacionado con seguridad.
 */
export function newId(random: () => number = Math.random): string {
  const hex = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      out += '-';
    } else if (i === 14) {
      out += '4';
    } else if (i === 19) {
      out += hex[8 + Math.floor(random() * 4)];
    } else {
      out += hex[Math.floor(random() * 16)];
    }
  }
  return out;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

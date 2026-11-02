import { format } from './index';

describe('format', () => {
  it('sustituye los marcadores', () => {
    expect(format('Hola, {name}. Tienes {n} series.', { name: 'Ana', n: 3 })).toBe(
      'Hola, Ana. Tienes 3 series.',
    );
  });

  it('deja intactos los marcadores sin valor', () => {
    expect(format('Faltan {x}', {})).toBe('Faltan {x}');
  });
});

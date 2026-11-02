import {
  type ExerciseSummary,
  filterExercises,
  isValidVideoUrl,
  normalizeText,
  tutorialUrl,
} from './exercise';

const list: ExerciseSummary[] = [
  { id: '1', name: 'Press de banca con barra', muscleGroup: 'chest', equipment: 'barbell', isCustom: false },
  { id: '2', name: 'Curl de bíceps con mancuernas', muscleGroup: 'biceps', equipment: 'dumbbell', isCustom: false },
  { id: '3', name: 'Press de hombro en máquina', muscleGroup: 'shoulders', equipment: 'machine', isCustom: false },
  { id: '4', name: 'Aperturas en máquina', muscleGroup: 'chest', equipment: 'machine', isCustom: true },
];

const noFilter = { query: '', muscleGroup: null, equipment: null };

describe('normalizeText', () => {
  it('quita acentos, mayúsculas y espacios de más', () => {
    expect(normalizeText('  Bíceps   MÁQUINA  ')).toBe('biceps maquina');
    expect(normalizeText('Pájaros, ñandú')).toBe('pajaros, nandu');
  });
});

describe('filterExercises', () => {
  it('sin filtros devuelve todo en orden alfabético', () => {
    expect(filterExercises(list, noFilter).map((e) => e.id)).toEqual(['4', '2', '1', '3']);
  });

  it('"press" y "PRESS" dan los mismos resultados', () => {
    const lower = filterExercises(list, { ...noFilter, query: 'press' });
    const upper = filterExercises(list, { ...noFilter, query: 'PRESS' });
    expect(lower.map((e) => e.id)).toEqual(['1', '3']);
    expect(upper).toEqual(lower);
  });

  it('"biceps" encuentra "bíceps"', () => {
    expect(filterExercises(list, { ...noFilter, query: 'biceps' }).map((e) => e.id)).toEqual(['2']);
  });

  it('también busca por el grupo muscular principal', () => {
    const labels = {
      chest: 'Pecho',
      back: 'Espalda',
      shoulders: 'Hombro',
      biceps: 'Bíceps',
      triceps: 'Tríceps',
      quads: 'Cuádriceps',
      hamstrings: 'Femoral',
      glutes: 'Glúteo',
      calves: 'Pantorrilla',
      abs: 'Abdomen',
    } as const;
    const withHammer = [
      ...list,
      { id: '5', name: 'Curl martillo', muscleGroup: 'biceps' as const, equipment: 'dumbbell' as const, isCustom: false },
    ];
    expect(filterExercises(withHammer, { ...noFilter, query: 'bice' }, labels).map((e) => e.id)).toEqual(['2', '5']);
    expect(filterExercises(withHammer, { ...noFilter, query: 'PECHO maquina' }, labels).map((e) => e.id)).toEqual(['4']);
    // Sin los nombres de los grupos, solo se busca en el nombre.
    expect(filterExercises(withHammer, { ...noFilter, query: 'pecho' })).toEqual([]);
  });

  it('todas las palabras deben aparecer, en cualquier orden', () => {
    expect(filterExercises(list, { ...noFilter, query: 'maquina press' }).map((e) => e.id)).toEqual(['3']);
  });

  it('combina búsqueda, músculo y equipo', () => {
    expect(filterExercises(list, { query: '', muscleGroup: 'chest', equipment: null }).map((e) => e.id)).toEqual([
      '4',
      '1',
    ]);
    expect(
      filterExercises(list, { query: 'aper', muscleGroup: 'chest', equipment: 'machine' }).map((e) => e.id),
    ).toEqual(['4']);
    expect(filterExercises(list, { query: 'press', muscleGroup: 'chest', equipment: 'machine' })).toEqual([]);
  });
});

describe('tutorialUrl', () => {
  it('usa el enlace propio si existe', () => {
    expect(tutorialUrl({ name: 'Plancha', videoUrl: ' https://youtu.be/abc ' })).toBe('https://youtu.be/abc');
  });

  it('si no hay enlace, busca en YouTube "cómo hacer" más el nombre', () => {
    expect(tutorialUrl({ name: 'Press de banca', videoUrl: null })).toBe(
      'https://www.youtube.com/results?search_query=c%C3%B3mo%20hacer%20Press%20de%20banca',
    );
    expect(tutorialUrl({ name: 'Curl', videoUrl: '   ' })).toContain('search_query=');
  });
});

describe('isValidVideoUrl', () => {
  it('acepta direcciones http y https', () => {
    expect(isValidVideoUrl('https://www.youtube.com/watch?v=abc')).toBe(true);
    expect(isValidVideoUrl('http://youtu.be/abc')).toBe(true);
  });

  it('rechaza lo que no es una dirección web', () => {
    expect(isValidVideoUrl('video de press')).toBe(false);
    expect(isValidVideoUrl('youtube.com/watch')).toBe(false);
    expect(isValidVideoUrl('ftp://servidor.com/x')).toBe(false);
    expect(isValidVideoUrl('https://localhost')).toBe(false);
    expect(isValidVideoUrl('')).toBe(false);
  });
});

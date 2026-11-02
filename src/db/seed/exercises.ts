// Catálogo de ejercicios incluido en la app (EJE-01).
// Cada ejercicio tiene un número fijo que forma su identificador: NUNCA cambies el
// número de un ejercicio existente, porque las rutinas y series lo referencian.
// Para agregar uno nuevo, usa el siguiente número libre y sube CATALOG_VERSION.

import type { Equipment, MuscleGroup, TrackingType } from '@/domain/exercise';

export const CATALOG_VERSION = 1;

export type CatalogExercise = {
  n: number;
  name: string;
  muscle: MuscleGroup;
  secondary: MuscleGroup[];
  equipment: Equipment;
  tracking: TrackingType;
};

/** Identificador fijo de un ejercicio del catálogo (UUID con prefijo `c`). */
export function catalogExerciseId(n: number): string {
  return `c0000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
}

const W: TrackingType = 'weight_reps';
const R: TrackingType = 'reps';

export const CATALOG_EXERCISES: CatalogExercise[] = [
  // Pecho
  { n: 1, name: 'Press de banca con barra', muscle: 'chest', secondary: ['triceps', 'shoulders'], equipment: 'barbell', tracking: W },
  { n: 2, name: 'Press inclinado con barra', muscle: 'chest', secondary: ['shoulders', 'triceps'], equipment: 'barbell', tracking: W },
  { n: 3, name: 'Press de banca con mancuernas', muscle: 'chest', secondary: ['triceps', 'shoulders'], equipment: 'dumbbell', tracking: W },
  { n: 4, name: 'Press inclinado con mancuernas', muscle: 'chest', secondary: ['shoulders', 'triceps'], equipment: 'dumbbell', tracking: W },
  { n: 5, name: 'Aperturas con mancuernas', muscle: 'chest', secondary: ['shoulders'], equipment: 'dumbbell', tracking: W },
  { n: 6, name: 'Press de pecho en máquina', muscle: 'chest', secondary: ['triceps', 'shoulders'], equipment: 'machine', tracking: W },
  { n: 7, name: 'Aperturas en máquina (pec deck)', muscle: 'chest', secondary: ['shoulders'], equipment: 'machine', tracking: W },
  { n: 8, name: 'Cruce de poleas', muscle: 'chest', secondary: ['shoulders'], equipment: 'cable', tracking: W },
  { n: 9, name: 'Lagartijas', muscle: 'chest', secondary: ['triceps', 'shoulders'], equipment: 'bodyweight', tracking: R },
  { n: 10, name: 'Fondos en paralelas', muscle: 'chest', secondary: ['triceps', 'shoulders'], equipment: 'bodyweight', tracking: R },

  // Espalda
  { n: 11, name: 'Dominadas', muscle: 'back', secondary: ['biceps'], equipment: 'bodyweight', tracking: R },
  { n: 12, name: 'Jalón al pecho en polea', muscle: 'back', secondary: ['biceps'], equipment: 'cable', tracking: W },
  { n: 13, name: 'Jalón con agarre cerrado', muscle: 'back', secondary: ['biceps'], equipment: 'cable', tracking: W },
  { n: 14, name: 'Remo con barra', muscle: 'back', secondary: ['biceps', 'shoulders'], equipment: 'barbell', tracking: W },
  { n: 15, name: 'Remo con mancuerna a una mano', muscle: 'back', secondary: ['biceps'], equipment: 'dumbbell', tracking: W },
  { n: 16, name: 'Remo sentado en polea', muscle: 'back', secondary: ['biceps'], equipment: 'cable', tracking: W },
  { n: 17, name: 'Remo en máquina', muscle: 'back', secondary: ['biceps'], equipment: 'machine', tracking: W },
  { n: 18, name: 'Peso muerto', muscle: 'back', secondary: ['hamstrings', 'glutes'], equipment: 'barbell', tracking: W },
  { n: 19, name: 'Pull-over en polea', muscle: 'back', secondary: ['chest'], equipment: 'cable', tracking: W },
  { n: 20, name: 'Hiperextensiones', muscle: 'back', secondary: ['glutes', 'hamstrings'], equipment: 'bodyweight', tracking: R },
  { n: 21, name: 'Encogimientos con mancuernas', muscle: 'back', secondary: ['shoulders'], equipment: 'dumbbell', tracking: W },
  { n: 22, name: 'Paseo del granjero', muscle: 'back', secondary: ['abs'], equipment: 'dumbbell', tracking: 'weight_time' },

  // Hombro
  { n: 23, name: 'Press militar con barra', muscle: 'shoulders', secondary: ['triceps'], equipment: 'barbell', tracking: W },
  { n: 24, name: 'Press de hombro con mancuernas', muscle: 'shoulders', secondary: ['triceps'], equipment: 'dumbbell', tracking: W },
  { n: 25, name: 'Press de hombro en máquina', muscle: 'shoulders', secondary: ['triceps'], equipment: 'machine', tracking: W },
  { n: 26, name: 'Press Arnold', muscle: 'shoulders', secondary: ['triceps'], equipment: 'dumbbell', tracking: W },
  { n: 27, name: 'Elevaciones laterales con mancuernas', muscle: 'shoulders', secondary: [], equipment: 'dumbbell', tracking: W },
  { n: 28, name: 'Elevaciones laterales en polea', muscle: 'shoulders', secondary: [], equipment: 'cable', tracking: W },
  { n: 29, name: 'Elevaciones frontales con mancuernas', muscle: 'shoulders', secondary: ['chest'], equipment: 'dumbbell', tracking: W },
  { n: 30, name: 'Pájaros con mancuernas', muscle: 'shoulders', secondary: ['back'], equipment: 'dumbbell', tracking: W },
  { n: 31, name: 'Aperturas inversas en máquina', muscle: 'shoulders', secondary: ['back'], equipment: 'machine', tracking: W },
  { n: 32, name: 'Face pull en polea', muscle: 'shoulders', secondary: ['back'], equipment: 'cable', tracking: W },
  { n: 33, name: 'Remo al mentón', muscle: 'shoulders', secondary: ['back'], equipment: 'barbell', tracking: W },

  // Bíceps
  { n: 34, name: 'Curl con barra', muscle: 'biceps', secondary: [], equipment: 'barbell', tracking: W },
  { n: 35, name: 'Curl con mancuernas', muscle: 'biceps', secondary: [], equipment: 'dumbbell', tracking: W },
  { n: 36, name: 'Curl martillo', muscle: 'biceps', secondary: [], equipment: 'dumbbell', tracking: W },
  { n: 37, name: 'Curl predicador en máquina', muscle: 'biceps', secondary: [], equipment: 'machine', tracking: W },
  { n: 38, name: 'Curl en polea', muscle: 'biceps', secondary: [], equipment: 'cable', tracking: W },
  { n: 39, name: 'Curl concentrado', muscle: 'biceps', secondary: [], equipment: 'dumbbell', tracking: W },
  { n: 40, name: 'Curl inclinado con mancuernas', muscle: 'biceps', secondary: [], equipment: 'dumbbell', tracking: W },

  // Tríceps
  { n: 41, name: 'Extensión de tríceps en polea con barra', muscle: 'triceps', secondary: [], equipment: 'cable', tracking: W },
  { n: 42, name: 'Extensión de tríceps en polea con cuerda', muscle: 'triceps', secondary: [], equipment: 'cable', tracking: W },
  { n: 43, name: 'Press francés con barra', muscle: 'triceps', secondary: [], equipment: 'barbell', tracking: W },
  { n: 44, name: 'Extensión de tríceps sobre la cabeza con mancuerna', muscle: 'triceps', secondary: [], equipment: 'dumbbell', tracking: W },
  { n: 45, name: 'Fondos en banco', muscle: 'triceps', secondary: ['chest', 'shoulders'], equipment: 'bodyweight', tracking: R },
  { n: 46, name: 'Press de banca con agarre cerrado', muscle: 'triceps', secondary: ['chest'], equipment: 'barbell', tracking: W },
  { n: 47, name: 'Patada de tríceps con mancuerna', muscle: 'triceps', secondary: [], equipment: 'dumbbell', tracking: W },
  { n: 48, name: 'Fondos en máquina', muscle: 'triceps', secondary: ['chest'], equipment: 'machine', tracking: W },

  // Cuádriceps
  { n: 49, name: 'Sentadilla con barra', muscle: 'quads', secondary: ['glutes', 'hamstrings'], equipment: 'barbell', tracking: W },
  { n: 50, name: 'Sentadilla goblet', muscle: 'quads', secondary: ['glutes'], equipment: 'dumbbell', tracking: W },
  { n: 51, name: 'Prensa de piernas', muscle: 'quads', secondary: ['glutes'], equipment: 'machine', tracking: W },
  { n: 52, name: 'Extensión de piernas en máquina', muscle: 'quads', secondary: [], equipment: 'machine', tracking: W },
  { n: 53, name: 'Sentadilla hack en máquina', muscle: 'quads', secondary: ['glutes'], equipment: 'machine', tracking: W },
  { n: 54, name: 'Zancadas con mancuernas', muscle: 'quads', secondary: ['glutes'], equipment: 'dumbbell', tracking: W },
  { n: 55, name: 'Sentadilla búlgara', muscle: 'quads', secondary: ['glutes'], equipment: 'dumbbell', tracking: W },
  { n: 56, name: 'Sentadilla en máquina Smith', muscle: 'quads', secondary: ['glutes'], equipment: 'machine', tracking: W },
  { n: 57, name: 'Empuje de trineo', muscle: 'quads', secondary: ['glutes', 'calves'], equipment: 'other', tracking: 'distance_time' },

  // Femoral
  { n: 58, name: 'Peso muerto rumano con barra', muscle: 'hamstrings', secondary: ['glutes', 'back'], equipment: 'barbell', tracking: W },
  { n: 59, name: 'Peso muerto rumano con mancuernas', muscle: 'hamstrings', secondary: ['glutes', 'back'], equipment: 'dumbbell', tracking: W },
  { n: 60, name: 'Curl femoral acostado en máquina', muscle: 'hamstrings', secondary: [], equipment: 'machine', tracking: W },
  { n: 61, name: 'Curl femoral sentado en máquina', muscle: 'hamstrings', secondary: [], equipment: 'machine', tracking: W },
  { n: 62, name: 'Buenos días con barra', muscle: 'hamstrings', secondary: ['back', 'glutes'], equipment: 'barbell', tracking: W },
  { n: 63, name: 'Curl nórdico', muscle: 'hamstrings', secondary: [], equipment: 'bodyweight', tracking: R },

  // Glúteo
  { n: 64, name: 'Hip thrust con barra', muscle: 'glutes', secondary: ['hamstrings'], equipment: 'barbell', tracking: W },
  { n: 65, name: 'Hip thrust en máquina', muscle: 'glutes', secondary: ['hamstrings'], equipment: 'machine', tracking: W },
  { n: 66, name: 'Puente de glúteo', muscle: 'glutes', secondary: ['hamstrings'], equipment: 'bodyweight', tracking: R },
  { n: 67, name: 'Patada de glúteo en polea', muscle: 'glutes', secondary: ['hamstrings'], equipment: 'cable', tracking: W },
  { n: 68, name: 'Abducción de cadera en máquina', muscle: 'glutes', secondary: [], equipment: 'machine', tracking: W },
  { n: 69, name: 'Subidas al cajón con mancuernas', muscle: 'glutes', secondary: ['quads'], equipment: 'dumbbell', tracking: W },

  // Pantorrilla
  { n: 70, name: 'Elevación de talones de pie en máquina', muscle: 'calves', secondary: [], equipment: 'machine', tracking: W },
  { n: 71, name: 'Elevación de talones sentado en máquina', muscle: 'calves', secondary: [], equipment: 'machine', tracking: W },
  { n: 72, name: 'Elevación de talones en prensa', muscle: 'calves', secondary: [], equipment: 'machine', tracking: W },
  { n: 73, name: 'Elevación de talones con mancuernas', muscle: 'calves', secondary: [], equipment: 'dumbbell', tracking: W },
  { n: 74, name: 'Elevación de talones a una pierna', muscle: 'calves', secondary: [], equipment: 'bodyweight', tracking: R },

  // Abdomen
  { n: 75, name: 'Plancha', muscle: 'abs', secondary: [], equipment: 'bodyweight', tracking: 'time' },
  { n: 76, name: 'Plancha lateral', muscle: 'abs', secondary: [], equipment: 'bodyweight', tracking: 'time' },
  { n: 77, name: 'Abdominales (crunch)', muscle: 'abs', secondary: [], equipment: 'bodyweight', tracking: R },
  { n: 78, name: 'Crunch en polea', muscle: 'abs', secondary: [], equipment: 'cable', tracking: W },
  { n: 79, name: 'Crunch en máquina', muscle: 'abs', secondary: [], equipment: 'machine', tracking: W },
  { n: 80, name: 'Elevación de piernas colgado', muscle: 'abs', secondary: [], equipment: 'bodyweight', tracking: R },
  { n: 81, name: 'Rueda abdominal', muscle: 'abs', secondary: ['shoulders'], equipment: 'other', tracking: R },
  { n: 82, name: 'Giros rusos', muscle: 'abs', secondary: [], equipment: 'bodyweight', tracking: R },
  { n: 83, name: 'Bicho muerto (dead bug)', muscle: 'abs', secondary: [], equipment: 'bodyweight', tracking: R },
];

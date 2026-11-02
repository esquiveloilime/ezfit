// Todos los textos de la interfaz, en español de México (RNF-06).
// Ningún componente escribe textos directamente: los toma de aquí.

import type { Equipment, MuscleGroup, TrackingType } from '@/domain/exercise';

const muscleGroups: Record<MuscleGroup, string> = {
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
};

const equipment: Record<Equipment, string> = {
  barbell: 'Barra',
  dumbbell: 'Mancuernas',
  machine: 'Máquina',
  cable: 'Polea',
  bodyweight: 'Peso corporal',
  other: 'Otro',
};

const trackingTypes: Record<TrackingType, string> = {
  weight_reps: 'Peso y repeticiones',
  reps: 'Solo repeticiones',
  time: 'Solo tiempo',
  weight_time: 'Peso y tiempo',
  distance_time: 'Distancia y tiempo',
};

export const es = {
  appName: 'ezfit',
  common: {
    loading: 'Cargando…',
    ok: 'Entendido',
    cancel: 'Cancelar',
    all: 'Todos',
  },
  tabs: {
    today: 'Hoy',
    routines: 'Rutinas',
    run: 'Correr',
    history: 'Historial',
    profile: 'Perfil',
  },
  placeholders: {
    today: {
      title: 'Hoy',
      body: 'Aquí verás la rutina del día y podrás empezar a entrenar.',
    },
    routines: {
      title: 'Rutinas',
      body: 'Pronto podrás crear tus rutinas y ver las rutinas predeterminadas.',
    },
    run: {
      title: 'Correr',
      body: 'Aquí podrás grabar tus carreras y caminatas con GPS.',
    },
    history: {
      title: 'Historial',
      body: 'Aquí verás tus sesiones, tus actividades y tu progreso por ejercicio.',
    },
    profile: {
      title: 'Perfil',
      body: 'Aquí estarán tus ajustes, tu plan semanal y tu cuenta.',
    },
  },
  errors: {
    databaseTitle: 'No se pudieron cargar tus datos',
    databaseBody: 'Cierra la app por completo y vuelve a abrirla. Si sigue pasando, reinicia el teléfono.',
  },
  exercises: {
    catalogTitle: 'Catálogo de ejercicios',
    catalogEntry: 'Ver los ejercicios disponibles, buscar por nombre y filtrar por músculo o equipo.',
    searchLabel: 'Buscar ejercicio',
    searchPlaceholder: 'Por ejemplo: press, sentadilla, bíceps',
    muscleFilter: 'Músculo',
    equipmentFilter: 'Equipo',
    resultsCount: '{n} ejercicios',
    custom: 'Propio',
    emptyTitle: 'No hay ejercicios con esa búsqueda',
    emptyBody: 'Prueba con otra palabra o quita alguno de los filtros.',
    notFoundTitle: 'Este ejercicio ya no existe',
    notFoundBody: 'Vuelve al catálogo y elige otro.',
    detailTitle: 'Ejercicio',
    mainMuscle: 'Músculo principal',
    secondaryMuscles: 'Músculos secundarios',
    equipmentLabel: 'Equipo',
    trackingLabel: 'Qué se anota en cada serie',
    notesLabel: 'Notas',
    none: 'Ninguno',
    photoMissing: 'Sin foto',
    watchTutorial: 'Ver tutorial',
    watchTutorialHint: 'Abre YouTube con un video de cómo hacer este ejercicio',
    offlineTitle: 'Necesitas internet',
    offlineBody: 'Los videos tutoriales se ven en YouTube. Conéctate a internet e inténtalo de nuevo.',
    openFailedTitle: 'No se pudo abrir el video',
    openFailedBody: 'Revisa que tengas YouTube o un navegador instalado.',
    muscleGroups,
    equipment,
    trackingTypes,
  },
} as const;

export type Strings = typeof es;

// Todos los textos de la interfaz, en español de México (RNF-06).
// Ningún componente escribe textos directamente: los toma de aquí.

export const es = {
  appName: 'ezfit',
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
      body: 'Aquí estarán tus rutinas, las rutinas predeterminadas y el catálogo de ejercicios.',
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
} as const;

export type Strings = typeof es;

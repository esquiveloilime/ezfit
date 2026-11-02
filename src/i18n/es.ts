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
  welcome: {
    tagline: 'Registra tus entrenamientos y tus carreras, aunque no haya señal en el gimnasio.',
    startGuest: 'Empezar sin cuenta',
    startGuestHint: 'Usa la app de inmediato. Tus datos se guardan solo en este teléfono.',
    createAccount: 'Crear cuenta',
    signIn: 'Iniciar sesión',
    guestNote: 'Puedes crear tu cuenta después sin perder nada de lo que registres.',
  },
  auth: {
    signUpTitle: 'Crear cuenta',
    signUpIntro: 'Con una cuenta tus datos se respaldan en la nube y puedes usarlos en otro teléfono.',
    signUpFromGuest: 'Todo lo que registraste sin cuenta pasará a tu cuenta nueva.',
    signInTitle: 'Iniciar sesión',
    signInFromGuest: 'Lo que registraste sin cuenta se agregará a tu cuenta.',
    emailLabel: 'Correo electrónico',
    emailPlaceholder: 'tu@correo.com',
    passwordLabel: 'Contraseña',
    passwordPlaceholder: 'Al menos 8 caracteres',
    showPassword: 'Mostrar contraseña',
    hidePassword: 'Ocultar contraseña',
    signUpButton: 'Crear cuenta',
    signInButton: 'Entrar',
    noAccount: '¿No tienes cuenta? Crear una',
    haveAccount: '¿Ya tienes cuenta? Iniciar sesión',
    invalidEmail: 'Escribe un correo válido, por ejemplo ana@correo.com.',
    shortPassword: 'La contraseña debe tener al menos 8 caracteres.',
    missingPassword: 'Escribe tu contraseña.',
    notConfiguredNote: 'La cuenta todavía no está configurada en esta versión de la app. Mientras tanto puedes usarla sin cuenta.',
    errors: {
      email_taken: 'Ya existe una cuenta con ese correo. Inicia sesión o usa otro correo.',
      invalid_credentials: 'El correo o la contraseña no son correctos. Revísalos e inténtalo de nuevo.',
      weak_password: 'Esa contraseña es muy fácil de adivinar. Usa una más larga o con números y letras.',
      invalid_email: 'Ese correo no es válido. Revisa que esté bien escrito.',
      email_not_confirmed: 'Tu correo todavía no está confirmado. Revisa tu bandeja de entrada.',
      confirm_email: 'Te enviamos un correo para confirmar tu cuenta. Ábrelo y luego inicia sesión aquí.',
      rate_limit: 'Hubo demasiados intentos seguidos. Espera unos minutos e inténtalo de nuevo.',
      network: 'No hay conexión a internet. Conéctate e inténtalo de nuevo; para crear la cuenta o entrar se necesita internet.',
      not_configured: 'La cuenta todavía no está configurada en esta versión de la app. Puedes seguir usándola sin cuenta.',
      claim_failed: 'No se pudieron pasar tus datos a la cuenta. Tus datos siguen en el teléfono; inténtalo de nuevo iniciando sesión.',
      unknown: 'Algo salió mal. Inténtalo de nuevo en un momento.',
    },
  },
  profile: {
    guestTitle: 'Estás usando la app sin cuenta',
    guestWarning: 'Tus datos solo están en este teléfono; si desinstalas la app o cambias de teléfono los perderás.',
    createAccount: 'Crear cuenta',
    signIn: 'Ya tengo cuenta',
    accountTitle: 'Tu cuenta',
    signOut: 'Cerrar sesión',
    signOutConfirmTitle: '¿Cerrar sesión?',
    signOutConfirmBody: 'Para volver a ver tus datos tendrás que iniciar sesión otra vez.',
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

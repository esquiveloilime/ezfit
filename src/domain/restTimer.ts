// Temporizador de descanso (SES-08, SES-10, AJU-02; plan técnico, sección 7).
// Guarda la hora en que termina, no un contador: así el tiempo restante se recalcula al
// volver a la app o al reabrirla. Sin dependencias de React Native.

export type RestTimer = {
  /** Sesión a la que pertenece el descanso. */
  workoutId: string;
  /** Momento en que termina, en milisegundos desde 1970. */
  endsAt: number;
  /** Duración total con la que se inició, más los ajustes. */
  durationSeconds: number;
  /** Notificación local programada para el final, si se pudo programar. */
  notificationId: string | null;
};

/** Paso de los botones de más y menos. */
export const REST_STEP_SECONDS = 15;
/** Duraciones que se ofrecen para iniciarlo a mano. */
export const REST_PRESETS = [60, 90, 120, 180] as const;
/** Límites del descanso por defecto en los ajustes. */
export const REST_DEFAULT_LIMITS = { min: 15, max: 600 } as const;

export function startTimer(workoutId: string, seconds: number, now: number): RestTimer {
  const duration = Math.max(1, Math.round(seconds));
  return { workoutId, endsAt: now + duration * 1000, durationSeconds: duration, notificationId: null };
}

/** Segundos que faltan, redondeados hacia arriba: nunca muestra 0 mientras sigue corriendo. */
export function remainingSeconds(timer: Pick<RestTimer, 'endsAt'>, now: number): number {
  return Math.max(0, Math.ceil((timer.endsAt - now) / 1000));
}

export function isFinished(timer: Pick<RestTimer, 'endsAt'>, now: number): boolean {
  return timer.endsAt <= now;
}

/**
 * Suma o resta segundos al descanso. Si al restar ya no queda tiempo, el descanso se
 * da por saltado (`null`), sin aviso.
 */
export function adjustTimer(timer: RestTimer, deltaSeconds: number, now: number): RestTimer | null {
  const endsAt = timer.endsAt + deltaSeconds * 1000;
  if (endsAt <= now) return null;
  return { ...timer, endsAt, durationSeconds: Math.max(1, timer.durationSeconds + deltaSeconds) };
}

/** Descanso automático: el del ejercicio en la rutina o, si no hay, el del usuario (SES-08). */
export function restSecondsFor(routineRest: number | null | undefined, defaultRest: number): number {
  return routineRest !== null && routineRest !== undefined && routineRest > 0 ? routineRest : defaultRest;
}

/** Nuevo descanso por defecto al tocar más o menos en los ajustes, dentro de los límites. */
export function stepDefaultRest(current: number, delta: number): number {
  return Math.min(REST_DEFAULT_LIMITS.max, Math.max(REST_DEFAULT_LIMITS.min, current + delta));
}

/** Lee el temporizador guardado en el teléfono; si el texto no es válido, no hay temporizador. */
export function parseTimer(json: string | null | undefined): RestTimer | null {
  if (!json) return null;
  try {
    const value = JSON.parse(json) as Partial<RestTimer>;
    if (
      typeof value.workoutId === 'string' &&
      typeof value.endsAt === 'number' &&
      typeof value.durationSeconds === 'number'
    ) {
      return {
        workoutId: value.workoutId,
        endsAt: value.endsAt,
        durationSeconds: value.durationSeconds,
        notificationId: typeof value.notificationId === 'string' ? value.notificationId : null,
      };
    }
    return null;
  } catch {
    return null;
  }
}

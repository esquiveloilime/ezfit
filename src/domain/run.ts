// Reglas de running (RUN-02 a RUN-07; plan técnico, sección 6). Sin dependencias de
// React Native: todo se prueba con recorridos de ejemplo.

export type RunKind = 'run' | 'walk';
export const RUN_KINDS: readonly RunKind[] = ['run', 'walk'];

/** Lectura del GPS tal como llega del teléfono. `accuracy` en metros; `timestamp` en milisegundos. */
export type Fix = { latitude: number; longitude: number; accuracy: number | null; timestamp: number };

// --- Calidad de la señal (RUN-02) ---

export type SignalQuality = 'good' | 'fair' | 'none';

/** Precisión máxima (m) para considerar la señal buena. */
export const SIGNAL_GOOD_METERS = 15;
/** Precisión máxima (m) para considerar la señal regular; peor que esto es "sin señal". */
export const SIGNAL_FAIR_METERS = 40;
/** Una lectura más vieja que esto (ms) ya no cuenta: el GPS dejó de responder. */
export const SIGNAL_STALE_MS = 10_000;

export function signalQuality(fix: Fix | null, now: number): SignalQuality {
  if (!fix || fix.accuracy === null) return 'none';
  if (now - fix.timestamp > SIGNAL_STALE_MS) return 'none';
  if (fix.accuracy <= SIGNAL_GOOD_METERS) return 'good';
  if (fix.accuracy <= SIGNAL_FAIR_METERS) return 'fair';
  return 'none';
}

/** Con buena o regular señal se puede iniciar; sin señal, el botón queda deshabilitado (RUN-02). */
export function canStartRun(quality: SignalQuality): boolean {
  return quality !== 'none';
}

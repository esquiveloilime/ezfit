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

// --- Seguimiento: filtrado de puntos y cálculos (RUN-03, RUN-04, RUN-07) ---

/** Punto aceptado de la ruta. `segment` es el tramo: cada reanudación abre uno nuevo (RUN-04). */
export type RoutePoint = Fix & { segment: number };
export type LatLng = { latitude: number; longitude: number };

/** Precisión peor que esto (m) descarta el punto. */
export const MAX_ACCURACY_METERS = 25;
/** Velocidad imposible para una persona corriendo (m/s) respecto al punto anterior. */
export const MAX_SPEED_MPS = 12;
/** Un punto más cerca que esto (m) del último aceptado no aporta: es ruido del GPS. */
export const MIN_STEP_METERS = 3;
/** Ventana del ritmo actual, para que no salte en cada lectura. */
export const PACE_WINDOW_MS = 30_000;
/** Con menos distancia que esto (m) el ritmo no tiene sentido y no se muestra. */
export const MIN_PACE_METERS = 10;

const EARTH_RADIUS_METERS = 6_371_008.8;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Distancia en metros entre dos coordenadas (fórmula del semiverseno). */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

export type FilterResult = 'accept' | 'inaccurate' | 'too_fast' | 'too_close';

/**
 * Decide si un punto entra a la ruta (plan técnico, sección 6). La velocidad y la distancia
 * mínima solo se comparan con el último punto del mismo tramo.
 */
export function filterPoint(last: RoutePoint | null, candidate: RoutePoint): FilterResult {
  if (candidate.accuracy === null || candidate.accuracy > MAX_ACCURACY_METERS) return 'inaccurate';
  if (!last || last.segment !== candidate.segment) return 'accept';
  const meters = distanceMeters(last, candidate);
  if (meters < MIN_STEP_METERS) return 'too_close';
  const seconds = (candidate.timestamp - last.timestamp) / 1000;
  if (seconds <= 0 || meters / seconds > MAX_SPEED_MPS) return 'too_fast';
  return 'accept';
}

/** Distancia que suma un punto nuevo: cero si abre un tramo (lo de la pausa no cuenta). */
export function stepDistance(last: RoutePoint | null, point: RoutePoint): number {
  return last && last.segment === point.segment ? distanceMeters(last, point) : 0;
}

/** Distancia total: suma entre puntos consecutivos del mismo tramo. */
export function routeDistance(points: readonly RoutePoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += stepDistance(points[i - 1]!, points[i]!);
  return total;
}

/** Puntos agrupados por tramo, para dibujar cada tramo como una línea aparte. */
export function splitSegments(points: readonly RoutePoint[]): LatLng[][] {
  const out: LatLng[][] = [];
  let current: LatLng[] | null = null;
  let segment: number | null = null;
  for (const p of points) {
    if (p.segment !== segment || !current) {
      current = [];
      out.push(current);
      segment = p.segment;
    }
    current.push({ latitude: p.latitude, longitude: p.longitude });
  }
  return out;
}

/** Segundos por kilómetro, o `null` si la distancia es muy corta para calcularlo. */
export function paceSecondsPerKm(meters: number, seconds: number): number | null {
  if (meters < MIN_PACE_METERS || seconds <= 0) return null;
  return seconds / (meters / 1000);
}

/**
 * Ritmo actual: sobre los últimos 30 segundos del tramo en curso. Si el usuario se detiene,
 * dejan de llegar puntos y el ritmo desaparece en lugar de quedarse fijo.
 */
export function currentPace(points: readonly RoutePoint[], now: number): number | null {
  const last = points[points.length - 1];
  if (!last) return null;
  const recent = points.filter((p) => p.segment === last.segment && p.timestamp >= now - PACE_WINDOW_MS);
  const first = recent[0];
  if (!first || recent.length < 2) return null;
  return paceSecondsPerKm(routeDistance(recent), (last.timestamp - first.timestamp) / 1000);
}

// --- Tiempo en movimiento (RUN-03, RUN-04) ---

/**
 * Reloj de la actividad: lo acumulado en tramos cerrados más el tramo en curso. En pausa,
 * `segmentStartedAt` es nulo y el tiempo no avanza.
 */
export type MovingClock = { segment: number; segmentStartedAt: number | null; movingMsBefore: number };

export function startClock(now: number): MovingClock {
  return { segment: 0, segmentStartedAt: now, movingMsBefore: 0 };
}

export function movingMs(clock: MovingClock, now: number): number {
  return clock.movingMsBefore + (clock.segmentStartedAt === null ? 0 : Math.max(0, now - clock.segmentStartedAt));
}

export function pauseClock(clock: MovingClock, now: number): MovingClock {
  if (clock.segmentStartedAt === null) return clock;
  return { ...clock, segmentStartedAt: null, movingMsBefore: movingMs(clock, now) };
}

export function resumeClock(clock: MovingClock, now: number): MovingClock {
  if (clock.segmentStartedAt !== null) return clock;
  return { ...clock, segment: clock.segment + 1, segmentStartedAt: now };
}

/**
 * Si la app se cerró grabando, el tramo en curso cuenta hasta el último punto guardado:
 * no se sabe qué pasó después (RUN-08).
 */
export function recoveredMovingMs(clock: MovingClock, lastPointAt: number | null): number {
  if (clock.segmentStartedAt === null || lastPointAt === null) return clock.movingMsBefore;
  return clock.movingMsBefore + Math.max(0, lastPointAt - clock.segmentStartedAt);
}

export function parseClock(json: string | null): (MovingClock & { runId: string }) | null {
  if (!json) return null;
  try {
    const v = JSON.parse(json) as Record<string, unknown>;
    if (
      typeof v.runId === 'string' &&
      typeof v.segment === 'number' &&
      typeof v.movingMsBefore === 'number' &&
      (v.segmentStartedAt === null || typeof v.segmentStartedAt === 'number')
    ) {
      return {
        runId: v.runId,
        segment: v.segment,
        movingMsBefore: v.movingMsBefore,
        segmentStartedAt: v.segmentStartedAt as number | null,
      };
    }
  } catch {
    // Dato dañado: se trata como si no hubiera reloj.
  }
  return null;
}

// --- Formato (RUN-03; las distancias siempre en km, S-05) ---

/** Kilómetros con dos decimales: 1234 m → "1.23". */
export function formatKm(meters: number): string {
  return (Math.floor(meters / 10) / 100).toFixed(2);
}

/** Ritmo en min/km: 332 s → "5:32". Sin ritmo: "--:--". */
export function formatPace(secondsPerKm: number | null): string {
  if (secondsPerKm === null || !Number.isFinite(secondsPerKm)) return '--:--';
  const total = Math.round(secondsPerKm);
  if (total >= 100 * 60) return '--:--';
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** Tiempo transcurrido: "4:05" o "1:04:05". */
export function formatElapsed(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

// --- Resumen y ruta guardada (RUN-05, RUN-06; plan técnico, sección 4) ---

/** Velocidad promedio en km/h, o `null` sin distancia o sin tiempo. */
export function avgSpeedKmh(meters: number, seconds: number): number | null {
  if (meters < MIN_PACE_METERS || seconds <= 0) return null;
  return meters / 1000 / (seconds / 3600);
}

export type DayPart = 'morning' | 'afternoon' | 'night';

/** Momento del día para el nombre por defecto: mañana de 5 a 12, tarde de 12 a 19, noche el resto. */
export function dayPart(date: Date): DayPart {
  const h = date.getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 19) return 'afternoon';
  return 'night';
}

/** Tolerancia (m) al simplificar la ruta: menos que el error del GPS, así que no cambia su forma. */
export const SIMPLIFY_TOLERANCE_METERS = 3;

/** Distancia (m) de `p` al segmento a–b, en un plano local (suficiente para tramos cortos). */
function offsetFromLine(p: LatLng, a: LatLng, b: LatLng): number {
  const mPerLat = 111_195;
  const mPerLng = mPerLat * Math.cos(rad(a.latitude));
  const ax = 0;
  const ay = 0;
  const bx = (b.longitude - a.longitude) * mPerLng;
  const by = (b.latitude - a.latitude) * mPerLat;
  const px = (p.longitude - a.longitude) * mPerLng;
  const py = (p.latitude - a.latitude) * mPerLat;
  const len2 = bx * bx + by * by;
  const k = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * bx + (py - ay) * by) / len2));
  return Math.hypot(px - k * bx, py - k * by);
}

/** Simplifica un tramo con el algoritmo de Douglas-Peucker: quita puntos que no cambian la forma. */
export function simplifyLine(line: readonly LatLng[], tolerance = SIMPLIFY_TOLERANCE_METERS): LatLng[] {
  if (line.length <= 2) return [...line];
  const keep = new Array<boolean>(line.length).fill(false);
  keep[0] = true;
  keep[line.length - 1] = true;
  const stack: [number, number][] = [[0, line.length - 1]];
  while (stack.length) {
    const [start, end] = stack.pop()!;
    let maxDist = 0;
    let index = -1;
    for (let i = start + 1; i < end; i++) {
      const d = offsetFromLine(line[i]!, line[start]!, line[end]!);
      if (d > maxDist) {
        maxDist = d;
        index = i;
      }
    }
    if (index !== -1 && maxDist > tolerance) {
      keep[index] = true;
      stack.push([start, index], [index, end]);
    }
  }
  return line.filter((_, i) => keep[i]);
}

// Codificación de polilíneas de Google (precisión de 5 decimales, unos 1.1 m): cada tramo es
// una cadena de caracteres imprimibles; los tramos se separan con un espacio.

function encodeNumber(value: number): string {
  let v = value < 0 ? ~(value << 1) : value << 1;
  let out = '';
  while (v >= 0x20) {
    out += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
    v >>= 5;
  }
  return out + String.fromCharCode(v + 63);
}

function encodeLine(line: readonly LatLng[]): string {
  let lat = 0;
  let lng = 0;
  let out = '';
  for (const p of line) {
    const la = Math.round(p.latitude * 1e5);
    const ln = Math.round(p.longitude * 1e5);
    out += encodeNumber(la - lat) + encodeNumber(ln - lng);
    lat = la;
    lng = ln;
  }
  return out;
}

function decodeLine(text: string): LatLng[] {
  const out: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  const next = (): number | null => {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      if (index >= text.length) return null;
      byte = text.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    return result & 1 ? ~(result >> 1) : result >> 1;
  };
  while (index < text.length) {
    const dLat = next();
    const dLng = next();
    if (dLat === null || dLng === null) break;
    lat += dLat;
    lng += dLng;
    out.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return out;
}

/** Ruta simplificada y comprimida que se guarda en `runs.route` y se sincroniza. */
export function encodeRoute(points: readonly RoutePoint[]): string {
  return splitSegments(points)
    .map((segment) => encodeLine(simplifyLine(segment)))
    .filter((s) => s.length > 0)
    .join(' ');
}

export function decodeRoute(route: string | null): LatLng[][] {
  if (!route) return [];
  return route
    .split(' ')
    .filter(Boolean)
    .map(decodeLine)
    .filter((line) => line.length > 0);
}

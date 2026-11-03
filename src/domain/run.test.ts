import {
  canStartRun,
  currentPace,
  distanceMeters,
  filterPoint,
  type Fix,
  formatElapsed,
  formatKm,
  formatPace,
  movingMs,
  paceSecondsPerKm,
  parseClock,
  pauseClock,
  recoveredMovingMs,
  resumeClock,
  type RoutePoint,
  routeDistance,
  signalQuality,
  splitSegments,
  startClock,
  stepDistance,
} from './run';

const fix = (accuracy: number | null, timestamp = 1_000): Fix => ({
  latitude: 32.5,
  longitude: -117,
  accuracy,
  timestamp,
});

describe('signalQuality (RUN-02)', () => {
  it('clasifica por precisión', () => {
    expect(signalQuality(fix(5), 1_000)).toBe('good');
    expect(signalQuality(fix(15), 1_000)).toBe('good');
    expect(signalQuality(fix(30), 1_000)).toBe('fair');
    expect(signalQuality(fix(60), 1_000)).toBe('none');
  });

  it('sin lectura, sin precisión o con una lectura vieja: sin señal', () => {
    expect(signalQuality(null, 1_000)).toBe('none');
    expect(signalQuality(fix(null), 1_000)).toBe('none');
    expect(signalQuality(fix(5, 1_000), 20_000)).toBe('none');
  });

  it('solo se puede iniciar con señal', () => {
    expect(canStartRun('good')).toBe(true);
    expect(canStartRun('fair')).toBe(true);
    expect(canStartRun('none')).toBe(false);
  });
});

// Recorridos de ejemplo: 1 grado de latitud mide unos 111,195 m.
const METERS_PER_DEG_LAT = 111_195;
const ORIGIN = { latitude: 32.5, longitude: -117.0 };
const at = (northMeters: number, eastMeters = 0, t = 0, segment = 0, accuracy = 5): RoutePoint => ({
  latitude: ORIGIN.latitude + northMeters / METERS_PER_DEG_LAT,
  longitude: ORIGIN.longitude + eastMeters / (METERS_PER_DEG_LAT * Math.cos((ORIGIN.latitude * Math.PI) / 180)),
  accuracy,
  timestamp: t,
  segment,
});

/** Simula el seguimiento: pasa cada lectura por el filtro y guarda solo las aceptadas. */
function track(fixes: RoutePoint[]): RoutePoint[] {
  const accepted: RoutePoint[] = [];
  for (const f of fixes) {
    if (filterPoint(accepted[accepted.length - 1] ?? null, f) === 'accept') accepted.push(f);
  }
  return accepted;
}

describe('distancia y filtrado (RUN-07)', () => {
  it('distanceMeters mide 100 m al norte', () => {
    expect(distanceMeters(at(0), at(100))).toBeCloseTo(100, 0);
  });

  it('un recorrido de 1 km a 3 m/s, con el error típico del GPS, mide entre 0.95 y 1.05 km', () => {
    const fixes: RoutePoint[] = [];
    for (let s = 0; s <= 334; s++) {
      // El error del GPS cambia poco a poco: una deriva lateral de hasta 4 m más un temblor de ±0.5 m.
      const noise = 4 * Math.sin(s / 15) + (((s * 7919) % 3) - 1) * 0.5;
      fixes.push(at(s * 3, noise, s * 1000));
    }
    const km = routeDistance(track(fixes)) / 1000;
    expect(km).toBeGreaterThan(0.95);
    expect(km).toBeLessThan(1.05);
  });

  it('quieto 2 minutos con un temblor pequeño del GPS: la distancia casi no cambia', () => {
    const fixes: RoutePoint[] = [];
    for (let s = 0; s < 120; s++) {
      const a = (s * 2.39996) % (2 * Math.PI);
      fixes.push(at(1.4 * Math.cos(a), 1.4 * Math.sin(a), s * 1000));
    }
    expect(routeDistance(track(fixes))).toBeLessThan(20);
  });

  it('descarta puntos imprecisos, saltos imposibles y puntos casi iguales', () => {
    const last = at(0, 0, 0);
    expect(filterPoint(last, at(10, 0, 3000, 0, 30))).toBe('inaccurate');
    expect(filterPoint(last, { ...at(10, 0, 3000), accuracy: null })).toBe('inaccurate');
    expect(filterPoint(last, at(500, 0, 3000))).toBe('too_fast');
    expect(filterPoint(last, at(2, 0, 3000))).toBe('too_close');
    expect(filterPoint(last, at(10, 0, 3000))).toBe('accept');
  });

  it('un tramo nuevo no se compara con el anterior ni suma distancia', () => {
    const last = at(0, 0, 0, 0);
    const resumed = at(400, 0, 1000, 1);
    expect(filterPoint(last, resumed)).toBe('accept');
    expect(stepDistance(last, resumed)).toBe(0);
  });

  it('pausar, caminar 50 m y reanudar: ese tramo no cuenta (RUN-04)', () => {
    const points = [at(0, 0, 0, 0), at(100, 0, 30_000, 0), at(150, 0, 90_000, 1), at(250, 0, 120_000, 1)];
    expect(routeDistance(points)).toBeCloseTo(200, 0);
    expect(splitSegments(points)).toHaveLength(2);
    expect(splitSegments(points)[1]).toHaveLength(2);
  });
});

describe('ritmo (RUN-03)', () => {
  it('paceSecondsPerKm: 1 km en 5 minutos son 300 s/km', () => {
    expect(paceSecondsPerKm(1000, 300)).toBe(300);
    expect(paceSecondsPerKm(5, 60)).toBeNull();
    expect(paceSecondsPerKm(100, 0)).toBeNull();
  });

  it('currentPace usa solo los últimos 30 segundos', () => {
    // Primero lento (2 m/s) y luego rápido (4 m/s).
    const points: RoutePoint[] = [];
    let north = 0;
    for (let s = 0; s <= 60; s++) {
      north += s <= 30 ? 2 : 4;
      points.push(at(north, 0, s * 1000));
    }
    expect(currentPace(points, 60_000)).toBeCloseTo(250, 0);
  });

  it('currentPace desaparece al detenerse', () => {
    const points = [at(0, 0, 0), at(30, 0, 10_000)];
    expect(currentPace(points, 60_000)).toBeNull();
    expect(currentPace([], 0)).toBeNull();
  });
});

describe('tiempo en movimiento (RUN-04, RUN-08)', () => {
  it('en pausa no suma tiempo; al reanudar abre otro tramo', () => {
    let clock = startClock(0);
    expect(movingMs(clock, 60_000)).toBe(60_000);
    clock = pauseClock(clock, 60_000);
    expect(movingMs(clock, 120_000)).toBe(60_000);
    clock = resumeClock(clock, 120_000);
    expect(clock.segment).toBe(1);
    expect(movingMs(clock, 150_000)).toBe(90_000);
  });

  it('recuperar tras un cierre cuenta hasta el último punto guardado', () => {
    const clock = { segment: 0, segmentStartedAt: 10_000, movingMsBefore: 5_000 };
    expect(recoveredMovingMs(clock, 70_000)).toBe(65_000);
    expect(recoveredMovingMs({ ...clock, segmentStartedAt: null }, 70_000)).toBe(5_000);
    expect(recoveredMovingMs(clock, null)).toBe(5_000);
  });

  it('parseClock lee el reloj guardado y rechaza datos dañados', () => {
    const saved = { runId: 'r', segment: 2, segmentStartedAt: null, movingMsBefore: 1000 };
    expect(parseClock(JSON.stringify(saved))).toEqual(saved);
    expect(parseClock('{malo')).toBeNull();
    expect(parseClock(JSON.stringify({ runId: 1 }))).toBeNull();
    expect(parseClock(null)).toBeNull();
  });
});

describe('formato', () => {
  it('km, ritmo y tiempo', () => {
    expect(formatKm(1234)).toBe('1.23');
    expect(formatKm(999)).toBe('0.99');
    expect(formatPace(332)).toBe('5:32');
    expect(formatPace(null)).toBe('--:--');
    expect(formatElapsed(245)).toBe('4:05');
    expect(formatElapsed(3845)).toBe('1:04:05');
  });
});

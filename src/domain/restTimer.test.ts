import {
  adjustTimer,
  isFinished,
  parseTimer,
  remainingSeconds,
  restSecondsFor,
  startTimer,
  stepDefaultRest,
} from './restTimer';

const t0 = 1_000_000;

describe('temporizador de descanso (SES-08)', () => {
  it('guarda la hora de finalización', () => {
    expect(startTimer('w', 90, t0)).toEqual({ workoutId: 'w', endsAt: t0 + 90_000, durationSeconds: 90, notificationId: null });
  });

  it('calcula lo que falta a partir de la hora, aunque la app se haya cerrado (SES-10)', () => {
    const timer = startTimer('w', 90, t0);
    expect(remainingSeconds(timer, t0)).toBe(90);
    expect(remainingSeconds(timer, t0 + 30_000)).toBe(60);
    expect(remainingSeconds(timer, t0 + 89_100)).toBe(1);
    expect(remainingSeconds(timer, t0 + 200_000)).toBe(0);
    expect(isFinished(timer, t0 + 89_999)).toBe(false);
    expect(isFinished(timer, t0 + 90_000)).toBe(true);
  });

  it('suma y resta 15 segundos', () => {
    const timer = startTimer('w', 90, t0);
    const plus = adjustTimer(timer, 15, t0 + 10_000);
    expect(plus && remainingSeconds(plus, t0 + 10_000)).toBe(95);
    const minus = adjustTimer(timer, -15, t0 + 10_000);
    expect(minus && remainingSeconds(minus, t0 + 10_000)).toBe(65);
  });

  it('restar más de lo que falta lo da por saltado', () => {
    const timer = startTimer('w', 90, t0);
    expect(adjustTimer(timer, -15, t0 + 80_000)).toBeNull();
  });

  it('usa el descanso de la rutina o, si no hay, el del usuario', () => {
    expect(restSecondsFor(120, 90)).toBe(120);
    expect(restSecondsFor(null, 90)).toBe(90);
    expect(restSecondsFor(undefined, 90)).toBe(90);
    expect(restSecondsFor(0, 90)).toBe(90);
  });
});

describe('ajustes de descanso (AJU-02)', () => {
  it('el descanso por defecto se mueve de 15 en 15 dentro de los límites', () => {
    expect(stepDefaultRest(90, 15)).toBe(105);
    expect(stepDefaultRest(15, -15)).toBe(15);
    expect(stepDefaultRest(600, 15)).toBe(600);
  });
});

describe('parseTimer', () => {
  it('lee un temporizador guardado', () => {
    const timer = { workoutId: 'w', endsAt: 5, durationSeconds: 90, notificationId: 'n' };
    expect(parseTimer(JSON.stringify(timer))).toEqual(timer);
  });

  it('ignora textos inválidos', () => {
    expect(parseTimer(null)).toBeNull();
    expect(parseTimer('no es json')).toBeNull();
    expect(parseTimer('{"endsAt":"x"}')).toBeNull();
    expect(parseTimer(JSON.stringify({ workoutId: 'w', endsAt: 5, durationSeconds: 90 }))).toMatchObject({ notificationId: null });
  });
});

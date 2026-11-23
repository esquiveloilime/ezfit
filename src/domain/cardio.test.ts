import {
  cardioParts,
  type CardioValues,
  emptyCardio,
  inputFromCardio,
  pauseStopwatch,
  prefillCardio,
  STOPWATCH_ZERO,
  startStopwatch,
  stopwatchMs,
  stopwatchToFields,
  validateCardio,
} from './cardio';

const treadmill: CardioValues = {
  machineType: 'treadmill',
  durationSeconds: 1230,
  level: 5,
  speed: 6.5,
  distanceMeters: 2100,
  incline: 3,
  notes: 'cansado',
};

describe('validateCardio (CAR-01)', () => {
  it('guarda aparato, duración y los campos llenos', () => {
    const result = validateCardio({
      machineType: 'treadmill',
      minutes: '20',
      seconds: '30',
      level: '5',
      speed: '6,5',
      distanceKm: '2.1',
      incline: '',
      notes: '  buen ritmo ',
    });
    expect(result).toEqual({
      ok: true,
      values: {
        machineType: 'treadmill',
        durationSeconds: 1230,
        level: 5,
        speed: 6.5,
        distanceMeters: 2100,
        incline: null,
        notes: 'buen ritmo',
      },
    });
  });

  it('pide el aparato y una duración mayor a cero', () => {
    const result = validateCardio(emptyCardio());
    expect(result).toEqual({ ok: false, errors: ['machine', 'duration'] });
  });

  it('acepta solo minutos o solo segundos', () => {
    const minutes = validateCardio({ ...emptyCardio('bike'), minutes: '15' });
    expect(minutes.ok && minutes.values.durationSeconds).toBe(900);
    const seconds = validateCardio({ ...emptyCardio('bike'), seconds: '45' });
    expect(seconds.ok && seconds.values.durationSeconds).toBe(45);
  });

  it('rechaza segundos de más de 59 y números inválidos', () => {
    expect(validateCardio({ ...emptyCardio('bike'), minutes: '1', seconds: '75' })).toEqual({
      ok: false,
      errors: ['duration'],
    });
    expect(validateCardio({ ...emptyCardio('bike'), minutes: '10', level: 'abc', speed: '500' })).toEqual({
      ok: false,
      errors: ['level', 'speed'],
    });
  });

  it('nivel, velocidad, distancia e inclinación son opcionales', () => {
    const result = validateCardio({ ...emptyCardio('rower'), minutes: '10' });
    expect(result.ok && result.values).toMatchObject({ level: null, speed: null, distanceMeters: null, incline: null });
  });
});

describe('prefillCardio (CAR-01)', () => {
  it('trae los valores de la última vez con ese aparato, sin las notas', () => {
    expect(prefillCardio('treadmill', treadmill)).toEqual({
      machineType: 'treadmill',
      minutes: '20',
      seconds: '30',
      level: '5',
      speed: '6.5',
      distanceKm: '2.1',
      incline: '3',
      notes: '',
    });
  });

  it('vacío si nunca se usó ese aparato', () => {
    expect(prefillCardio('bike', null)).toEqual(emptyCardio('bike'));
    expect(prefillCardio('bike', treadmill)).toEqual(emptyCardio('bike'));
  });

  it('ida y vuelta: lo precargado vuelve a dar los mismos valores', () => {
    const again = validateCardio({ ...inputFromCardio(treadmill), notes: 'cansado' });
    expect(again).toEqual({ ok: true, values: treadmill });
  });
});

describe('cardioParts', () => {
  it('da formato a cada dato y omite los vacíos', () => {
    expect(cardioParts({ ...treadmill, incline: null })).toEqual({
      duration: '20:30',
      level: '5',
      speed: '6.5',
      distanceKm: '2.1',
      incline: null,
    });
  });
});

describe('cronómetro (CAR-02)', () => {
  it('suma los tramos y no cuenta el tiempo en pausa', () => {
    let watch = startStopwatch(STOPWATCH_ZERO, 1000);
    expect(stopwatchMs(watch, 61_000)).toBe(60_000);
    watch = pauseStopwatch(watch, 61_000);
    expect(stopwatchMs(watch, 500_000)).toBe(60_000);
    watch = startStopwatch(watch, 500_000);
    expect(stopwatchMs(watch, 530_000)).toBe(90_000);
  });

  it('arrancar dos veces no reinicia el tramo', () => {
    const watch = startStopwatch(startStopwatch(STOPWATCH_ZERO, 1000), 5000);
    expect(watch.runningSince).toBe(1000);
  });

  it('pasa el tiempo a minutos y segundos', () => {
    expect(stopwatchToFields(90_400)).toEqual({ minutes: '1', seconds: '30' });
    expect(stopwatchToFields(0)).toEqual({ minutes: '0', seconds: '0' });
  });
});

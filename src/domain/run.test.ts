import { canStartRun, type Fix, signalQuality } from './run';

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

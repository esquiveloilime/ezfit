import { type ExerciseFormInput, validateExerciseForm } from './exerciseForm';

const base: ExerciseFormInput = {
  name: 'Plancha con peso',
  muscleGroup: 'abs',
  equipment: 'bodyweight',
  trackingType: 'weight_reps',
  usesRir: true,
  usesTechnique: true,
  notes: '',
  videoUrl: '',
};

describe('validateExerciseForm (EJE-03)', () => {
  it('acepta un ejercicio válido y limpia los textos', () => {
    const result = validateExerciseForm({ ...base, name: '  Plancha   con peso ', notes: '  ' });
    expect(result).toEqual({
      ok: true,
      values: expect.objectContaining({ name: 'Plancha con peso', notes: null, videoUrl: null }),
    });
  });

  it('el nombre es obligatorio', () => {
    expect(validateExerciseForm({ ...base, name: '   ' })).toEqual({ ok: false, errors: { name: 'required' } });
  });

  it('el nombre no puede ser larguísimo', () => {
    expect(validateExerciseForm({ ...base, name: 'x'.repeat(81) })).toEqual({
      ok: false,
      errors: { name: 'too_long' },
    });
  });

  it('el enlace de video es opcional, pero si se escribe debe ser una dirección web (EJE-06)', () => {
    expect(validateExerciseForm({ ...base, videoUrl: 'un video' })).toEqual({
      ok: false,
      errors: { videoUrl: 'invalid' },
    });
    const ok = validateExerciseForm({ ...base, videoUrl: ' https://youtu.be/abc ' });
    expect(ok.ok && ok.values.videoUrl).toBe('https://youtu.be/abc');
  });

  it('sin repeticiones no se anota RIR', () => {
    const result = validateExerciseForm({ ...base, trackingType: 'time', usesRir: true });
    expect(result.ok && result.values.usesRir).toBe(false);
    const withReps = validateExerciseForm({ ...base, trackingType: 'reps', usesRir: true });
    expect(withReps.ok && withReps.values.usesRir).toBe(true);
  });
});

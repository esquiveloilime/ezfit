import { isUuid } from '@/domain/id';

import { CATALOG_EXERCISES } from './exercises';
import { TEMPLATE_PLANS, TEMPLATE_ROUTINES, templateRows } from './templates';

const byNumber = new Map(CATALOG_EXERCISES.map((e) => [e.n, e]));
const routine = (n: number) => TEMPLATE_ROUTINES.find((r) => r.n === n)!;

describe('plantillas (RUT-01, anexo A)', () => {
  it('hay rutinas por tiempo de 30, 45 y 60 minutos', () => {
    const time = TEMPLATE_ROUTINES.filter((r) => r.category === 'time');
    expect(time.map((r) => r.minutes).sort()).toEqual([30, 45, 60]);
    const counts = Object.fromEntries(time.map((r) => [r.minutes, r.items.length]));
    expect(counts[30]).toBe(4);
    expect(counts[45]).toBeGreaterThanOrEqual(5);
    expect(counts[45]).toBeLessThanOrEqual(6);
    expect(counts[60]).toBeGreaterThanOrEqual(7);
    expect(counts[60]).toBeLessThanOrEqual(8);
  });

  it('la de 30 minutos usa 4 ejercicios compuestos con descansos cortos', () => {
    for (const [ex, , , , rest] of routine(11).items) {
      expect(byNumber.get(ex)!.secondary.length).toBeGreaterThan(0);
      expect(rest).toBeLessThanOrEqual(60);
    }
  });

  it('hay una rutina de 5 a 6 ejercicios para cada músculo objetivo', () => {
    const muscle = TEMPLATE_ROUTINES.filter((r) => r.category === 'muscle');
    expect(muscle.map((r) => r.name).sort()).toEqual(['Abdomen', 'Brazos', 'Espalda', 'Hombro', 'Pecho', 'Pierna']);
    for (const r of muscle) {
      expect(r.items.length).toBeGreaterThanOrEqual(5);
      expect(r.items.length).toBeLessThanOrEqual(6);
    }
  });

  it('las rutinas de los planes tienen de 5 a 7 ejercicios, 3 series y rangos del anexo A', () => {
    for (const r of TEMPLATE_ROUTINES.filter((x) => x.category === 'plan')) {
      expect(r.items.length).toBeGreaterThanOrEqual(5);
      expect(r.items.length).toBeLessThanOrEqual(7);
      for (const [, sets, min, max] of r.items) {
        expect(sets).toBe(3);
        const range = `${min}-${max}`;
        expect(['8-12', '10-15', 'null-null']).toContain(range);
      }
    }
  });

  it('hay planes de 2 a 6 días con la distribución del anexo A', () => {
    expect(TEMPLATE_PLANS.map((p) => p.days)).toEqual([2, 3, 4, 5, 6]);
    const names = (p: number) => TEMPLATE_PLANS.find((x) => x.days === p)!.routines.map((n) => routine(n).name);
    expect(names(2)).toEqual(['Cuerpo completo A', 'Cuerpo completo B']);
    expect(names(3)).toEqual(['Cuerpo completo A', 'Cuerpo completo B', 'Cuerpo completo C']);
    expect(names(4)).toEqual(['Torso A', 'Pierna A', 'Torso B', 'Pierna B']);
    expect(names(5)).toEqual(['Torso A', 'Pierna A', 'Empuje', 'Jalón', 'Pierna B']);
    expect(names(6)).toEqual(['Empuje', 'Jalón', 'Pierna', 'Empuje', 'Jalón', 'Pierna']);
    for (const p of TEMPLATE_PLANS) expect(p.routines).toHaveLength(p.days);
  });

  it('todos los ejercicios existen en el catálogo y no se repiten dentro de una rutina', () => {
    for (const r of TEMPLATE_ROUTINES) {
      const ids = r.items.map(([ex]) => ex);
      for (const ex of ids) expect(byNumber.has(ex)).toBe(true);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('los ejercicios de tiempo no llevan rango de repeticiones', () => {
    for (const r of TEMPLATE_ROUTINES) {
      for (const [ex, , min, max] of r.items) {
        const timed = byNumber.get(ex)!.tracking === 'time';
        expect(min === null && max === null).toBe(timed);
      }
    }
  });

  it('los identificadores son UUID únicos', () => {
    const rows = templateRows();
    const ids = [...rows.routines, ...rows.routineExercises, ...rows.plans, ...rows.planDays].map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(isUuid(id)).toBe(true);
  });
});

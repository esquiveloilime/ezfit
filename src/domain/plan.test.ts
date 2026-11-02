import {
  adjustWeekdays,
  isValidDayCount,
  parseWeekdays,
  sortWeekdays,
  suggestedPlanDays,
  todaysPlanDay,
  toggleWeekday,
  type Weekday,
} from './plan';

const plan3 = [
  { position: 0, routineId: 'A' },
  { position: 1, routineId: 'B' },
  { position: 2, routineId: 'C' },
];
const mon: Weekday = 1;
const tue: Weekday = 2;
const wed: Weekday = 3;
const fri: Weekday = 5;
const sun: Weekday = 0;

describe('días de entrenamiento', () => {
  it('se ordenan de lunes a domingo', () => {
    expect(sortWeekdays([sun, fri, mon])).toEqual([1, 5, 0]);
  });

  it('se agregan y quitan con un toque', () => {
    expect(toggleWeekday([mon, fri], wed)).toEqual([1, 3, 5]);
    expect(toggleWeekday([mon, wed, fri], wed)).toEqual([1, 5]);
  });

  it('la cantidad va de 2 a 6', () => {
    expect([1, 2, 6, 7].map(isValidDayCount)).toEqual([false, true, true, false]);
  });

  it('se leen del perfil sin fallar con datos dañados', () => {
    expect(parseWeekdays('[5,1,3]')).toEqual([1, 3, 5]);
    expect(parseWeekdays(null)).toBeNull();
    expect(parseWeekdays('basura')).toBeNull();
    expect(parseWeekdays('[9]')).toBeNull();
  });

  it('al ajustar a un plan más corto se proponen los primeros días', () => {
    expect(adjustWeekdays([1, 2, 3, 4, 5, 6], 3)).toEqual([1, 2, 3]);
  });
});

describe('suggestedPlanDays (anexo A)', () => {
  it('propone el plan que coincide con los días', () => {
    expect(suggestedPlanDays(3)).toEqual({ recommended: 3, alternatives: [] });
  });

  it('con 5 o 6 días también ofrece los de 3 y 4', () => {
    expect(suggestedPlanDays(5)).toEqual({ recommended: 5, alternatives: [3, 4] });
    expect(suggestedPlanDays(6).alternatives).toEqual([3, 4]);
  });
});

describe('todaysPlanDay (RUT-02)', () => {
  it('con días concretos, cada día elegido tiene su rutina en orden', () => {
    const weekdays: Weekday[] = [mon, wed, fri];
    const routineOn = (today: Weekday) => {
      const r = todaysPlanDay({ planDays: plan3, weekdays, today, lastRoutineId: null });
      return r.kind === 'train' ? r.day.routineId : r.kind;
    };
    expect(routineOn(mon)).toBe('A');
    expect(routineOn(wed)).toBe('B');
    expect(routineOn(fri)).toBe('C');
    expect(routineOn(tue)).toBe('rest');
    expect(routineOn(sun)).toBe('rest');
  });

  it('el domingo cuenta como el último día de la semana', () => {
    const r = todaysPlanDay({ planDays: plan3, weekdays: [sun, mon, wed], today: sun, lastRoutineId: null });
    expect(r.kind === 'train' && r.day.routineId).toBe('C');
  });

  it('solo con cantidad, toca la siguiente rutina después de la última hecha', () => {
    const next = (last: string | null) => {
      const r = todaysPlanDay({ planDays: plan3, weekdays: null, today: tue, lastRoutineId: last });
      return r.kind === 'train' && r.day.routineId;
    };
    expect(next(null)).toBe('A');
    expect(next('A')).toBe('B');
    expect(next('C')).toBe('A');
    // Una rutina que no es del plan: se empieza desde el principio.
    expect(next('otra')).toBe('A');
  });

  it('en el plan de 6 días, después de Empuje viene Jalón', () => {
    const plan6 = ['P', 'J', 'L', 'P', 'J', 'L'].map((routineId, position) => ({ position, routineId }));
    const r = todaysPlanDay({ planDays: plan6, weekdays: null, today: mon, lastRoutineId: 'P' });
    expect(r.kind === 'train' && r.day.routineId).toBe('J');
  });

  it('un plan sin días no propone nada', () => {
    expect(todaysPlanDay({ planDays: [], weekdays: null, today: mon, lastRoutineId: null })).toEqual({
      kind: 'empty',
    });
  });
});

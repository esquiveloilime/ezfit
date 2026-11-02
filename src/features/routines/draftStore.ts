import { create } from 'zustand';

import { newId } from '@/domain/id';
import { type DraftItem, moveItem, type RoutineDraft } from '@/domain/routine';

/**
 * Rutina que se está editando. Vive fuera de la pantalla para no perderse al ir al
 * selector de ejercicios y volver.
 */
type DraftState = {
  /** `new` para una rutina nueva o el id de la que se edita; `null` si no hay edición. */
  editing: string | null;
  draft: RoutineDraft;
  start: (editing: string, draft: RoutineDraft) => void;
  clear: () => void;
  setName: (name: string) => void;
  addExercise: (exerciseId: string) => void;
  updateItem: (key: string, field: 'targetSets' | 'repsMin' | 'repsMax' | 'restSeconds', value: string) => void;
  removeItem: (key: string) => void;
  move: (from: number, to: number) => void;
};

const EMPTY: RoutineDraft = { name: '', items: [] };

/** Valores con los que empieza un ejercicio agregado a la rutina. */
function newItem(exerciseId: string): DraftItem {
  return {
    key: newId(),
    routineExerciseId: null,
    exerciseId,
    targetSets: '3',
    repsMin: '8',
    repsMax: '12',
    restSeconds: '',
  };
}

export const useRoutineDraft = create<DraftState>((set) => ({
  editing: null,
  draft: EMPTY,
  start: (editing, draft) => set({ editing, draft }),
  clear: () => set({ editing: null, draft: EMPTY }),
  setName: (name) => set((s) => ({ draft: { ...s.draft, name } })),
  addExercise: (exerciseId) =>
    set((s) => ({ draft: { ...s.draft, items: [...s.draft.items, newItem(exerciseId)] } })),
  updateItem: (key, field, value) =>
    set((s) => ({
      draft: {
        ...s.draft,
        items: s.draft.items.map((i) => (i.key === key ? { ...i, [field]: value } : i)),
      },
    })),
  removeItem: (key) =>
    set((s) => ({ draft: { ...s.draft, items: s.draft.items.filter((i) => i.key !== key) } })),
  move: (from, to) => set((s) => ({ draft: { ...s.draft, items: moveItem(s.draft.items, from, to) } })),
}));

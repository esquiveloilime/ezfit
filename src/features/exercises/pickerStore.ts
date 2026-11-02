import { create } from 'zustand';

/**
 * Comunica el selector de ejercicios con la pantalla que lo abrió (por ejemplo, el
 * editor de rutinas): quien abre el selector deja aquí qué hacer con el elegido.
 */
type PickerState = {
  onPick: ((exerciseId: string) => void) | null;
  open: (onPick: (exerciseId: string) => void) => void;
  pick: (exerciseId: string) => void;
};

export const useExercisePicker = create<PickerState>((set, get) => ({
  onPick: null,
  open: (onPick) => set({ onPick }),
  pick: (exerciseId) => {
    get().onPick?.(exerciseId);
    set({ onPick: null });
  },
}));

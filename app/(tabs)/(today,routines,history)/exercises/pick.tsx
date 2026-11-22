import { Stack } from 'expo-router';

import { ExerciseCatalog } from '@/features/exercises/ExerciseCatalog';
import { t } from '@/i18n';

export default function PickExerciseScreen() {
  return (
    <>
      <Stack.Screen options={{ title: t.exercises.pickTitle }} />
      <ExerciseCatalog mode="pick" />
    </>
  );
}

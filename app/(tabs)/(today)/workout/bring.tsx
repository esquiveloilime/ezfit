import { Stack } from 'expo-router';

import { BringExerciseView } from '@/features/workout/BringExerciseView';
import { t } from '@/i18n';

export default function BringExerciseScreen() {
  return (
    <>
      <Stack.Screen options={{ title: t.workout.bringTitle }} />
      <BringExerciseView />
    </>
  );
}

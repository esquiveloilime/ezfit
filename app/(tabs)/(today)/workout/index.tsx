import { Stack } from 'expo-router';

import { WorkoutView } from '@/features/workout/WorkoutView';
import { t } from '@/i18n';

export default function WorkoutScreen() {
  return (
    <>
      <Stack.Screen options={{ title: t.workout.title }} />
      <WorkoutView />
    </>
  );
}

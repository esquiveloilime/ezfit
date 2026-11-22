import { Stack, useLocalSearchParams } from 'expo-router';

import { ExerciseDetailView } from '@/features/exercises/ExerciseDetailView';
import { t } from '@/i18n';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <>
      <Stack.Screen options={{ title: t.exercises.detailTitle }} />
      <ExerciseDetailView id={id} />
    </>
  );
}

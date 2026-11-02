import { useLocalSearchParams } from 'expo-router';

import { ExerciseDetailView } from '@/features/exercises/ExerciseDetailView';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ExerciseDetailView id={id} />;
}

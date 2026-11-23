import { useLocalSearchParams } from 'expo-router';

import { ExerciseHistoryView } from '@/features/history/ExerciseHistoryView';

export default function ExerciseHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ExerciseHistoryView exerciseId={id} />;
}

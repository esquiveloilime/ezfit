import { useLocalSearchParams } from 'expo-router';

import { WorkoutDetailView } from '@/features/history/WorkoutDetailView';

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <WorkoutDetailView id={id} />;
}

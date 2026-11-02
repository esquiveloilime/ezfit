import { useLocalSearchParams } from 'expo-router';

import { RoutineDetailView } from '@/features/routines/RoutineDetailView';

export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <RoutineDetailView id={id} />;
}

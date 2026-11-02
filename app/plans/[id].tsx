import { useLocalSearchParams } from 'expo-router';

import { PlanDetailView } from '@/features/routines/PlanDetailView';

export default function PlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PlanDetailView id={id} />;
}

import { useLocalSearchParams } from 'expo-router';

import { RunDetailView } from '@/features/run/RunDetailView';

export default function RunDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <RunDetailView runId={id} />;
}

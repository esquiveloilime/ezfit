import { useLocalSearchParams } from 'expo-router';

import { RunSummaryView } from '@/features/run/RunSummaryView';

export default function RunSummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <RunSummaryView runId={id} />;
}

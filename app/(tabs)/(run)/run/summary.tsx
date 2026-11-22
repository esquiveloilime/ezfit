import { Stack, useLocalSearchParams } from 'expo-router';

import { RunSummaryView } from '@/features/run/RunSummaryView';
import { t } from '@/i18n';

export default function RunSummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <>
      <Stack.Screen options={{ title: t.run.summaryTitle }} />
      <RunSummaryView runId={id} />
    </>
  );
}

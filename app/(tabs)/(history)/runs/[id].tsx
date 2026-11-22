import { Stack, useLocalSearchParams } from 'expo-router';

import { RunDetailView } from '@/features/run/RunDetailView';
import { t } from '@/i18n';

export default function RunDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <>
      <Stack.Screen options={{ title: t.run.detailTitle }} />
      <RunDetailView runId={id} />
    </>
  );
}

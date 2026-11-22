import { Stack, useLocalSearchParams } from 'expo-router';

import { RoutineDetailView } from '@/features/routines/RoutineDetailView';
import { t } from '@/i18n';

export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <>
      <Stack.Screen options={{ title: t.routines.detailTitle }} />
      <RoutineDetailView id={id} />
    </>
  );
}

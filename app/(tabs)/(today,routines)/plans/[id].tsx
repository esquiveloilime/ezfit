import { Stack, useLocalSearchParams } from 'expo-router';

import { PlanDetailView } from '@/features/routines/PlanDetailView';
import { t } from '@/i18n';

export default function PlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <>
      <Stack.Screen options={{ title: t.routines.planTitle }} />
      <PlanDetailView id={id} />
    </>
  );
}

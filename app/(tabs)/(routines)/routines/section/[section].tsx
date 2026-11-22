import { Redirect, Stack, useLocalSearchParams } from 'expo-router';

import { isRoutineSection } from '@/domain/routine';
import { RoutineSectionView } from '@/features/routines/RoutineSectionView';
import { t } from '@/i18n';

export default function RoutineSectionScreen() {
  const { section } = useLocalSearchParams<{ section: string }>();
  if (!isRoutineSection(section)) return <Redirect href="/routines" />;
  return (
    <>
      <Stack.Screen options={{ title: t.routines.sections[section].title }} />
      <RoutineSectionView section={section} />
    </>
  );
}

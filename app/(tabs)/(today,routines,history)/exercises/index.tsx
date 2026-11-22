import { Stack } from 'expo-router';

import { ExerciseCatalog } from '@/features/exercises/ExerciseCatalog';
import { t } from '@/i18n';

export default function ExerciseCatalogScreen() {
  return (
    <>
      <Stack.Screen options={{ title: t.exercises.catalogTitle }} />
      <ExerciseCatalog />
    </>
  );
}

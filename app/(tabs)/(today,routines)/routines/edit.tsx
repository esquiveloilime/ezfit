import { useLocalSearchParams } from 'expo-router';

import { RoutineEditor } from '@/features/routines/RoutineEditor';

export default function RoutineEditScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <RoutineEditor id={id || undefined} />;
}

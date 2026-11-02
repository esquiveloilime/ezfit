import { useLocalSearchParams } from 'expo-router';

import { ExerciseForm } from '@/features/exercises/ExerciseForm';

export default function NewExerciseScreen() {
  const { pick } = useLocalSearchParams<{ pick?: string }>();
  return <ExerciseForm mode="create" fromPicker={pick === '1'} />;
}

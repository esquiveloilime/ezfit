import { useLocalSearchParams } from 'expo-router';

import { ExerciseForm } from '@/features/exercises/ExerciseForm';

export default function EditExerciseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ExerciseForm mode="edit" id={id} />;
}

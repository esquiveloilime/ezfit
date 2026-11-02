import { router } from 'expo-router';
import { useCallback } from 'react';
import { Alert } from 'react-native';

import { useDatabase } from '@/db/DatabaseProvider';
import { getActiveWorkout, startWorkout } from '@/db/repositories/workouts';
import { t } from '@/i18n';

/**
 * Empezar una sesión desde una rutina o vacía (SES-01). Si ya hay una en curso, no se
 * crea otra: se ofrece continuarla.
 */
export function useStartWorkout() {
  const { db, owner } = useDatabase();
  return useCallback(
    (routineId: string | null) => {
      if (getActiveWorkout(db, owner)) {
        Alert.alert(t.workout.alreadyActiveTitle, t.workout.alreadyActiveBody, [
          { text: t.common.cancel, style: 'cancel' },
          { text: t.workout.continue, onPress: () => router.push('/workout') },
        ]);
        return;
      }
      try {
        startWorkout(db, owner, routineId);
        router.push('/workout');
      } catch (error) {
        console.error('No se pudo empezar la sesión', error);
        Alert.alert(t.workout.startFailed);
      }
    },
    [db, owner],
  );
}

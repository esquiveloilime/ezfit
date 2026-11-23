import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { EXERCISE_IMAGES } from '@/db/exerciseImages';
import type { MuscleGroup } from '@/domain/exercise';
import { colors, radius } from '@/ui';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Ícono de cada grupo muscular, para los ejercicios sin foto y los propios (EJE-05). */
const MUSCLE_ICONS: Record<MuscleGroup, IconName> = {
  chest: 'weight-lifter',
  back: 'human-handsup',
  shoulders: 'human-greeting',
  biceps: 'arm-flex',
  triceps: 'arm-flex-outline',
  quads: 'seat-legroom-extra',
  hamstrings: 'run',
  glutes: 'yoga',
  calves: 'foot-print',
  abs: 'stomach',
};

/** Proporción de las fotos de free-exercise-db (850 × 567). */
const PHOTO_RATIO = 850 / 567;

type Props = {
  imageKey: string | null;
  muscleGroup: MuscleGroup;
  size: number;
  /** En la ficha del ejercicio la foto ocupa todo el ancho; el ícono queda del tamaño indicado. */
  wide?: boolean;
};

/**
 * Foto del ejercicio (EJE-05). Viene dentro de la app, así que se ve sin conexión. Los
 * ejercicios sin foto, y los propios, muestran el ícono de su grupo muscular.
 */
export function ExerciseThumb({ imageKey, muscleGroup, size, wide = false }: Props) {
  const source = imageKey ? EXERCISE_IMAGES[imageKey] : undefined;
  const corner = size > 64 ? radius.lg : radius.md;

  if (source) {
    return (
      <Image
        source={source}
        accessible={false}
        // En Android reduce la foto al tamaño en pantalla: la lista se desplaza sin tirones.
        resizeMethod="resize"
        resizeMode="cover"
        style={wide ? [styles.wide, { borderRadius: corner }] : { width: size, height: size, borderRadius: corner }}
      />
    );
  }

  return (
    <View accessible={false} style={[styles.box, { width: size, height: size, borderRadius: corner }]}>
      <MaterialCommunityIcons name={MUSCLE_ICONS[muscleGroup]} size={size * 0.5} color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  wide: { width: '100%', aspectRatio: PHOTO_RATIO, backgroundColor: colors.primarySoft },
});

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, View } from 'react-native';

import { colors, radius } from '@/ui';

type Props = { imageKey: string | null; size: number };

/**
 * Miniatura del ejercicio: el mismo ícono para todos. Las fotos (EJE-05) se retiraron a
 * petición del autor el 22 de noviembre de 2026.
 */
export function ExerciseThumb({ size }: Props) {
  return (
    <View
      accessible={false}
      style={[styles.box, { width: size, height: size, borderRadius: size > 64 ? radius.lg : radius.md }]}>
      <MaterialCommunityIcons name="dumbbell" size={size * 0.5} color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
});

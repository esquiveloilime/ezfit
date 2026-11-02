import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, font, spacing } from './tokens';

type Props = {
  title?: string;
  children: ReactNode;
  /** Desactivar cuando el contenido ya es una lista con su propio desplazamiento. */
  scroll?: boolean;
};

export function Screen({ title, children, scroll = true }: Props) {
  const header = title ? (
    <Text style={styles.title} accessibilityRole="header">
      {title}
    </Text>
  ) : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {header}
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.fill]}>
          {header}
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  fill: { flex: 1 },
  title: { fontSize: font.heading, fontWeight: '700', color: colors.text },
});

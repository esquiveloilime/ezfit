import { StyleSheet, Text, View } from 'react-native';

import { colors, font, spacing } from './tokens';

type Props = { title: string; body: string };

/** Mensaje para pantallas o listas vacías: explica qué hay o qué hacer (RNF-01). */
export function EmptyState({ title, body }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: spacing.xl, gap: spacing.sm, alignItems: 'center' },
  title: { fontSize: font.title, fontWeight: '600', color: colors.text, textAlign: 'center' },
  body: { fontSize: font.body, color: colors.textMuted, textAlign: 'center' },
});

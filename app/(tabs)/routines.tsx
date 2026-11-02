import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { t } from '@/i18n';
import { Card, EmptyState, Screen, colors, font } from '@/ui';

export default function RoutinesScreen() {
  return (
    <Screen title={t.tabs.routines}>
      <Card accessibilityLabel={t.exercises.catalogTitle} onPress={() => router.push('/exercises')}>
        <Text style={styles.title}>{t.exercises.catalogTitle}</Text>
        <Text style={styles.body}>{t.exercises.catalogEntry}</Text>
      </Card>
      <EmptyState title={t.placeholders.routines.title} body={t.placeholders.routines.body} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: font.title, fontWeight: '600', color: colors.text },
  body: { fontSize: font.body, color: colors.textMuted },
});

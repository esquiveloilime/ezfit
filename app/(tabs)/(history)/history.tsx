import { StyleSheet, Text } from 'react-native';

import { RunList } from '@/features/run/RunList';
import { t } from '@/i18n';
import { Screen, colors, font } from '@/ui';

export default function HistoryScreen() {
  return (
    <Screen title={t.tabs.history}>
      <Text style={styles.section} accessibilityRole="header">
        {t.run.listTitle}
      </Text>
      <RunList />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { fontSize: font.title, fontWeight: '700', color: colors.text },
});

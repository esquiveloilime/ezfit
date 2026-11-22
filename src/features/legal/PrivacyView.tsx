import { StyleSheet, Text, View } from 'react-native';

import { t } from '@/i18n';
import { Screen, colors, font, spacing } from '@/ui';

/** Aviso de privacidad y descargo de responsabilidad (CUE-09). */
export function PrivacyView() {
  return (
    <Screen>
      <Text style={styles.intro}>{t.privacy.intro}</Text>
      {t.privacy.sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.title} accessibilityRole="header">
            {section.title}
          </Text>
          {section.items.map((item) => (
            <Text key={item} style={styles.item}>
              {`•  ${item}`}
            </Text>
          ))}
        </View>
      ))}
      <Text style={styles.updated}>{t.privacy.updated}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: font.body, color: colors.text },
  section: { gap: spacing.sm },
  title: { fontSize: font.title, fontWeight: '700', color: colors.text },
  item: { fontSize: font.body, color: colors.text, lineHeight: font.body * 1.4 },
  updated: { fontSize: font.small, color: colors.textMuted },
});

import { StyleSheet, Text } from 'react-native';

import { t } from '@/i18n';
import { openAppSettings } from '@/services/location';
import { Button, Card, Screen, colors, font } from '@/ui';

/**
 * Ayuda para quitar la restricción de batería en teléfonos Samsung, que pueden detener la
 * grabación con la pantalla apagada (RUN-10; plan técnico, sección 6, fase B).
 */
export function BatteryHelpView() {
  return (
    <Screen>
      <Card>
        <Text style={styles.body}>{t.run.battery.intro}</Text>
        <Text style={styles.steps}>{t.run.battery.steps}</Text>
      </Card>
      <Button label={t.run.battery.open} onPress={openAppSettings} />
      <Card>
        <Text style={styles.body}>{t.run.battery.sleeping}</Text>
        <Text style={styles.hint}>{t.run.battery.permission}</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: font.body, color: colors.text },
  steps: { fontSize: font.body, color: colors.text, fontWeight: '600' },
  hint: { fontSize: font.small, color: colors.textMuted },
});

import { Stack } from 'expo-router';

import { BatteryHelpView } from '@/features/run/BatteryHelpView';
import { t } from '@/i18n';

export default function RunBatteryScreen() {
  return (
    <>
      <Stack.Screen options={{ title: t.run.battery.title }} />
      <BatteryHelpView />
    </>
  );
}

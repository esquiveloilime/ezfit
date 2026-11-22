import { Stack } from 'expo-router';

import { RunLiveView } from '@/features/run/RunLiveView';
import { t } from '@/i18n';

export default function RunLiveScreen() {
  return (
    <>
      <Stack.Screen options={{ title: t.tabs.run }} />
      <RunLiveView />
    </>
  );
}

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LOCAL_OWNER } from '@/db/client';
import { DatabaseProvider } from '@/db/DatabaseProvider';
import { t } from '@/i18n';
import { colors } from '@/ui';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <DatabaseProvider owner={LOCAL_OWNER}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            headerTintColor: colors.primary,
            headerTitleStyle: { color: colors.text },
            headerBackButtonDisplayMode: 'minimal',
          }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="exercises/index"
            options={{ headerShown: true, title: t.exercises.catalogTitle }}
          />
          <Stack.Screen
            name="exercises/[id]"
            options={{ headerShown: true, title: t.exercises.detailTitle }}
          />
        </Stack>
      </DatabaseProvider>
    </SafeAreaProvider>
  );
}

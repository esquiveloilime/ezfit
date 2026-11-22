import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { type ReactNode, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DatabaseProvider } from '@/db/DatabaseProvider';
import { ownerFor, useAccount } from '@/features/account/accountStore';
import { t } from '@/i18n';
import { configureNotifications } from '@/services/notifications';
import { AutoSync } from '@/sync';
import { colors } from '@/ui';

void SplashScreen.preventAutoHideAsync();
configureNotifications();

/** Abre la base de datos del dueño actual; en la bienvenida no hace falta ninguna. */
function WithDatabase({ owner, children }: { owner: string | null; children: ReactNode }) {
  if (!owner) return <>{children}</>;
  return <DatabaseProvider owner={owner}>{children}</DatabaseProvider>;
}

export default function RootLayout() {
  const loaded = useAccount((s) => s.loaded);
  const mode = useAccount((s) => s.mode);
  const user = useAccount((s) => s.user);
  const load = useAccount((s) => s.load);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (loaded) void SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  const owner = ownerFor({ mode, user });

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <WithDatabase key={owner ?? 'welcome'} owner={owner}>
        {/* Solo con cuenta: en modo sin cuenta no se sincroniza nada (CUE-07). */}
        {mode === 'user' ? <AutoSync /> : null}
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            headerTintColor: colors.primary,
            headerTitleStyle: { color: colors.text },
            headerBackButtonDisplayMode: 'minimal',
          }}>
          {/* Bienvenida: solo cuando no hay modo elegido (CUE-00). */}
          <Stack.Protected guard={mode === 'welcome'}>
            <Stack.Screen name="(auth)/welcome" />
          </Stack.Protected>

          {/* Pantallas principales: con o sin cuenta. Las de cada sección viven dentro de (tabs). */}
          <Stack.Protected guard={mode !== 'welcome'}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
          </Stack.Protected>

          {/* Registro e inicio de sesión: desde la bienvenida o desde el modo sin cuenta. */}
          <Stack.Protected guard={mode !== 'user'}>
            <Stack.Screen name="(auth)/sign-up" options={{ headerShown: true, title: '' }} />
            <Stack.Screen name="(auth)/sign-in" options={{ headerShown: true, title: '' }} />
          </Stack.Protected>

          {/* Aviso de privacidad: desde la bienvenida y desde Perfil (CUE-09). */}
          <Stack.Screen name="privacy" options={{ headerShown: true, title: t.privacy.title }} />
        </Stack>
      </WithDatabase>
    </SafeAreaProvider>
  );
}

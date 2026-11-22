import { Stack } from 'expo-router';

import { colors } from './tokens';

/**
 * Pila de pantallas de una sección. Cada sección de la barra inferior tiene la suya, así la
 * barra sigue a la vista en las pantallas que se abren desde ahí. `root` es la pantalla
 * principal de la sección, que no lleva encabezado.
 */
export function TabStack({ root }: { root: string }) {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        title: '',
        contentStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text },
        headerBackButtonDisplayMode: 'minimal',
      }}>
      <Stack.Screen name={root} options={{ headerShown: false }} />
    </Stack>
  );
}

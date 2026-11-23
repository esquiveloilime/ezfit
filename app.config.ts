import type { ConfigContext, ExpoConfig } from 'expo/config';

// Configuración que no puede ir en app.json porque usa valores secretos (plan técnico, sección 10).
// La clave de Google Maps la entrega EAS como variable de entorno al compilar; nunca va en el
// repositorio. Sin ella (por ejemplo, en Expo Go) el plugin no agrega nada.
//
// La librería de Google (CUE-08) no lleva plugin: en Android no lo necesita, y en iOS pide un
// ID de cliente de iOS que no existe porque iOS no se verifica en esta versión (RNF-07).
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'ezfit',
  slug: config.slug ?? 'ezfit',
  plugins: [
    ...(config.plugins ?? []),
    ['react-native-maps', { androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY }],
  ],
});

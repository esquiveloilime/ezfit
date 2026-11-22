import * as Location from 'expo-location';
import { Linking } from 'react-native';

import type { Fix } from '@/domain/run';

// Envoltura de expo-location (plan técnico, sección 3: servicios). La ubicación solo se lee
// en la sección Correr y durante una actividad (RNF-05).

export type PermissionState = 'undetermined' | 'granted' | 'denied';
export type Permission = { state: PermissionState; canAskAgain: boolean };

function toPermission(response: Location.LocationPermissionResponse): Permission {
  if (response.granted) return { state: 'granted', canAskAgain: true };
  if (response.status === Location.PermissionStatus.UNDETERMINED) return { state: 'undetermined', canAskAgain: true };
  return { state: 'denied', canAskAgain: response.canAskAgain };
}

export async function getLocationPermission(): Promise<Permission> {
  return toPermission(await Location.getForegroundPermissionsAsync());
}

export async function requestLocationPermission(): Promise<Permission> {
  return toPermission(await Location.requestForegroundPermissionsAsync());
}

/** Si la ubicación del teléfono está apagada, no llega ninguna lectura aunque haya permiso. */
export async function locationServicesEnabled(): Promise<boolean> {
  try {
    return await Location.hasServicesEnabledAsync();
  } catch {
    return true;
  }
}

/**
 * Última ubicación que el teléfono ya conoce, sin esperar al GPS. Sirve solo para centrar el
 * mapa al abrir; no cuenta como señal ni se guarda en la ruta.
 */
export async function lastKnownLocation(): Promise<Fix | null> {
  try {
    const location = await Location.getLastKnownPositionAsync();
    if (!location) return null;
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy ?? null,
      timestamp: location.timestamp,
    };
  } catch {
    return null;
  }
}

export function openAppSettings(): void {
  void Linking.openSettings();
}

/**
 * Lectura continua con la máxima precisión, aproximadamente una por segundo (plan técnico,
 * sección 6). Devuelve la función para dejar de leer.
 */
export async function watchLocation(onFix: (fix: Fix) => void): Promise<() => void> {
  const subscription = await Location.watchPositionAsync(
    { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 0 },
    (location) =>
      onFix({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy ?? null,
        timestamp: location.timestamp,
      }),
  );
  return () => subscription.remove();
}

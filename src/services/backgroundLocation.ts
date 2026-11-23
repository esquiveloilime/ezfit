import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import type { Fix } from '@/domain/run';

// Seguimiento con la pantalla apagada (RUN-10; plan técnico, sección 6, fase B). Android
// mantiene la lectura del GPS con un servicio en primer plano, que muestra una notificación
// permanente mientras la actividad está activa. En Expo Go no existe: ahí se graba con la
// pantalla encendida.

export const RUN_LOCATION_TASK = 'ezfit-run-location';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** Solo en la build de desarrollo y en la APK de Android (RNF-07: iOS no se verifica). */
export function backgroundSupported(): boolean {
  return !isExpoGo && Platform.OS === 'android';
}

export type BackgroundPermission = { granted: boolean; canAskAgain: boolean };

export async function getBackgroundPermission(): Promise<BackgroundPermission> {
  if (!backgroundSupported()) return { granted: false, canAskAgain: false };
  try {
    const response = await Location.getBackgroundPermissionsAsync();
    return { granted: response.granted, canAskAgain: response.canAskAgain };
  } catch {
    return { granted: false, canAskAgain: false };
  }
}

/**
 * Pide "Permitir todo el tiempo". En Android 11 o más nuevo el sistema abre la pantalla de
 * permisos de ezfit, y la respuesta llega al volver a la app.
 */
export async function requestBackgroundPermission(): Promise<BackgroundPermission> {
  if (!backgroundSupported()) return { granted: false, canAskAgain: false };
  try {
    const response = await Location.requestBackgroundPermissionsAsync();
    return { granted: response.granted, canAskAgain: response.canAskAgain };
  } catch {
    return { granted: false, canAskAgain: false };
  }
}

type TaskData = { locations?: Location.LocationObject[] };

/**
 * Registra qué hacer con las lecturas que llegan en segundo plano. Tiene que llamarse al
 * cargar la app, fuera de cualquier pantalla, como exige expo-task-manager.
 */
export function defineRunLocationTask(onFixes: (fixes: Fix[]) => void): void {
  if (!backgroundSupported() || TaskManager.isTaskDefined(RUN_LOCATION_TASK)) return;
  TaskManager.defineTask<TaskData>(RUN_LOCATION_TASK, async ({ data, error }) => {
    if (error) {
      console.warn('Error en la ubicación en segundo plano', error.message);
      return;
    }
    const fixes = (data?.locations ?? []).map(
      (location): Fix => ({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy ?? null,
        timestamp: location.timestamp,
      }),
    );
    if (fixes.length > 0) onFixes(fixes);
  });
}

export type ServiceNotice = { title: string; body: string };

/**
 * Empieza a leer el GPS también con la pantalla apagada, con la misma precisión y frecuencia
 * que con la app abierta. Si la app se cierra, el servicio se detiene con ella y al volver
 * se ofrece guardar lo registrado (RUN-08).
 */
export async function startBackgroundLocation(notice: ServiceNotice): Promise<void> {
  await Location.startLocationUpdatesAsync(RUN_LOCATION_TASK, {
    accuracy: Location.Accuracy.BestForNavigation,
    timeInterval: 1000,
    distanceInterval: 0,
    foregroundService: {
      notificationTitle: notice.title,
      notificationBody: notice.body,
      killServiceOnDestroy: true,
    },
  });
}

export async function stopBackgroundLocation(): Promise<void> {
  if (!backgroundSupported()) return;
  try {
    if (await Location.hasStartedLocationUpdatesAsync(RUN_LOCATION_TASK)) {
      await Location.stopLocationUpdatesAsync(RUN_LOCATION_TASK);
    }
  } catch (error) {
    console.warn('No se pudo detener la ubicación en segundo plano', error);
  }
}

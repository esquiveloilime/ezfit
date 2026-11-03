// Se importan solo las piezas de notificaciones locales. El índice de expo-notifications
// también carga el módulo de temas push, que Expo Go en Android ya no trae, y la app se cae
// al abrir ("Cannot find native module ExpoTopicSubscriptionModule").
import { cancelScheduledNotificationAsync } from 'expo-notifications/build/cancelScheduledNotificationAsync';
import { dismissNotificationAsync } from 'expo-notifications/build/dismissNotificationAsync';
import { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';
import { getPermissionsAsync, requestPermissionsAsync } from 'expo-notifications/build/NotificationPermissions';
import { SchedulableTriggerInputTypes } from 'expo-notifications/build/Notifications.types';
import { addNotificationReceivedListener } from 'expo-notifications/build/NotificationsEmitter';
import { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
import { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
import { setNotificationChannelAsync } from 'expo-notifications/build/setNotificationChannelAsync';
import { Platform } from 'react-native';

// Notificaciones locales del temporizador de descanso (SES-08; plan técnico, sección 7).
// Solo locales: no se usan notificaciones push.

export type RestAlert = { sound: boolean; vibration: boolean };
export type RestMessage = { title: string; body: string; channelName: string };

const REST_KIND = 'rest-timer';
const VIBRATION_PATTERN = [0, 400, 200, 400];

/**
 * En Android el sonido y la vibración dependen del canal, y un canal no se puede cambiar
 * después de crearlo. Por eso hay un canal por combinación de los ajustes de sonido y
 * vibración (AJU-02).
 */
function channelId({ sound, vibration }: RestAlert): string {
  return `rest-${sound ? 's' : 'n'}${vibration ? 'v' : 'n'}`;
}

let configured = false;

/**
 * Prepara las notificaciones al abrir la app. Con la app en pantalla, el aviso del final
 * del descanso suena pero no se queda en la barra de notificaciones: se quita al llegar.
 */
export function configureNotifications(): void {
  if (configured) return;
  configured = true;
  try {
    setNotificationHandler({
      handleNotification: async (notification) => {
        const isRest = notification.request.content.data?.kind === REST_KIND;
        return {
          shouldShowBanner: !isRest,
          // En Android la notificación tiene que publicarse para que suene; se quita enseguida.
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        };
      },
    });
    addNotificationReceivedListener((notification) => {
      if (notification.request.content.data?.kind === REST_KIND) {
        setTimeout(() => {
          dismissNotificationAsync(notification.request.identifier).catch(() => undefined);
        }, 3000);
      }
    });
  } catch (error) {
    console.warn('No se pudieron preparar las notificaciones', error);
  }
}

/**
 * Crea el canal de Android del aviso. Expo Go no permite crear canales propios: si falla,
 * se usa el canal por defecto de la app y el aviso llega igual.
 */
async function ensureChannel(alert: RestAlert, name: string): Promise<string | undefined> {
  if (Platform.OS !== 'android') return undefined;
  const id = channelId(alert);
  try {
    await setNotificationChannelAsync(id, {
      name,
      importance: AndroidImportance.HIGH,
      sound: alert.sound ? 'default' : null,
      enableVibrate: alert.vibration,
      vibrationPattern: alert.vibration ? VIBRATION_PATTERN : null,
    });
  } catch {
    return undefined;
  }
  return id;
}

/** Pide el permiso de notificaciones la primera vez que hace falta. Sin permiso, no se avisa. */
async function hasPermission(): Promise<boolean> {
  const current = await getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = await requestPermissionsAsync();
  return asked.granted;
}

/**
 * Programa el aviso del final del descanso. Devuelve su identificador, o `null` si no se
 * pudo (sin permiso, o el sistema lo rechazó); el temporizador sigue funcionando igual.
 */
export async function scheduleRestEnd(endsAt: number, alert: RestAlert, message: RestMessage): Promise<string | null> {
  try {
    if (!(await hasPermission())) return null;
    const channel = await ensureChannel(alert, message.channelName);
    return await scheduleNotificationAsync({
      content: {
        title: message.title,
        body: message.body,
        sound: alert.sound ? 'default' : false,
        vibrate: alert.vibration ? VIBRATION_PATTERN : undefined,
        data: { kind: REST_KIND },
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: endsAt,
        channelId: channel,
      },
    });
  } catch (error) {
    console.warn('No se pudo programar el aviso de descanso', error);
    return null;
  }
}

export async function cancelRestEnd(id: string | null): Promise<void> {
  if (!id) return;
  try {
    await cancelScheduledNotificationAsync(id);
  } catch {
    // Si ya se mostró o no existe, no hay nada que cancelar.
  }
}

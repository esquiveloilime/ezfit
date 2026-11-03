import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import type { Fix } from '@/domain/run';
import {
  getLocationPermission,
  locationServicesEnabled,
  type Permission,
  requestLocationPermission,
  watchLocation,
} from '@/services/location';

/**
 * Estado del permiso de ubicación (RUN-01). Se vuelve a revisar al regresar a la app,
 * por si el usuario lo activó desde los ajustes del teléfono.
 */
export function useLocationPermission() {
  const [permission, setPermission] = useState<Permission | null>(null);

  const refresh = useCallback(() => {
    getLocationPermission()
      .then(setPermission)
      .catch(() => setPermission({ state: 'denied', canAskAgain: false }));
  }, []);

  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const request = useCallback(async () => {
    try {
      setPermission(await requestLocationPermission());
    } catch {
      setPermission({ state: 'denied', canAskAgain: false });
    }
  }, []);

  return { permission, request };
}

/**
 * Lecturas del GPS mientras la pantalla está a la vista (RNF-05: solo en Correr). También
 * avisa si la ubicación del teléfono está apagada.
 */
export function useLiveFix(enabled: boolean) {
  const [fix, setFix] = useState<Fix | null>(null);
  const [servicesOn, setServicesOn] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!enabled) return undefined;
      let stop: (() => void) | null = null;
      let cancelled = false;
      void locationServicesEnabled().then((on) => {
        if (!cancelled) setServicesOn(on);
      });
      watchLocation(setFix)
        .then((remove) => {
          if (cancelled) remove();
          else stop = remove;
        })
        .catch((error) => console.warn('No se pudo leer la ubicación', error));
      return () => {
        cancelled = true;
        stop?.();
      };
    }, [enabled]),
  );

  return { fix, servicesOn };
}

/** Fuerza a volver a dibujar cada `ms` milisegundos (para la antigüedad de la señal y los relojes). */
export function useNow(ms = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

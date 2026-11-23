import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import type { Db } from '@/db/client';
import { getMeta, setMeta } from '@/db/repositories/meta';
import type { BackgroundAccess, Fix } from '@/domain/run';
import {
  backgroundSupported,
  getBackgroundPermission,
  requestBackgroundPermission,
} from '@/services/backgroundLocation';
import {
  getLocationPermission,
  lastKnownLocation,
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

const BACKGROUND_ASKED_KEY = 'background_location_asked';

/**
 * Permiso de ubicación "todo el tiempo" para grabar con la pantalla apagada (RUN-10). Como el
 * de la app abierta, se vuelve a revisar al regresar a la app.
 */
export function useBackgroundAccess(db: Db) {
  const [access, setAccess] = useState<BackgroundAccess | null>(null);

  const refresh = useCallback(
    (): Promise<BackgroundAccess> =>
      getBackgroundPermission().then((permission) => {
        const next: BackgroundAccess = {
          supported: backgroundSupported(),
          ...permission,
          asked: getMeta(db, BACKGROUND_ASKED_KEY) !== null,
        };
        setAccess(next);
        return next;
      }),
    [db],
  );

  useEffect(() => {
    void refresh();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  /** Pide el permiso (después de la explicación) y recuerda que ya se pidió. */
  const request = useCallback(async (): Promise<BackgroundAccess> => {
    setMeta(db, BACKGROUND_ASKED_KEY, '1');
    await requestBackgroundPermission();
    return refresh();
  }, [db, refresh]);

  /** Al elegir «Ahora no»: no se vuelve a preguntar al iniciar. */
  const decline = useCallback(() => {
    setMeta(db, BACKGROUND_ASKED_KEY, '1');
    void refresh();
  }, [db, refresh]);

  return { access, request, decline };
}

/**
 * Lecturas del GPS mientras la pantalla está a la vista (RNF-05: solo en Correr). También
 * avisa si la ubicación del teléfono está apagada. `center` es donde se centra el mapa: la
 * lectura actual o, mientras llega, la última ubicación conocida del teléfono.
 */
export function useLiveFix(enabled: boolean) {
  const [fix, setFix] = useState<Fix | null>(null);
  const [lastKnown, setLastKnown] = useState<Fix | null>(null);
  const [servicesOn, setServicesOn] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!enabled) return undefined;
      let stop: (() => void) | null = null;
      let cancelled = false;
      void locationServicesEnabled().then((on) => {
        if (!cancelled) setServicesOn(on);
      });
      void lastKnownLocation().then((known) => {
        if (!cancelled && known) setLastKnown(known);
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

  return { fix, servicesOn, center: fix ?? lastKnown };
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

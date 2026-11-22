import { useNetworkState } from 'expo-network';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { type LatLng, Polyline, type Region } from 'react-native-maps';

import { t } from '@/i18n';
import { colors, font, radius, spacing } from '@/ui';

type Props = {
  /** Si cambia, el mapa se mueve para seguirlo (RUN-02, RUN-03). */
  follow?: LatLng | null;
  /** Ruta por tramos: cada tramo es una línea aparte (RUN-04). */
  segments?: readonly (readonly LatLng[])[];
  /** Ajustar la vista a toda la ruta (RUN-05). */
  fitRoute?: boolean;
  showsUser?: boolean;
  /** Alto fijo. Si no se da, el mapa ocupa el espacio que le deje la pantalla. */
  height?: number;
  /** Lo que va encimado sobre el mapa, arriba a la izquierda (por ejemplo, la señal GPS). */
  overlay?: ReactNode;
};

const FOLLOW_ZOOM = 17;
const FIT_PADDING = { top: 40, right: 40, bottom: 40, left: 40 };
// Vista inicial si todavía no se sabe dónde está el usuario: el país completo.
const COUNTRY_REGION = { latitude: 23.6, longitude: -102.5, latitudeDelta: 25, longitudeDelta: 25 };
// Equivale más o menos a FOLLOW_ZOOM, para abrir el mapa ya cerca del usuario.
const CLOSE_DELTA = 0.005;

function regionAround(point: LatLng | null): Region {
  if (!point) return COUNTRY_REGION;
  return { ...point, latitudeDelta: CLOSE_DELTA, longitudeDelta: CLOSE_DELTA };
}

/** Mapa de running. Sin internet la ruta se dibuja igual y se avisa que el mapa aparecerá después (RUN-09). */
export function RunMap({ follow = null, segments = [], fitRoute = false, showsUser = false, height, overlay }: Props) {
  const ref = useRef<MapView>(null);
  const [ready, setReady] = useState(false);
  // Si ya se sabe dónde está el usuario al abrir, el mapa empieza ahí y no en todo el país.
  const [initialRegion] = useState(() => regionAround(follow));
  const centered = useRef(false);
  const network = useNetworkState();
  const offline = network.isConnected === false || network.isInternetReachable === false;
  const lat = follow?.latitude;
  const lng = follow?.longitude;

  // Se espera a que el mapa esté listo: un movimiento pedido antes se pierde y el mapa se
  // quedaría viendo todo el país.
  useEffect(() => {
    if (!ready || lat === undefined || lng === undefined) return;
    const duration = centered.current ? 400 : 0;
    centered.current = true;
    ref.current?.animateCamera({ center: { latitude: lat, longitude: lng }, zoom: FOLLOW_ZOOM }, { duration });
  }, [ready, lat, lng]);

  function onReady() {
    setReady(true);
    if (!fitRoute) return;
    const all = segments.flat();
    if (all.length > 1) ref.current?.fitToCoordinates([...all], { edgePadding: FIT_PADDING, animated: false });
    else if (all[0]) ref.current?.animateCamera({ center: all[0], zoom: FOLLOW_ZOOM }, { duration: 0 });
  }

  return (
    <View style={[styles.container, height === undefined ? styles.fill : { height }]}>
      <MapView
        ref={ref}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        showsUserLocation={showsUser}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        onMapReady={onReady}
        accessibilityLabel={t.run.mapA11y}>
        {segments.map((segment, i) =>
          segment.length > 1 ? (
            <Polyline key={i} coordinates={[...segment]} strokeColor={colors.primary} strokeWidth={5} />
          ) : null,
        )}
      </MapView>
      {overlay || offline ? (
        <View style={styles.overlay} pointerEvents="box-none">
          {overlay}
          {offline ? (
            <View style={styles.offline}>
              <Text style={styles.offlineText}>{t.run.offlineMap}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.border },
  fill: { flex: 1, minHeight: 220 },
  overlay: { position: 'absolute', left: spacing.sm, right: spacing.sm, top: spacing.sm, gap: spacing.sm },
  offline: { padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.warningSoft },
  offlineText: { fontSize: font.small, color: colors.warning },
});

import { useNetworkState } from 'expo-network';
import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { type LatLng, Polyline } from 'react-native-maps';

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
  height?: number;
};

const FOLLOW_ZOOM = 17;
const FIT_PADDING = { top: 40, right: 40, bottom: 40, left: 40 };
// Vista inicial mientras llega la primera lectura: el país completo.
const INITIAL_REGION = { latitude: 23.6, longitude: -102.5, latitudeDelta: 25, longitudeDelta: 25 };

/** Mapa de running. Sin internet la ruta se dibuja igual y se avisa que el mapa aparecerá después (RUN-09). */
export function RunMap({ follow = null, segments = [], fitRoute = false, showsUser = false, height = 300 }: Props) {
  const ref = useRef<MapView>(null);
  const network = useNetworkState();
  const offline = network.isConnected === false || network.isInternetReachable === false;
  const lat = follow?.latitude;
  const lng = follow?.longitude;

  useEffect(() => {
    if (lat === undefined || lng === undefined) return;
    ref.current?.animateCamera({ center: { latitude: lat, longitude: lng }, zoom: FOLLOW_ZOOM }, { duration: 400 });
  }, [lat, lng]);

  function fit() {
    if (!fitRoute) return;
    const all = segments.flat();
    if (all.length > 1) ref.current?.fitToCoordinates([...all], { edgePadding: FIT_PADDING, animated: false });
    else if (all[0]) ref.current?.animateCamera({ center: all[0], zoom: FOLLOW_ZOOM }, { duration: 0 });
  }

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={ref}
        style={StyleSheet.absoluteFill}
        initialRegion={INITIAL_REGION}
        showsUserLocation={showsUser}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        onMapReady={fit}
        accessibilityLabel={t.run.mapA11y}>
        {segments.map((segment, i) =>
          segment.length > 1 ? (
            <Polyline key={i} coordinates={[...segment]} strokeColor={colors.primary} strokeWidth={5} />
          ) : null,
        )}
      </MapView>
      {offline ? (
        <View style={styles.offline}>
          <Text style={styles.offlineText}>{t.run.offlineMap}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.border },
  offline: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    top: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.warningSoft,
  },
  offlineText: { fontSize: font.small, color: colors.warning },
});

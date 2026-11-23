import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { t } from '@/i18n';
import { isGoogleSignInAvailable } from '@/services/googleAuth';
import { Button, colors, font, spacing } from '@/ui';

import { useAccount } from './accountStore';

/**
 * Botón "Continuar con Google" (CUE-08). No aparece en Expo Go ni si falta la configuración.
 * Si todo sale bien, la navegación cambia sola a las pantallas de la cuenta.
 */
export function GoogleButton({ disabled = false, onBusyChange }: { disabled?: boolean; onBusyChange?: (busy: boolean) => void }) {
  const signInWithGoogle = useAccount((s) => s.signInWithGoogle);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isGoogleSignInAvailable()) return null;

  async function onPress() {
    setError(null);
    setBusy(true);
    onBusyChange?.(true);
    const result = await signInWithGoogle();
    setBusy(false);
    onBusyChange?.(false);
    if (!result.ok && result.error !== 'cancelled') setError(t.auth.errors[result.error]);
  }

  return (
    <View style={styles.wrap}>
      <Button
        variant="secondary"
        label={t.auth.continueWithGoogle}
        onPress={() => void onPress()}
        loading={busy}
        disabled={disabled}
      />
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="assertive">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  error: { fontSize: font.body, color: colors.danger },
});

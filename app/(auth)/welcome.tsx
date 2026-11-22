import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAccount } from '@/features/account/accountStore';
import { t } from '@/i18n';
import { Button, Screen, colors, font, spacing } from '@/ui';

/** Pantalla de bienvenida (CUE-00), con el aviso de privacidad (CUE-09). "Continuar con Google" llega en I-25 (CUE-08). */
export default function WelcomeScreen() {
  const startGuest = useAccount((s) => s.startGuest);
  const [busy, setBusy] = useState(false);

  async function onStartGuest() {
    setBusy(true);
    await startGuest();
    // La navegación cambia sola a las pantallas principales.
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.brand} accessibilityRole="header">
          {t.appName}
        </Text>
        <Text style={styles.tagline}>{t.welcome.tagline}</Text>
      </View>
      <View style={styles.actions}>
        <Button
          label={t.welcome.startGuest}
          accessibilityHint={t.welcome.startGuestHint}
          onPress={() => void onStartGuest()}
          loading={busy}
        />
        <Text style={styles.note}>{t.welcome.guestNote}</Text>
        <Button
          variant="secondary"
          label={t.welcome.createAccount}
          onPress={() => router.push('/sign-up')}
          disabled={busy}
        />
        <Button
          variant="secondary"
          label={t.welcome.signIn}
          onPress={() => router.push('/sign-in')}
          disabled={busy}
        />
        <Text style={styles.legal}>{t.privacy.accept}</Text>
        <Button variant="ghost" label={t.privacy.read} onPress={() => router.push('/privacy')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { paddingTop: spacing.xxl * 2, paddingBottom: spacing.xxl, gap: spacing.md, alignItems: 'center' },
  brand: { fontSize: 44, fontWeight: '800', color: colors.primary },
  tagline: { fontSize: font.body, color: colors.textMuted, textAlign: 'center' },
  actions: { gap: spacing.md },
  legal: { fontSize: font.small, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md },
  note: { fontSize: font.small, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.md },
});

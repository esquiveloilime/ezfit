import { router } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { useAccount } from '@/features/account/accountStore';
import { SyncStatusCard } from '@/features/account/SyncStatusCard';
import { useProfile } from '@/features/onboarding/useProfile';
import { IncrementSetting } from '@/features/settings/IncrementSetting';
import { RestSettings } from '@/features/settings/RestSettings';
import { WeightUnitSetting } from '@/features/settings/WeightUnitSetting';
import { format, t } from '@/i18n';
import { requestSync, usePendingCount } from '@/sync';
import { Button, Card, Screen, colors, font, spacing } from '@/ui';

export default function ProfileScreen() {
  const mode = useAccount((s) => s.mode);
  const user = useAccount((s) => s.user);
  const signOut = useAccount((s) => s.signOut);
  const { profile } = useProfile();

  const pending = usePendingCount();

  function confirmSignOut() {
    // Con cambios sin subir se avisa y se ofrece subirlos primero (CUE-03).
    if (pending > 0) {
      Alert.alert(t.profile.signOutPendingTitle, format(t.profile.signOutPendingBody, { n: pending }), [
        { text: t.common.cancel, style: 'cancel' },
        { text: t.sync.button, onPress: () => void requestSync() },
        { text: t.profile.signOut, style: 'destructive', onPress: () => void signOut() },
      ]);
      return;
    }
    Alert.alert(t.profile.signOutConfirmTitle, t.profile.signOutConfirmBody, [
      { text: t.common.cancel, style: 'cancel' },
      { text: t.profile.signOut, style: 'destructive', onPress: () => void signOut() },
    ]);
  }

  return (
    <Screen title={t.tabs.profile}>
      {mode === 'guest' ? (
        <Card>
          <Text style={styles.title}>{t.profile.guestTitle}</Text>
          <Text style={styles.warning}>{t.profile.guestWarning}</Text>
          <View style={styles.buttons}>
            <Button label={t.profile.createAccount} onPress={() => router.push('/sign-up')} />
            <Button
              variant="secondary"
              label={t.profile.signIn}
              onPress={() => router.push('/sign-in')}
            />
          </View>
        </Card>
      ) : (
        <Card>
          <Text style={styles.title}>{t.profile.accountTitle}</Text>
          <Text style={styles.body}>{user?.email}</Text>
          <View style={styles.buttons}>
            <Button variant="secondary" label={t.profile.signOut} onPress={confirmSignOut} />
          </View>
        </Card>
      )}
      {mode === 'user' ? <SyncStatusCard /> : null}
      <Text style={styles.section}>{t.settings.title}</Text>
      {profile ? <WeightUnitSetting profile={profile} /> : null}
      {profile ? <IncrementSetting profile={profile} /> : null}
      {profile ? <RestSettings profile={profile} /> : null}
      <Button variant="secondary" label={t.privacy.profileEntry} onPress={() => router.push('/privacy')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: font.title, fontWeight: '600', color: colors.text },
  warning: { fontSize: font.body, color: colors.warning },
  body: { fontSize: font.body, color: colors.text },
  buttons: { gap: spacing.sm, marginTop: spacing.sm },
  section: { fontSize: font.title, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
});

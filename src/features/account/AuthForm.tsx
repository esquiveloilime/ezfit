import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { isValidEmail, isValidPassword } from '@/domain/auth';
import { t } from '@/i18n';
import { isSupabaseConfigured } from '@/services/supabase';
import { Button, Card, Screen, TextField, colors, font, spacing } from '@/ui';

import { type AccountResult, useAccount } from './accountStore';
import { GoogleButton } from './GoogleButton';

type Kind = 'sign-up' | 'sign-in';

/** Formulario de registro o inicio de sesión con correo y contraseña (CUE-01, CUE-02); el de inicio de sesión también ofrece Google (CUE-08). */
export function AuthForm({ kind }: { kind: Kind }) {
  const mode = useAccount((s) => s.mode);
  const signUp = useAccount((s) => s.signUp);
  const signIn = useAccount((s) => s.signIn);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const isSignUp = kind === 'sign-up';
  const fromGuest = mode === 'guest';

  async function submit() {
    setFormError(null);
    const badEmail = !isValidEmail(email);
    const badPassword = isSignUp ? !isValidPassword(password) : password.length === 0;
    setEmailError(badEmail ? t.auth.invalidEmail : null);
    setPasswordError(badPassword ? (isSignUp ? t.auth.shortPassword : t.auth.missingPassword) : null);
    if (badEmail || badPassword) return;

    setBusy(true);
    const result: AccountResult = isSignUp ? await signUp(email, password) : await signIn(email, password);
    setBusy(false);
    if (!result.ok) setFormError(t.auth.errors[result.error]);
    // Si todo salió bien, la navegación cambia sola a las pantallas de la cuenta.
  }

  function switchForm() {
    router.replace(isSignUp ? '/sign-in' : '/sign-up');
  }

  return (
    <Screen title={isSignUp ? t.auth.signUpTitle : t.auth.signInTitle}>
      <Text style={styles.intro}>
        {fromGuest
          ? isSignUp
            ? t.auth.signUpFromGuest
            : t.auth.signInFromGuest
          : isSignUp
            ? t.auth.signUpIntro
            : null}
      </Text>
      {!isSupabaseConfigured() ? (
        <Card>
          <Text style={styles.note}>{t.auth.notConfiguredNote}</Text>
        </Card>
      ) : null}
      <View style={styles.fields}>
        <TextField
          label={t.auth.emailLabel}
          placeholder={t.auth.emailPlaceholder}
          value={email}
          onChangeText={setEmail}
          error={emailError}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="next"
        />
        <TextField
          label={t.auth.passwordLabel}
          placeholder={isSignUp ? t.auth.passwordPlaceholder : undefined}
          value={password}
          onChangeText={setPassword}
          error={passwordError}
          password={{ showLabel: t.auth.showPassword, hideLabel: t.auth.hidePassword }}
          autoCapitalize="none"
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          textContentType={isSignUp ? 'newPassword' : 'password'}
          returnKeyType="done"
          onSubmitEditing={() => void submit()}
        />
      </View>
      {formError ? (
        <Text style={styles.formError} accessibilityLiveRegion="assertive">
          {formError}
        </Text>
      ) : null}
      <Button
        label={isSignUp ? t.auth.signUpButton : t.auth.signInButton}
        onPress={() => void submit()}
        loading={busy}
        disabled={googleBusy}
      />
      {!isSignUp ? <GoogleButton disabled={busy} onBusyChange={setGoogleBusy} /> : null}
      {!isSignUp ? (
        <Button
          variant="ghost"
          label={t.auth.forgotLink}
          onPress={() => router.push('/forgot-password')}
          disabled={busy}
        />
      ) : null}
      <Button
        variant="ghost"
        label={isSignUp ? t.auth.haveAccount : t.auth.noAccount}
        onPress={switchForm}
        disabled={busy}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: font.body, color: colors.textMuted },
  note: { fontSize: font.body, color: colors.warning },
  fields: { gap: spacing.lg },
  formError: { fontSize: font.body, color: colors.danger },
});

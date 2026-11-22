import { useLinkingURL } from 'expo-linking';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { isValidEmail, isValidPassword, parseRecoveryUrl, recoveryUrlError } from '@/domain/auth';
import { t } from '@/i18n';
import { completePasswordReset, passwordResetRedirect, requestPasswordReset } from '@/services/auth';
import { Button, Card, Screen, TextField, colors, font } from '@/ui';

import { useAccount } from './accountStore';

/** Pedir el correo para restablecer la contraseña, desde Iniciar sesión (CUE-04). */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setFormError(null);
    if (!isValidEmail(email)) {
      setEmailError(t.auth.invalidEmail);
      return;
    }
    setEmailError(null);
    setBusy(true);
    const result = await requestPasswordReset(email, passwordResetRedirect());
    setBusy(false);
    if (result.ok) setSent(true);
    else setFormError(t.auth.errors[result.error]);
  }

  return (
    <Screen title={t.auth.forgotTitle}>
      {sent ? (
        <Card>
          <Text style={styles.body} accessibilityLiveRegion="polite">
            {t.auth.forgotSent}
          </Text>
        </Card>
      ) : (
        <>
          <Text style={styles.intro}>{t.auth.forgotIntro}</Text>
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
            returnKeyType="send"
            onSubmitEditing={() => void submit()}
          />
          {formError ? (
            <Text style={styles.error} accessibilityLiveRegion="assertive">
              {formError}
            </Text>
          ) : null}
          <Button label={t.auth.forgotButton} onPress={() => void submit()} loading={busy} />
        </>
      )}
    </Screen>
  );
}

/** Contraseña nueva, al abrir la app desde el enlace del correo (CUE-04). */
export function ResetPasswordView() {
  const url = useLinkingURL();
  const mode = useAccount((s) => s.mode);
  const tokens = url ? parseRecoveryUrl(url) : null;
  const linkError = url ? recoveryUrlError(url) : null;

  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  // Con la sesión abierta se vuelve a la app; si no, a Iniciar sesión con la contraseña nueva.
  function leave() {
    if (mode === 'user') router.replace('/');
    else router.replace('/sign-in');
  }

  async function submit() {
    if (!tokens) return;
    setFormError(null);
    if (!isValidPassword(password)) {
      setPasswordError(t.auth.shortPassword);
      return;
    }
    setPasswordError(null);
    setBusy(true);
    const result = await completePasswordReset(tokens, password, { keepSession: mode === 'user' });
    setBusy(false);
    if (result.ok) setDone(true);
    else setFormError(t.auth.errors[result.error]);
  }

  if (done) {
    return (
      <Screen title={t.auth.resetTitle}>
        <Card>
          <Text style={styles.body}>{mode === 'user' ? t.auth.resetDoneSignedIn : t.auth.resetDone}</Text>
        </Card>
        <Button label={mode === 'user' ? t.common.ok : t.auth.resetGoSignIn} onPress={leave} />
      </Screen>
    );
  }

  if (!tokens) {
    return (
      <Screen title={t.auth.resetTitle}>
        <Card>
          <Text style={styles.body}>{linkError ? t.auth.errors.link_expired : t.auth.resetInvalid}</Text>
        </Card>
        <Button label={mode === 'user' ? t.common.ok : t.auth.resetGoSignIn} onPress={leave} />
      </Screen>
    );
  }

  return (
    <Screen title={t.auth.resetTitle}>
      <Text style={styles.intro}>{t.auth.resetIntro}</Text>
      <TextField
        label={t.auth.passwordLabel}
        placeholder={t.auth.passwordPlaceholder}
        value={password}
        onChangeText={setPassword}
        error={passwordError}
        password={{ showLabel: t.auth.showPassword, hideLabel: t.auth.hidePassword }}
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={() => void submit()}
      />
      {formError ? (
        <Text style={styles.error} accessibilityLiveRegion="assertive">
          {formError}
        </Text>
      ) : null}
      <Button label={t.auth.resetButton} onPress={() => void submit()} loading={busy} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: font.body, color: colors.textMuted },
  body: { fontSize: font.body, color: colors.text },
  error: { fontSize: font.body, color: colors.danger },
});

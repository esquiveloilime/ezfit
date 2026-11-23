import Ionicons from '@expo/vector-icons/Ionicons';
import { type Ref, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';

import { colors, font, minTouch, radius, spacing } from './tokens';

type Props = Omit<TextInputProps, 'style' | 'secureTextEntry'> & {
  label: string;
  error?: string | null;
  /**
   * Campo de contraseña: oculta lo escrito y muestra un botón de ojo para verlo.
   * Los textos del botón se pasan desde quien usa el campo (vienen de src/i18n).
   */
  password?: { showLabel: string; hideLabel: string };
  ref?: Ref<TextInput>;
};

export function TextField({ label, error, password, ref, ...inputProps }: Props) {
  const [visible, setVisible] = useState(false);
  const hidden = password ? !visible : false;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.box, error ? styles.boxError : null]}>
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          secureTextEntry={hidden}
          {...inputProps}
        />
        {password ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? password.hideLabel : password.showLabel}
            onPress={() => setVisible((v) => !v)}
            hitSlop={8}
            style={({ pressed }) => [styles.eye, pressed && styles.pressed]}>
            <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={24} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: { fontSize: font.label, color: colors.text, fontWeight: '500' },
  box: {
    minHeight: minTouch,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  boxError: { borderColor: colors.danger },
  input: {
    flex: 1,
    minHeight: minTouch,
    paddingHorizontal: spacing.md,
    fontSize: font.body,
    color: colors.text,
  },
  eye: { width: minTouch, height: minTouch, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
  error: { fontSize: font.small, color: colors.danger },
});

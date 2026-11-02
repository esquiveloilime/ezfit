import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';

import { colors, font, minTouch, radius, spacing } from './tokens';

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string | null;
};

export function TextField({ label, error, ...inputProps }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, error ? styles.inputError : null]}
        {...inputProps}
      />
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
  input: {
    minHeight: minTouch,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: font.body,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  inputError: { borderColor: colors.danger },
  error: { fontSize: font.small, color: colors.danger },
});

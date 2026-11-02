import { StyleSheet, Text, View } from 'react-native';

import { useDatabase } from '@/db/DatabaseProvider';
import { type ProfileRow, setRestSettings } from '@/db/repositories/profile';
import { REST_DEFAULT_LIMITS, REST_STEP_SECONDS, stepDefaultRest } from '@/domain/restTimer';
import { formatClock } from '@/domain/workout';
import { t } from '@/i18n';
import { Card, IconButton, ToggleRow, colors, font, spacing } from '@/ui';

/** Ajustes del temporizador de descanso (AJU-02). */
export function RestSettings({ profile }: { profile: ProfileRow }) {
  const { db, owner } = useDatabase();
  const step = (delta: number) =>
    setRestSettings(db, owner, { restSeconds: stepDefaultRest(profile.restSeconds, delta) });

  return (
    <Card>
      <Text style={styles.title}>{t.settings.restTitle}</Text>
      <View style={styles.row}>
        <View style={styles.text}>
          <Text style={styles.label}>{t.settings.restDefault}</Text>
          <Text style={styles.help}>{t.settings.restDefaultHelp}</Text>
        </View>
        <IconButton
          icon="remove"
          outlined
          label={t.settings.restMinus}
          disabled={profile.restSeconds <= REST_DEFAULT_LIMITS.min}
          onPress={() => step(-REST_STEP_SECONDS)}
        />
        <Text style={styles.value}>{formatClock(profile.restSeconds)}</Text>
        <IconButton
          icon="add"
          outlined
          label={t.settings.restPlus}
          disabled={profile.restSeconds >= REST_DEFAULT_LIMITS.max}
          onPress={() => step(REST_STEP_SECONDS)}
        />
      </View>
      <ToggleRow
        label={t.settings.restAutoStart}
        description={t.settings.restAutoStartHelp}
        value={profile.restAutoStart}
        onChange={(restAutoStart) => setRestSettings(db, owner, { restAutoStart })}
      />
      <ToggleRow
        label={t.settings.restSound}
        value={profile.restSound}
        onChange={(restSound) => setRestSettings(db, owner, { restSound })}
      />
      <ToggleRow
        label={t.settings.restVibration}
        value={profile.restVibration}
        onChange={(restVibration) => setRestSettings(db, owner, { restVibration })}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: font.body, fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  text: { flex: 1, gap: 2 },
  label: { fontSize: font.body, color: colors.text },
  help: { fontSize: font.small, color: colors.textMuted },
  value: { minWidth: 48, textAlign: 'center', fontSize: font.title, fontWeight: '700', color: colors.text },
});

import { StyleSheet, Text } from 'react-native';

import { useDatabase } from '@/db/DatabaseProvider';
import { type ProfileRow, setWeightIncrement } from '@/db/repositories/profile';
import { INCREMENT_OPTIONS } from '@/domain/recommendation';
import { formatNumber } from '@/domain/workout';
import { format, t } from '@/i18n';
import { Card, ChipGroup, colors, font } from '@/ui';

/** Incremento de peso que usan las sugerencias y los botones de más y menos (AJU-03). */
export function IncrementSetting({ profile }: { profile: ProfileRow }) {
  const { db, owner } = useDatabase();
  return (
    <Card>
      <Text style={styles.title}>{t.settings.incrementTitle}</Text>
      <Text style={styles.help}>{t.settings.incrementHelp}</Text>
      <ChipGroup
        label={t.settings.incrementKg}
        options={INCREMENT_OPTIONS.kg}
        value={profile.weightIncrementKg}
        labelFor={(n) => format(t.settings.incrementOption, { n: formatNumber(n), unit: t.units.kg })}
        onChange={(n) => setWeightIncrement(db, owner, 'kg', n)}
      />
      <ChipGroup
        label={t.settings.incrementLb}
        options={INCREMENT_OPTIONS.lb}
        value={profile.weightIncrementLb}
        labelFor={(n) => format(t.settings.incrementOption, { n: formatNumber(n), unit: t.units.lb })}
        onChange={(n) => setWeightIncrement(db, owner, 'lb', n)}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: font.body, fontWeight: '700', color: colors.text },
  help: { fontSize: font.small, color: colors.textMuted },
});

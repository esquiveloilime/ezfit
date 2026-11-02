import { StyleSheet, Text } from 'react-native';

import { useDatabase } from '@/db/DatabaseProvider';
import type { ProfileRow } from '@/db/repositories/profile';
import { setWeightUnit } from '@/db/repositories/profile';
import type { WeightUnit } from '@/db/schema';
import { t } from '@/i18n';
import { Card, ChipGroup, colors, font } from '@/ui';

const UNITS: readonly WeightUnit[] = ['lb', 'kg'];

/** Unidad de peso por defecto (AJU-01). */
export function WeightUnitSetting({ profile }: { profile: ProfileRow }) {
  const { db, owner } = useDatabase();
  return (
    <Card>
      <ChipGroup
        label={t.settings.weightUnit}
        options={UNITS}
        value={profile.weightUnit}
        labelFor={(u) => t.units[u]}
        onChange={(u) => setWeightUnit(db, owner, u)}
      />
      <Text style={styles.help}>{t.settings.weightUnitHelp}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  help: { fontSize: font.small, color: colors.textMuted },
});

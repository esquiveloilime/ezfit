import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useDatabase } from '@/db/DatabaseProvider';
import { useQuery } from '@/db/useQuery';
import { completeOnboarding } from '@/db/repositories/profile';
import { planDaysQuery, templatePlansQuery } from '@/db/repositories/routines';
import type { WeightUnit } from '@/db/schema';
import {
  adjustWeekdays,
  isValidDayCount,
  suggestedPlanDays,
  toggleWeekday,
  WEEK_ORDER,
  type Weekday,
} from '@/domain/plan';
import { format, t } from '@/i18n';
import { Button, Card, Chip, ChipGroup, Screen, colors, font, spacing } from '@/ui';

type Step = 'level' | 'days' | 'unit' | 'plan' | 'choosePlan' | 'adjust';
type DaysMode = 'weekdays' | 'count';

const COUNTS = ['2', '3', '4', '5', '6'] as const;
const UNITS: readonly WeightUnit[] = ['lb', 'kg'];

/** Incorporación: nivel, días, unidad de peso y plan semanal (CUE-05, F1, F2). */
export function Onboarding() {
  const { db, owner } = useDatabase();
  const { data: plans } = useQuery(templatePlansQuery(db));

  const [step, setStep] = useState<Step>('level');
  const [beginner, setBeginner] = useState(true);
  const [daysMode, setDaysMode] = useState<DaysMode>('weekdays');
  const [weekdays, setWeekdays] = useState<Weekday[]>([]);
  const [count, setCount] = useState<number>(3);
  const [unit, setUnit] = useState<WeightUnit>('lb');
  const [planDays, setPlanDays] = useState<number>(3);
  const [saveError, setSaveError] = useState(false);

  const chosenDays = daysMode === 'weekdays' ? weekdays.length : count;
  const planFor = (days: number) => plans.find((p) => p.daysPerWeek === days) ?? null;

  /** `days`: cantidad de días que entrena (la del plan elegido, si eligió uno). */
  function finish(planId: string | null, finalWeekdays: Weekday[] | null, days: number) {
    try {
      completeOnboarding(db, owner, {
        level: beginner ? 'beginner' : 'experienced',
        weightUnit: unit,
        trainingWeekdays: beginner ? finalWeekdays : null,
        trainingDaysCount: beginner ? (finalWeekdays ? finalWeekdays.length : days) : null,
        activePlanId: planId,
      });
      router.replace('/');
    } catch (error) {
      console.error('No se pudo guardar la incorporación', error);
      setSaveError(true);
    }
  }

  /** Acepta un plan; si eligió días concretos y no coinciden, primero se ajustan (CUE-05). */
  function acceptPlan(days: number) {
    const plan = planFor(days);
    if (!plan) return;
    setPlanDays(days);
    if (daysMode === 'weekdays' && weekdays.length !== days) {
      setWeekdays(adjustWeekdays(weekdays, days));
      setStep('adjust');
      return;
    }
    finish(plan.id, daysMode === 'weekdays' ? weekdays : null, days);
  }

  const errorText = saveError ? <Text style={styles.error}>{t.onboarding.saveFailed}</Text> : null;

  if (step === 'level') {
    return (
      <Screen title={t.onboarding.levelTitle}>
        <Text style={styles.body}>{t.onboarding.levelBody}</Text>
        <Button
          label={t.onboarding.beginner}
          onPress={() => {
            setBeginner(true);
            setStep('days');
          }}
        />
        <Button
          variant="secondary"
          label={t.onboarding.experienced}
          onPress={() => {
            setBeginner(false);
            setStep('unit');
          }}
        />
      </Screen>
    );
  }

  if (step === 'days') {
    return (
      <Screen title={t.onboarding.daysTitle}>
        <Text style={styles.body}>{t.onboarding.daysBody}</Text>
        <View style={styles.row}>
          <Chip
            label={t.onboarding.daysModeWeekdays}
            selected={daysMode === 'weekdays'}
            onPress={() => setDaysMode('weekdays')}
          />
          <Chip
            label={t.onboarding.daysModeCount}
            selected={daysMode === 'count'}
            onPress={() => setDaysMode('count')}
          />
        </View>
        {daysMode === 'weekdays' ? (
          <WeekdayPicker value={weekdays} onChange={setWeekdays} />
        ) : (
          <ChipGroup
            label={t.onboarding.daysCountLabel}
            options={COUNTS}
            value={String(count) as (typeof COUNTS)[number]}
            labelFor={(c) => c}
            onChange={(c) => setCount(Number(c))}
          />
        )}
        <Text style={styles.hint}>
          {daysMode === 'weekdays'
            ? `${format(t.onboarding.daysSelected, { n: weekdays.length })}. ${t.onboarding.daysHint}`
            : t.onboarding.daysHint}
        </Text>
        <Button label={t.onboarding.continue} disabled={!isValidDayCount(chosenDays)} onPress={() => setStep('unit')} />
        <Button variant="ghost" label={t.onboarding.back} onPress={() => setStep('level')} />
      </Screen>
    );
  }

  if (step === 'unit') {
    return (
      <Screen title={t.onboarding.unitTitle}>
        <Text style={styles.body}>{t.onboarding.unitBody}</Text>
        <ChipGroup
          label={t.settings.weightUnit}
          options={UNITS}
          value={unit}
          labelFor={(u) => t.units[u]}
          onChange={setUnit}
        />
        {errorText}
        {beginner ? (
          <Button
            label={t.onboarding.continue}
            onPress={() => {
              setPlanDays(chosenDays);
              setStep('plan');
            }}
          />
        ) : (
          <Button label={t.onboarding.finish} onPress={() => finish(null, null, 0)} />
        )}
        <Button variant="ghost" label={t.onboarding.back} onPress={() => setStep(beginner ? 'days' : 'level')} />
      </Screen>
    );
  }

  if (step === 'plan') {
    const { recommended, alternatives } = suggestedPlanDays(chosenDays);
    const plan = planFor(recommended);
    return (
      <Screen title={t.onboarding.planTitle}>
        <Text style={styles.body}>{t.onboarding.planBody}</Text>
        {plan ? <PlanPreview planId={plan.id} name={plan.name} weekdays={daysMode === 'weekdays' ? weekdays : null} /> : null}
        {alternatives.length ? (
          <Card>
            <Text style={styles.warning}>{t.onboarding.restReminder}</Text>
            {alternatives.map((n) => (
              <Button
                key={n}
                variant="secondary"
                label={format(t.onboarding.alternative, { n })}
                onPress={() => acceptPlan(n)}
              />
            ))}
          </Card>
        ) : null}
        {errorText}
        <Button label={t.onboarding.acceptPlan} disabled={!plan} onPress={() => acceptPlan(recommended)} />
        <Button variant="secondary" label={t.onboarding.otherPlans} onPress={() => setStep('choosePlan')} />
        <Button
          variant="ghost"
          label={t.onboarding.skipPlan}
          onPress={() => finish(null, daysMode === 'weekdays' ? weekdays : null, chosenDays)}
        />
      </Screen>
    );
  }

  if (step === 'choosePlan') {
    return (
      <Screen title={t.onboarding.choosePlanTitle}>
        {plans.map((p) => (
          <Card key={p.id} accessibilityLabel={p.name} onPress={() => acceptPlan(p.daysPerWeek)}>
            <Text style={styles.cardTitle}>{p.name}</Text>
            <PlanDayNames planId={p.id} />
          </Card>
        ))}
        {errorText}
        <Button variant="ghost" label={t.onboarding.back} onPress={() => setStep('plan')} />
      </Screen>
    );
  }

  // step === 'adjust': elegir exactamente tantos días como tiene el plan.
  const plan = planFor(planDays);
  return (
    <Screen title={t.onboarding.adjustTitle}>
      <Text style={styles.body}>{format(t.onboarding.adjustBody, { n: planDays })}</Text>
      <WeekdayPicker value={weekdays} onChange={setWeekdays} />
      <Text style={styles.hint}>{format(t.onboarding.daysSelected, { n: weekdays.length })}</Text>
      {errorText}
      <Button
        label={t.onboarding.finish}
        disabled={!plan || weekdays.length !== planDays}
        onPress={() => plan && finish(plan.id, weekdays, planDays)}
      />
      <Button variant="ghost" label={t.onboarding.back} onPress={() => setStep('plan')} />
    </Screen>
  );
}

function WeekdayPicker({ value, onChange }: { value: Weekday[]; onChange: (days: Weekday[]) => void }) {
  return (
    <View style={styles.row}>
      {WEEK_ORDER.map((d) => (
        <Chip
          key={d}
          label={t.weekdaysShort[d] ?? ''}
          selected={value.includes(d)}
          onPress={() => onChange(toggleWeekday(value, d))}
        />
      ))}
    </View>
  );
}

/** Muestra qué rutina toca cada día del plan propuesto. */
function PlanPreview({ planId, name, weekdays }: { planId: string; name: string; weekdays: Weekday[] | null }) {
  const { db } = useDatabase();
  const { data: days } = useQuery(planDaysQuery(db, planId), [planId]);
  return (
    <Card>
      <Text style={styles.cardTitle}>{name}</Text>
      {days.map((d, i) => {
        const weekday = weekdays?.[i];
        const label = weekday !== undefined ? t.weekdaysShort[weekday] : format(t.routines.dayN, { n: i + 1 });
        return (
          <Text key={d.id} style={styles.body}>
            {label}: {d.routineName}
          </Text>
        );
      })}
    </Card>
  );
}

function PlanDayNames({ planId }: { planId: string }) {
  const { db } = useDatabase();
  const { data: days } = useQuery(planDaysQuery(db, planId), [planId]);
  return <Text style={styles.hint}>{days.map((d) => d.routineName).join(' · ')}</Text>;
}

const styles = StyleSheet.create({
  body: { fontSize: font.body, color: colors.text },
  hint: { fontSize: font.small, color: colors.textMuted },
  warning: { fontSize: font.body, color: colors.warning },
  cardTitle: { fontSize: font.body, fontWeight: '600', color: colors.text },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  error: { fontSize: font.body, color: colors.danger },
});

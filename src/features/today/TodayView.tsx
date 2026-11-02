import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useDatabase } from '@/db/DatabaseProvider';
import { useQuery } from '@/db/useQuery';
import { lastFinishedWorkoutQuery, type ProfileRow } from '@/db/repositories/profile';
import { planByIdQuery, planDaysQuery, routineItemsQuery } from '@/db/repositories/routines';
import { parseWeekdays, todaysPlanDay, type Weekday } from '@/domain/plan';
import { formatTarget } from '@/domain/routine';
import { format, t } from '@/i18n';
import { Button, Card, Screen, colors, font, spacing } from '@/ui';
import { ActiveWorkoutCard } from '@/features/workout/ActiveWorkoutCard';
import { useStartWorkout } from '@/features/workout/useStartWorkout';

/** Pantalla Hoy: la rutina del día según el plan, descanso, u opciones si no hay plan (RUT-02, F1, F2). */
export function TodayView({ profile }: { profile: ProfileRow }) {
  return (
    <Screen title={t.tabs.today}>
      <ActiveWorkoutCard />
      {profile.activePlanId ? <PlanToday profile={profile} planId={profile.activePlanId} /> : <NoPlan />}
    </Screen>
  );
}

function PlanToday({ profile, planId }: { profile: ProfileRow; planId: string }) {
  const { db, owner } = useDatabase();
  const planQuery = useQuery(planByIdQuery(db, planId), [planId]);
  const daysQuery = useQuery(planDaysQuery(db, planId), [planId]);
  const lastQuery = useQuery(lastFinishedWorkoutQuery(db, owner), [owner]);
  const start = useStartWorkout();
  const plan = planQuery.data[0];
  const days = daysQuery.data;

  if (!planQuery.loaded || !daysQuery.loaded || !lastQuery.loaded || !plan) return null;

  const today = todaysPlanDay({
    planDays: days,
    weekdays: parseWeekdays(profile.trainingWeekdays),
    today: new Date().getDay() as Weekday,
    lastRoutineId: lastQuery.data[0]?.routineId ?? null,
  });

  const seePlan = (
    <Button
      variant="ghost"
      label={t.today.seePlan}
      onPress={() => router.push({ pathname: '/plans/[id]', params: { id: plan.id } })}
    />
  );

  if (today.kind !== 'train') {
    return (
      <>
        <Card>
          <Text style={styles.title}>{t.today.restTitle}</Text>
          <Text style={styles.body}>{t.today.restBody}</Text>
        </Card>
        <Button variant="secondary" label={t.today.startEmpty} onPress={() => start(null)} />
        {seePlan}
      </>
    );
  }

  const dayName = days.find((d) => d.position === today.day.position)?.routineName ?? '';
  return (
    <>
      <Text style={styles.label}>{t.today.trainTitle}</Text>
      <RoutineSummary
        routineId={today.day.routineId}
        name={dayName}
        subtitle={format(t.today.fromPlan, { plan: plan.name, n: today.day.position + 1 })}
      />
      <Button label={t.today.start} onPress={() => start(today.day.routineId)} />
      <Button variant="secondary" label={t.today.startEmpty} onPress={() => start(null)} />
      {seePlan}
    </>
  );
}

function RoutineSummary({ routineId, name, subtitle }: { routineId: string; name: string; subtitle: string }) {
  const { db } = useDatabase();
  const { data: items } = useQuery(routineItemsQuery(db, routineId), [routineId]);
  return (
    <Card
      accessibilityLabel={name}
      onPress={() => router.push({ pathname: '/routines/[id]', params: { id: routineId } })}>
      <Text style={styles.title}>{name}</Text>
      <Text style={styles.hint}>{subtitle}</Text>
      <View style={styles.items}>
        {items.map((i) => (
          <Text key={i.id} style={styles.body}>
            {i.name} · {formatTarget(i.targetSets, i.repsMin, i.repsMax)}
          </Text>
        ))}
      </View>
    </Card>
  );
}

function NoPlan() {
  const start = useStartWorkout();
  return (
    <>
      <Card>
        <Text style={styles.title}>{t.today.noPlanTitle}</Text>
        <Text style={styles.body}>{t.today.noPlanBody}</Text>
      </Card>
      <Button label={t.today.startEmpty} onPress={() => start(null)} />
      <Button variant="secondary" label={t.today.createRoutine} onPress={() => router.push('/routines/edit')} />
      <Button variant="secondary" label={t.today.exploreTemplates} onPress={() => router.navigate('/routines')} />
    </>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: font.label, color: colors.textMuted, fontWeight: '600' },
  title: { fontSize: font.title, fontWeight: '700', color: colors.text },
  body: { fontSize: font.body, color: colors.text },
  hint: { fontSize: font.small, color: colors.textMuted },
  items: { gap: spacing.xs, marginTop: spacing.xs },
});

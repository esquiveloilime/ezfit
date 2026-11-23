import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useDatabase } from '@/db/DatabaseProvider';
import { workoutCardioQuery } from '@/db/repositories/cardio';
import { finishedRunsBetweenQuery, finishedRunsQuery, type RunRow } from '@/db/repositories/runs';
import { finishedWorkoutsBetweenQuery, type HistoryWorkout, workoutSetsQuery } from '@/db/repositories/workouts';
import { useQuery } from '@/db/useQuery';
import { bestMarks, mergeHistory, type Month, monthOf, monthRange, sameMonth, shiftMonth } from '@/domain/history';
import { formatElapsed, formatKm, formatPace, type RunKind, RUN_KINDS } from '@/domain/run';
import { formatDuration } from '@/domain/workout';
import { formatRunDate } from '@/features/run/RunStats';
import { format, t } from '@/i18n';
import { Button, Card, EmptyState, IconButton, Screen, colors, font, minTouch, radius, spacing } from '@/ui';

/**
 * Sección Historial (HIS-01, RUN-13): mejores marcas de running y, debajo, las sesiones de
 * pesas y las actividades de running del mes elegido en una sola lista.
 */
export function HistoryView() {
  const { db, owner } = useDatabase();
  const [month, setMonth] = useState<Month>(() => monthOf(new Date()));
  const { from, to } = monthRange(month);
  const workouts = useQuery(finishedWorkoutsBetweenQuery(db, owner, from, to), [owner, from, to]);
  const runs = useQuery(finishedRunsBetweenQuery(db, owner, from, to), [owner, from, to]);
  const entries = useMemo(() => mergeHistory(workouts.data, runs.data), [workouts.data, runs.data]);
  const isCurrent = sameMonth(month, monthOf(new Date()));
  const monthName = t.monthsLong[month.month] ?? '';

  return (
    <Screen title={t.tabs.history}>
      <BestMarks />

      <View style={styles.monthBar}>
        <IconButton icon="chevron-back" label={t.history.prevMonth} onPress={() => setMonth(shiftMonth(month, -1))} />
        <Text style={styles.month} accessibilityRole="header" accessibilityLiveRegion="polite">
          {format(t.history.month, { month: monthName, year: month.year })}
        </Text>
        <IconButton
          icon="chevron-forward"
          label={t.history.nextMonth}
          disabled={isCurrent}
          onPress={() => setMonth(shiftMonth(month, 1))}
        />
      </View>

      {workouts.loaded && runs.loaded && entries.length === 0 ? (
        <EmptyState title={format(t.history.emptyMonthTitle, { month: monthName })} body={t.history.emptyMonthBody} />
      ) : null}
      {entries.map((entry) =>
        entry.type === 'workout' ? (
          <WorkoutEntry key={entry.id} workout={entry.item} />
        ) : (
          <RunEntry key={entry.id} run={entry.item} />
        ),
      )}

      <Button variant="ghost" label={t.history.byExercise} onPress={() => router.push('/exercises')} />
    </Screen>
  );
}

function EntryHeader({ icon, name, date }: { icon: 'barbell-outline' | 'walk-outline'; name: string; date: string }) {
  return (
    <View style={styles.entryHeader}>
      <View style={styles.icon}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.date}>{date}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </View>
  );
}

function WorkoutEntry({ workout }: { workout: HistoryWorkout }) {
  const { db } = useDatabase();
  const { data: sets } = useQuery(workoutSetsQuery(db, workout.id), [workout.id]);
  const { data: cardio } = useQuery(workoutCardioQuery(db, workout.id), [workout.id]);
  const name = workout.routineName ?? t.workout.emptyWorkoutName;
  const date = formatRunDate(workout.startedAt);
  const values = {
    duration: formatDuration(Math.round(((workout.endedAt ?? workout.startedAt) - workout.startedAt) / 1000)),
    sets: sets.length,
    cardio: cardio.length,
  };
  const mood = workout.mood ? (t.finish.moods[workout.mood - 1] ?? null) : null;

  return (
    <Card
      accessibilityLabel={format(t.history.workoutA11y, { name, date })}
      onPress={() => router.push({ pathname: '/sessions/[id]', params: { id: workout.id } })}>
      <EntryHeader icon="barbell-outline" name={name} date={date} />
      <Text style={styles.body}>
        {format(cardio.length > 0 ? t.history.workoutLineCardio : t.history.workoutLine, values)}
      </Text>
      {mood ? <Text style={styles.body}>{mood}</Text> : null}
    </Card>
  );
}

function RunEntry({ run }: { run: RunRow }) {
  const name = run.name ?? t.run.kinds[run.kind];
  const date = formatRunDate(run.startedAt);
  return (
    <Card
      accessibilityLabel={format(t.history.runA11y, { kind: t.run.kinds[run.kind], name, date })}
      onPress={() => router.push({ pathname: '/runs/[id]', params: { id: run.id } })}>
      <EntryHeader icon="walk-outline" name={name} date={date} />
      <Text style={styles.body}>
        {format(t.run.listItem, {
          km: formatKm(run.distanceMeters),
          time: formatElapsed(run.movingSeconds),
          pace: formatPace(run.avgPaceSecondsPerKm),
        })}
      </Text>
    </Card>
  );
}

/** Mejores marcas de correr y de caminar, por separado (RUN-13). */
function BestMarks() {
  const { db, owner } = useDatabase();
  const { data: runs } = useQuery(finishedRunsQuery(db, owner), [owner]);
  const marks = useMemo(() => bestMarks(runs), [runs]);
  const kinds = RUN_KINDS.filter((k) => marks[k].longest || marks[k].fastest);
  if (kinds.length === 0) return null;

  return (
    <Card>
      <Text style={styles.cardTitle}>{t.history.marksTitle}</Text>
      {kinds.map((kind) => (
        <View key={kind} style={styles.kind}>
          <Text style={styles.kindName}>{t.run.kinds[kind]}</Text>
          {marks[kind].longest ? (
            <Mark
              kind={kind}
              label={t.history.longest}
              value={`${formatKm(marks[kind].longest.distanceMeters)} ${t.run.km}`}
              run={marks[kind].longest}
            />
          ) : null}
          {marks[kind].fastest ? (
            <Mark
              kind={kind}
              label={t.history.fastest}
              value={`${formatPace(marks[kind].fastest.avgPaceSecondsPerKm)} ${t.run.paceUnit}`}
              run={marks[kind].fastest}
            />
          ) : null}
        </View>
      ))}
      <Text style={styles.hint}>{t.history.marksHint}</Text>
    </Card>
  );
}

function Mark({ kind, label, value, run }: { kind: RunKind; label: string; value: string; run: RunRow }) {
  const date = formatRunDate(run.startedAt);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={format(t.history.markA11y, { kind: t.run.kinds[kind], mark: label, value, date })}
      onPress={() => router.push({ pathname: '/runs/[id]', params: { id: run.id } })}
      style={({ pressed }) => [styles.mark, pressed && styles.pressed]}>
      <View style={styles.flex}>
        <Text style={styles.markLabel}>{label}</Text>
        <Text style={styles.date}>{date}</Text>
      </View>
      <Text style={styles.markValue}>{value}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  monthBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  month: { flex: 1, textAlign: 'center', fontSize: font.title, fontWeight: '700', color: colors.text },
  entryHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  name: { fontSize: font.body, fontWeight: '700', color: colors.text },
  date: { fontSize: font.small, color: colors.textMuted },
  body: { fontSize: font.body, color: colors.text },
  cardTitle: { fontSize: font.title, fontWeight: '700', color: colors.text },
  kind: { gap: spacing.xs },
  kindName: { fontSize: font.label, fontWeight: '600', color: colors.textMuted },
  mark: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: minTouch },
  markLabel: { fontSize: font.body, color: colors.text },
  markValue: { fontSize: font.body, fontWeight: '700', color: colors.text },
  hint: { fontSize: font.small, color: colors.textMuted },
  pressed: { opacity: 0.6 },
});

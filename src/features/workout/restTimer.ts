import { useEffect, useState } from 'react';
import { Vibration } from 'react-native';
import { create } from 'zustand';

import type { Db } from '@/db/client';
import { deleteMeta, getMeta, setMeta } from '@/db/repositories/meta';
import { adjustTimer, isFinished, parseTimer, type RestTimer, startTimer } from '@/domain/restTimer';
import { t } from '@/i18n';
import { cancelRestEnd, type RestAlert, scheduleRestEnd } from '@/services/notifications';

// Estado del temporizador de descanso (SES-08). Vive en memoria para la pantalla y se
// guarda en el teléfono (tabla app_meta) para sobrevivir al cierre de la app (SES-10).

const KEY = 'rest_timer';
/** Si el descanso terminó hace más que esto (la app estaba cerrada), ya no se avisa al volver. */
const LATE_ALERT_MS = 2000;
const FINISHED_MESSAGE_MS = 4000;
const VIBRATION_PATTERN = [0, 400, 200, 400];

type State = { timer: RestTimer | null; finishedAt: number | null };

export const useRestTimerStore = create<State>(() => ({ timer: null, finishedAt: null }));

function save(db: Db, timer: RestTimer | null) {
  if (timer) setMeta(db, KEY, JSON.stringify(timer));
  else deleteMeta(db, KEY);
  useRestTimerStore.setState({ timer });
}

const message = () => ({
  title: t.rest.notificationTitle,
  body: t.rest.notificationBody,
  channelName: t.rest.channelName,
});

/** Programa el aviso y lo asocia al temporizador, si sigue siendo el mismo cuando termina de programarse. */
async function schedule(db: Db, timer: RestTimer, alert: RestAlert) {
  const id = await scheduleRestEnd(timer.endsAt, alert, message());
  const current = useRestTimerStore.getState().timer;
  if (current && current.workoutId === timer.workoutId && current.endsAt === timer.endsAt) {
    save(db, { ...current, notificationId: id });
  } else {
    void cancelRestEnd(id);
  }
}

/** Lee el temporizador guardado de la sesión; si ya terminó mientras la app estaba cerrada, se descarta. */
export function loadRestTimer(db: Db, workoutId: string): void {
  const saved = parseTimer(getMeta(db, KEY));
  if (saved && saved.workoutId === workoutId && !isFinished(saved, Date.now())) {
    useRestTimerStore.setState({ timer: saved });
  } else {
    if (saved) deleteMeta(db, KEY);
    useRestTimerStore.setState({ timer: null });
  }
}

export function startRest(db: Db, workoutId: string, seconds: number, alert: RestAlert): void {
  const previous = useRestTimerStore.getState().timer;
  void cancelRestEnd(previous?.notificationId ?? null);
  const timer = startTimer(workoutId, seconds, Date.now());
  save(db, timer);
  useRestTimerStore.setState({ finishedAt: null });
  void schedule(db, timer, alert);
}

export function adjustRest(db: Db, deltaSeconds: number, alert: RestAlert): void {
  const current = useRestTimerStore.getState().timer;
  if (!current) return;
  void cancelRestEnd(current.notificationId);
  const next = adjustTimer(current, deltaSeconds, Date.now());
  save(db, next ? { ...next, notificationId: null } : null);
  if (next) void schedule(db, next, alert);
}

/** Salta el descanso, o lo detiene al terminar o descartar la sesión. */
export function stopRest(db: Db): void {
  const current = useRestTimerStore.getState().timer;
  void cancelRestEnd(current?.notificationId ?? null);
  save(db, null);
  useRestTimerStore.setState({ finishedAt: null });
}

/**
 * Hace correr el temporizador en pantalla: devuelve la hora actual cada fracción de
 * segundo y, cuando el descanso termina con la app abierta, vibra (si está activado) y
 * muestra un aviso breve. El sonido lo da la notificación programada.
 */
export function useRestTick(db: Db, workoutId: string, vibration: boolean): number {
  const timer = useRestTimerStore((s) => s.timer);
  const finishedAt = useRestTimerStore((s) => s.finishedAt);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    loadRestTimer(db, workoutId);
  }, [db, workoutId]);

  useEffect(() => {
    if (!timer && finishedAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [timer, finishedAt]);

  useEffect(() => {
    if (timer && isFinished(timer, now)) {
      if (vibration && now - timer.endsAt < LATE_ALERT_MS) Vibration.vibrate(VIBRATION_PATTERN);
      save(db, null);
      useRestTimerStore.setState({ finishedAt: now });
    } else if (finishedAt !== null && now - finishedAt > FINISHED_MESSAGE_MS) {
      useRestTimerStore.setState({ finishedAt: null });
    }
  }, [db, timer, now, finishedAt, vibration]);

  return now;
}

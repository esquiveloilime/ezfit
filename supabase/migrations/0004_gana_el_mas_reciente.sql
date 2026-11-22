-- ezfit · Migración 0004: el servidor no acepta una versión más antigua (SIN-05).
-- Cómo aplicarla: panel de Supabase → SQL Editor → New query → pegar todo → Run.
--
-- Si un teléfono sin conexión sube tarde un cambio más antiguo que el que ya subió otro
-- teléfono, la actualización se ignora: gana la modificación más reciente (`updated_at`,
-- la fecha del cambio en el teléfono). Este disparador corre antes que el que pone
-- `server_updated_at` (los disparadores se ejecutan en orden alfabético), así que un cambio
-- ignorado tampoco mueve la fecha del servidor.

create or replace function public.keep_newest()
returns trigger
language plpgsql
as $$
begin
  if new.updated_at < old.updated_at then
    return null;
  end if;
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'exercises', 'routines', 'routine_exercises', 'plans', 'plan_days',
    'workouts', 'workout_exercises', 'sets', 'cardio_entries', 'runs'
  ]
  loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.keep_newest()',
      t || '_keep_newest', t
    );
  end loop;
end;
$$;

-- ezfit · Migración 0001: esquema y seguridad por fila (plan técnico, secciones 4 y 5).
-- Cómo aplicarla: panel de Supabase → SQL Editor → New query → pegar todo → Run.
-- Es el mismo modelo que SQLite en el teléfono, sin `sync_status` ni `run_points`.
-- Las fechas del teléfono se guardan como milisegundos (bigint). `server_updated_at`
-- la pone el servidor y sirve de punto de corte para bajar cambios.

create or replace function public.set_server_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.server_updated_at = now();
  return new;
end;
$$;

-- Ajustes del usuario: un perfil por cuenta.
create table public.profiles (
  id uuid primary key,
  user_id uuid not null unique references auth.users (id) on delete cascade,
  created_at bigint not null,
  updated_at bigint not null,
  deleted_at bigint,
  server_updated_at timestamptz not null default now(),
  level text check (level in ('beginner', 'experienced')),
  weight_unit text not null default 'lb' check (weight_unit in ('kg', 'lb')),
  training_weekdays text,
  training_days_count integer check (training_days_count between 2 and 6),
  active_plan_id uuid,
  rest_seconds integer not null default 90,
  rest_auto_start boolean not null default true,
  rest_sound boolean not null default true,
  rest_vibration boolean not null default true,
  weight_increment_kg real not null default 2.5,
  weight_increment_lb real not null default 5,
  onboarding_completed boolean not null default false
);

-- Catálogo (user_id vacío) y ejercicios propios.
create table public.exercises (
  id uuid primary key,
  user_id uuid references auth.users (id) on delete cascade,
  created_at bigint not null,
  updated_at bigint not null,
  deleted_at bigint,
  server_updated_at timestamptz not null default now(),
  name text not null,
  muscle_group text not null,
  secondary_muscles text not null default '[]',
  equipment text not null,
  tracking_type text not null check (tracking_type in ('weight_reps', 'reps', 'time', 'weight_time', 'distance_time')),
  uses_rir boolean not null default true,
  uses_technique boolean not null default true,
  notes text,
  archived boolean not null default false,
  image_key text,
  video_url text
);

-- Plantillas (user_id vacío) y rutinas propias.
create table public.routines (
  id uuid primary key,
  user_id uuid references auth.users (id) on delete cascade,
  created_at bigint not null,
  updated_at bigint not null,
  deleted_at bigint,
  server_updated_at timestamptz not null default now(),
  name text not null,
  description text,
  category text not null check (category in ('own', 'time', 'muscle', 'plan')),
  estimated_minutes integer
);

create table public.routine_exercises (
  id uuid primary key,
  user_id uuid references auth.users (id) on delete cascade,
  created_at bigint not null,
  updated_at bigint not null,
  deleted_at bigint,
  server_updated_at timestamptz not null default now(),
  routine_id uuid not null,
  exercise_id uuid not null,
  position integer not null,
  target_sets integer,
  reps_min integer,
  reps_max integer,
  rest_seconds integer
);

create table public.plans (
  id uuid primary key,
  user_id uuid references auth.users (id) on delete cascade,
  created_at bigint not null,
  updated_at bigint not null,
  deleted_at bigint,
  server_updated_at timestamptz not null default now(),
  name text not null,
  days_per_week integer not null
);

create table public.plan_days (
  id uuid primary key,
  user_id uuid references auth.users (id) on delete cascade,
  created_at bigint not null,
  updated_at bigint not null,
  deleted_at bigint,
  server_updated_at timestamptz not null default now(),
  plan_id uuid not null,
  position integer not null,
  routine_id uuid not null,
  weekday integer check (weekday between 0 and 6)
);

create table public.workouts (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at bigint not null,
  updated_at bigint not null,
  deleted_at bigint,
  server_updated_at timestamptz not null default now(),
  routine_id uuid,
  started_at bigint not null,
  ended_at bigint,
  status text not null check (status in ('in_progress', 'finished')),
  mood integer check (mood between 1 and 5),
  notes text
);

create table public.workout_exercises (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at bigint not null,
  updated_at bigint not null,
  deleted_at bigint,
  server_updated_at timestamptz not null default now(),
  workout_id uuid not null,
  exercise_id uuid not null,
  position integer not null,
  machine text,
  notes text
);

create table public.sets (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at bigint not null,
  updated_at bigint not null,
  deleted_at bigint,
  server_updated_at timestamptz not null default now(),
  workout_exercise_id uuid not null,
  position integer not null,
  kind text not null default 'working' check (kind in ('warmup', 'working')),
  weight real,
  unit text check (unit in ('kg', 'lb')),
  reps integer,
  duration_seconds integer,
  distance_meters real,
  rir integer,
  technique integer check (technique between 1 and 5),
  performed_at bigint not null
);

create table public.cardio_entries (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at bigint not null,
  updated_at bigint not null,
  deleted_at bigint,
  server_updated_at timestamptz not null default now(),
  workout_id uuid not null,
  position integer not null,
  machine_type text not null check (machine_type in ('treadmill', 'elliptical', 'bike', 'stair', 'rower', 'other')),
  duration_seconds integer,
  level real,
  speed real,
  distance_meters real,
  incline real,
  notes text
);

create table public.runs (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at bigint not null,
  updated_at bigint not null,
  deleted_at bigint,
  server_updated_at timestamptz not null default now(),
  kind text not null check (kind in ('run', 'walk')),
  name text,
  started_at bigint not null,
  ended_at bigint,
  moving_seconds integer not null default 0,
  distance_meters real not null default 0,
  avg_pace_seconds_per_km real,
  route text,
  notes text,
  status text not null check (status in ('recording', 'paused', 'finished'))
);

-- Índices para bajar cambios por usuario y por fecha del servidor.
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'exercises', 'routines', 'routine_exercises', 'plans', 'plan_days',
    'workouts', 'workout_exercises', 'sets', 'cardio_entries', 'runs'
  ]
  loop
    execute format('create index %I on public.%I (user_id, server_updated_at)', t || '_sync_idx', t);
    execute format(
      'create trigger %I before insert or update on public.%I for each row execute function public.set_server_updated_at()',
      t || '_server_updated_at', t
    );
    execute format('alter table public.%I enable row level security', t);
  end loop;
end;
$$;

-- Seguridad por fila: cada usuario solo lee y escribe lo suyo (RNF-04).
-- El catálogo y las plantillas (user_id vacío) son de solo lectura para todos.
do $$
declare
  t text;
begin
  -- Tablas con catálogo o plantillas: también se pueden leer las filas sin dueño.
  foreach t in array array['exercises', 'routines', 'routine_exercises', 'plans', 'plan_days']
  loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (user_id is null or user_id = (select auth.uid()))',
      t || '_select', t
    );
  end loop;

  -- Tablas solo del usuario.
  foreach t in array array['profiles', 'workouts', 'workout_exercises', 'sets', 'cardio_entries', 'runs']
  loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (user_id = (select auth.uid()))',
      t || '_select', t
    );
  end loop;

  -- Escribir: solo filas propias, en todas las tablas. Nadie puede escribir el catálogo.
  foreach t in array array[
    'profiles', 'exercises', 'routines', 'routine_exercises', 'plans', 'plan_days',
    'workouts', 'workout_exercises', 'sets', 'cardio_entries', 'runs'
  ]
  loop
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (user_id = (select auth.uid()))',
      t || '_insert', t
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))',
      t || '_update', t
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (user_id = (select auth.uid()))',
      t || '_delete', t
    );
  end loop;
end;
$$;

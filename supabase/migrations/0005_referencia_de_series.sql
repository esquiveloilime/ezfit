-- ezfit · Migración 0005: series de referencia al repetir una sesión o traer un ejercicio
-- (HIS-03, HIS-04).
-- Cómo aplicarla: panel de Supabase → SQL Editor → New query → pegar todo → Run.
--
-- Cada ejercicio de una sesión puede apuntar al ejercicio de una sesión pasada cuyas series
-- se muestran como referencia. Vacío: se usa la última vez que se hizo el ejercicio.

alter table public.workout_exercises add column reference_workout_exercise_id uuid;

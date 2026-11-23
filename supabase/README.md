# Configurar Supabase para ezfit

Supabase guarda las cuentas y la copia de los datos en la nube. Sin esto la app funciona igual en **modo sin cuenta**; solo crear cuenta e iniciar sesión necesitan Supabase.

Se hace una sola vez, desde la computadora.

## 1. Crear el proyecto

1. Entra a [supabase.com](https://supabase.com), inicia sesión y toca **New project**.
2. Nombre: `ezfit`. Región: **West US (North California)**, la más cercana a Baja California.
3. Escribe una contraseña para la base de datos y guárdala en un lugar seguro (no se usa en la app).
4. Plan: **Free**. Toca **Create new project** y espera un par de minutos.

## 2. Crear las tablas

1. En el menú izquierdo entra a **SQL Editor** y toca **New query**.
2. Abre el archivo `supabase/migrations/0001_esquema.sql` de este proyecto, copia todo su contenido, pégalo y toca **Run**. Debe decir *Success*.
3. Repite con `supabase/migrations/0002_catalogo.sql` (los 83 ejercicios del catálogo).
4. Repite con `supabase/migrations/0003_plantillas.sql` (las rutinas y planes predeterminados).
5. Repite con `supabase/migrations/0004_gana_el_mas_reciente.sql` (para que un teléfono que estuvo sin conexión no reemplace un cambio más reciente de otro teléfono).
6. Repite con `supabase/migrations/0005_referencia_de_series.sql` (para repetir sesiones y traer ejercicios de otro día con sus series de referencia). Sin ella, las sesiones dejan de subirse a la nube.

Las migraciones se aplican siempre en orden de número, una sola vez cada una. `0002_catalogo.sql` sí se puede volver a ejecutar sin problema.

## 3. Quitar la confirmación por correo

La especificación pide que, al crear la cuenta, el usuario pase directo a la app (CUE-01).

1. Entra a **Authentication** → **Sign In / Providers** → **Email**.
2. Desactiva **Confirm email** y guarda.

## 3b. Permitir que el correo de recuperación abra la app

Para "¿Olvidaste tu contraseña?" (CUE-04): el enlace del correo abre ezfit directo en la pantalla de contraseña nueva.

1. Entra a **Authentication** → **URL Configuration**.
2. En **Redirect URLs** toca **Add URL** y agrega estas dos, una por una:
   - `ezfit://**` (la build de desarrollo y la APK)
   - `exp://**` (Expo Go)
3. Guarda.

## 4. Conectar la app

1. Entra a **Project Settings** → **API Keys** (o al botón **Connect** de arriba).
2. Copia la **Project URL** y la clave **publishable** (si solo aparece la clave `anon`, usa esa).
   **Nunca** copies la clave `service_role` ni la `secret`.
3. En la carpeta del proyecto, copia `.env.example` con el nombre `.env` y pega los dos valores:

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_xxxxxxxx
   ```

4. Reinicia la app con `npx expo start -c` (la `-c` hace que lea el archivo nuevo).

El archivo `.env` no se sube al repositorio.

## Antes de la entrega

El plan gratuito pausa el proyecto tras 7 días sin uso (riesgo R-04). El 24 de noviembre entra al panel y, si aparece pausado, toca **Restore**.

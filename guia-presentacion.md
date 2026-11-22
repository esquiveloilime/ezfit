# Guía para explicar ezfit

## 1. Qué es la app (30 segundos)

**ezfit** es una app móvil para el gimnasio y para correr. Tiene dos partes:

- **Pesas:** registrar cada serie (peso, repeticiones, RIR, técnica, máquina y estado de ánimo), seguir rutinas ya hechas o propias, usar un plan semanal según los días que puedes entrenar y un temporizador de descanso.
- **Running:** grabar una carrera o caminata con GPS, ver la ruta en el mapa y obtener distancia, tiempo y ritmo, al estilo de Strava.

**Lo que la distingue:**

- Funciona **sin cuenta y sin internet** desde el primer momento.
- Registrar una serie igual a la de la vez anterior toma **como máximo 2 toques**. Es una regla del proyecto: "más rápido que una libreta".

## 2. Cómo se hizo: desarrollo guiado por especificaciones

Vale la pena mencionarlo porque es poco común. Antes de escribir código se redactaron 4 documentos en `specs/`:

| Documento | Para qué |
|---|---|
| `00-constitucion.md` | 10 principios que no se pueden romper (sin internet, no perder datos, privacidad…) |
| `01-especificacion.md` | Qué hace la app, con requisitos numerados (SES-01, RUN-07…) |
| `02-plan-tecnico.md` | Tecnologías, arquitectura, modelo de datos |
| `03-tareas.md` | Bloques e incrementos (I-01…I-26) con fechas y pasos de prueba |

El código sigue a los documentos. Cada incremento es un commit (`I-07: …`) con sus pruebas.

## 3. Tecnologías y por qué se eligieron

| Parte | Tecnología | Por qué |
|---|---|---|
| Framework | **React Native + Expo SDK 57**, TypeScript estricto | Un solo código para Android e iOS; se prueba en el teléfono con Expo Go sin instalar Android Studio |
| Navegación | **Expo Router** | Cada archivo dentro de `app/` es una pantalla |
| BD local | **SQLite** (`expo-sqlite`) + **Drizzle ORM** | Es relacional, funciona sin internet y Drizzle da tipos y migraciones |
| Backend | **Supabase** (Postgres + autenticación) | Tiene el mismo modelo relacional que SQLite, plan gratis y no hay que programar un servidor |
| Estado | **Zustand** | Guarda en memoria la sesión de pesas y la carrera en curso |
| Validación | **Zod** | Valida formularios |
| Mapa / GPS | `react-native-maps`, `expo-location` | |
| Avisos | `expo-notifications` (solo locales) | Avisan cuando termina el descanso |
| Pruebas | **Jest** | 142 pruebas, todas pasan |
| Builds | **EAS Build** | Genera la APK en la nube |

**Pregunta probable: "¿Por qué no Firebase?"** Su base de datos no es relacional. Habría que mantener dos modelos de datos distintos, uno en el teléfono y otro en la nube.

## 4. Arquitectura en capas

```
app/            ← PANTALLAS (rutas). Solo muestran y reciben toques
src/features/   ← FUNCIONALIDADES por módulo (workout, run, routines, account…)
src/domain/     ← REGLAS DE NEGOCIO puras: cálculos, sin React Native, con pruebas
src/db/         ← DATOS: esquema, migraciones, repositorios (único lugar que conoce SQLite)
src/sync/       ← SINCRONIZACIÓN (único lugar que hablará con las tablas de Supabase)
src/services/   ← Envolturas de librerías nativas: GPS, notificaciones, auth
src/ui/         ← Componentes base (Button, Card…) y tokens de diseño (colores, espacios)
src/i18n/       ← Todos los textos en español (ningún texto escrito dentro de un componente)
```

**Idea clave para explicar:** cada capa tiene una sola responsabilidad. Las reglas importantes (calcular distancia, filtrar el GPS, precargar series) viven en `src/domain/` como funciones puras. Por eso se pueden probar sin teléfono.

### "Front" y "back"

- **Front:** las pantallas (`app/` + `src/features/` + `src/ui/`) en React Native.
- **Back:** hay dos niveles.
  1. **Local, en el teléfono:** SQLite. Es **la fuente de verdad**: las pantallas siempre leen y escriben aquí.
  2. **Nube:** Supabase, con Postgres y autenticación. Sirve de respaldo y para usar tus datos en otro teléfono. No hay un servidor programado a mano. La seguridad la da **Row Level Security** (ver la sección 5k).

## 5. Detalles de código que vale la pena mostrar

### a) Una base de datos por usuario: `src/db/client.ts`

```ts
export function databaseName(owner: string): string {
  return owner === LOCAL_OWNER ? 'ezfit-local.db' : `ezfit-user-${owner}.db`;
}
```

Cada cuenta tiene su propio archivo SQLite, y el modo sin cuenta otro. Así, si cambias de cuenta en el mismo teléfono, los datos no se mezclan. Al abrir la base se aplican las migraciones y se carga el catálogo de ejercicios.

### b) Consultas en vivo: `src/db/useQuery.ts`

Usa `useLiveQuery` de Drizzle: cuando cambia una tabla, la pantalla se vuelve a dibujar sola. No hace falta "recargar".

### c) Navegación protegida: `app/_layout.tsx`

`Stack.Protected guard={mode === 'welcome'}` decide qué pantallas existen según el modo (`welcome` / `guest` / `user`). Si no eliges modo, solo ves la bienvenida.

### d) IDs generados en el teléfono: `src/domain/id.ts`

Los registros usan UUID creados en el propio teléfono, no números autoincrementales del servidor. Así se pueden crear registros sin conexión, y al subirlos a la nube no chocan.

### e) Campos comunes de todas las tablas: `src/db/schema.ts`

`id`, `user_id`, `created_at`, `updated_at`, `deleted_at`, `sync_status`.

- **`deleted_at` = borrado lógico.** El registro se marca como borrado en vez de eliminarse, para que el borrado también llegue a la nube.
- **`sync_status`** indica si el registro está pendiente de subir o ya sincronizado.

### f) Pasar del modo sin cuenta a una cuenta: `src/db/claim.ts`

Cuando el usuario crea su cuenta, en **una sola transacción** se copian sus registros y se cambia `user_id = 'local'` por el ID real. Si algo falla, no cambia nada y el usuario conserva sus datos. Se usa `INSERT OR IGNORE` para no duplicar.

### g) Running: `src/domain/run.ts` (el más interesante para preguntas)

- **Distancia:** se calcula con la **fórmula del semiverseno (haversine)**, la distancia entre dos coordenadas sobre una esfera.
- **Filtrado de puntos GPS (`filterPoint`):** un punto se descarta si
  - su precisión es peor que 25 m,
  - implica más de 12 m/s (más rápido que un humano corriendo), o
  - está a menos de 3 m del anterior (ruido del GPS).
- **Tramos:** cada pausa cierra un tramo y cada reanudación abre otro. Así no se dibuja una línea por lo que caminaste en pausa, y esa parte no cuenta en la distancia.
- **Ritmo actual:** se calcula sobre los últimos 30 segundos, para que no salte en cada lectura.
- **Ruta guardada:** al terminar, la ruta se **simplifica con Douglas-Peucker**, que quita puntos que no cambian la forma, y se **comprime con el formato de polilínea de Google**. Una carrera de 10 km ocupa unos pocos KB.
- **Recuperación (`src/features/run/runStore.ts`):** cada punto aceptado se guarda de inmediato en `run_points`, y el reloj en `app_meta`. Si la app se cierra a media carrera, se recupera hasta el último punto guardado.

### h) Temporizador de descanso: `src/domain/restTimer.ts`

Guarda la **hora de finalización** (`endsAt`), no un contador que baja. Si cierras la app y la vuelves a abrir, el tiempo restante se recalcula. También programa una notificación local para esa hora.

### i) Precarga de series (la regla de los 2 toques): `prefillSet` en `src/domain/workout.ts`

La siguiente serie se llena sola, en este orden:

1. con la serie equivalente de la sesión anterior,
2. si no hay, con la serie anterior de hoy,
3. si tampoco hay, vacía.

RIR y técnica no se precargan, porque cambian en cada serie.

### j) Unidades de peso

Cada serie guarda su propia unidad (`kg` o `lb`) tal como la escribió el usuario, **sin convertir**. La conversión (1 kg = 2.20462 lb) solo se usa para totales y gráficas. Así nunca se pierde precisión por redondeos.

### k) Seguridad en Supabase: `supabase/migrations/0001_esquema.sql`

Cada tabla tiene **Row Level Security**, con políticas como:

```sql
using (user_id = (select auth.uid()))
```

Esto lo garantiza el servidor: aunque alguien modificara la app, no podría leer datos de otro usuario. Por eso es seguro que la clave pública de Supabase vaya dentro de la app. La clave de servicio **nunca** se usa.

## 6. Preguntas que te podrían hacer

| Pregunta | Respuesta corta |
|---|---|
| ¿Qué pasa sin internet? | Todo lo de pesas funciona igual. SQLite es la fuente de verdad y la nube solo es respaldo. |
| ¿Cómo evitas duplicados al sincronizar? | Los IDs se generan en el teléfono y el servidor hace *upsert* por `id`: repetir un envío no duplica nada. |
| ¿Y si hay conflicto entre el teléfono y la nube? | Gana la modificación más reciente (`updated_at`), registro por registro. Como los datos son de un solo usuario, casi no hay conflictos. |
| ¿Por qué Zustand y no Redux? | Redux tiene demasiada estructura para este tamaño de app. Zustand solo se usa para lo que está "en curso"; lo demás son consultas en vivo a la base. |
| ¿Por qué el mapa no se ve en Expo Go? | La clave de Google Maps que trae Expo Go expiró. Por eso se usa una **build de desarrollo** con clave propia. |
| ¿Cómo pruebas la app? | Jest para la lógica de `domain/` (142 pruebas), TypeScript estricto y lint antes de cada commit, y pruebas manuales en un Samsung S22. |
| ¿Cómo guardas la ubicación sin gastar batería? | El GPS solo se lee durante una carrera activa. La pantalla se mantiene encendida con `expo-keep-awake`. |
| ¿Por qué todos los textos en `i18n/`? | Para poder traducir la app después sin tocar los componentes. |

## ⚠️ Lo que todavía no existe (no lo presentes como hecho)

Hoy (10 de noviembre de 2026) están implementados los bloques 1 a 4 (I-01 a I-12). **No están hechos todavía:**

- la **sincronización con la nube**: la carpeta `src/sync/` está vacía,
- Google Sign-In,
- fotos de ejercicios,
- recomendaciones de peso y gráficas,
- historial de sesiones de pesas,
- running con la pantalla apagada.

Si te preguntan por la sincronización, explícala como **diseño ya planeado** (sección 5 del plan técnico), no como algo que ya funciona. Lo que sí está listo del lado de la nube son el registro e inicio de sesión con Supabase y el esquema con seguridad por fila.

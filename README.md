# ezfit

App móvil de gimnasio y running para Android, hecha con React Native y Expo.

- **Pesas:**
  - Registra cada serie: peso en kg o lb, repeticiones, RIR, técnica y máquina.
  - Sigue rutinas predeterminadas o propias y un plan semanal.
  - Temporizador de descanso.
  - Sugerencia de peso para la siguiente sesión y gráfica de progreso.
- **Running:** graba carreras y caminatas con GPS, también con la pantalla apagada. Muestra la ruta en el mapa, la distancia, el tiempo y el ritmo.
- **Cardio en aparatos:** caminadora, bicicleta y otros, con cronómetro.
- **Sin cuenta y sin internet** desde el primer momento. Con cuenta (correo o Google), los datos se respaldan en la nube y se recuperan en otro teléfono.

## Instalar la app

1. Abre en el teléfono Android el enlace del APK que viene en la entrega.
2. Descarga el archivo e instálalo. Si Android pregunta, permite instalar apps desde el navegador.
3. Abre **ezfit**. Puedes empezar sin cuenta.

Probada en un Samsung Galaxy S22.

## Ejecutar el proyecto en una computadora

Requisitos: Node.js 20 o más nuevo y una cuenta gratuita de Expo.

```bash
npm install
cp .env.example .env   # llenar con los datos públicos de Supabase y Google (ver supabase/README.md)
npx expo start --go    # abre la app en Expo Go (sin mapa en Android ni Google)
```

| Para qué | Comando |
|---|---|
| Verificar tipos, lint y pruebas | `npm run check` |
| Build de desarrollo (con mapa) | `npx eas-cli build --profile development --platform android` |
| APK independiente | `npx eas-cli build --profile preview --platform android` |

## Cómo está hecho

- **Tecnologías:**
  - Expo SDK 57, React Native 0.86 y TypeScript estricto.
  - Expo Router para la navegación.
  - SQLite con Drizzle en el teléfono.
  - Supabase para cuentas y respaldo.
  - react-native-maps y expo-location para el running.
- **Arquitectura:** la base de datos del teléfono es la fuente de verdad. La sincronización con Supabase corre aparte y nunca bloquea al usuario. Las reglas de negocio viven en `src/domain/`, sin depender de React Native, y tienen pruebas con Jest.
- **Método:** desarrollo guiado por especificaciones con ayuda de IA (Claude Code).

| Carpeta o archivo | Contenido |
|---|---|
| `specs/` | Constitución, especificación, plan técnico y tareas |
| `docs/bitacora-ia.md` | Bitácora de uso de IA |
| `docs/diario-decisiones.md` | Diario de decisiones |
| `app/` | Pantallas (rutas) |
| `src/` | Dominio, base de datos, sincronización, servicios, interfaz y textos |
| `supabase/` | Migraciones y guía para configurar Supabase |
| `guia-presentacion.md` | Guía para presentar la app |

## Pendiente

Quedaron fuera de esta entrega, por tiempo:
- Parciales por kilómetro.
- Récords personales.
- Editar sesiones pasadas.
- Cambiar el plan después de la incorporación.
- Compartir una actividad como imagen.
- Descanso en la barra de notificaciones.

Están anotados en `specs/03-tareas.md` (I-23).

## Créditos

Las fotos de los ejercicios vienen de [free-exercise-db](https://github.com/yuhonas/free-exercise-db), con licencia Unlicense (dominio público). El detalle está en `assets/exercises/FUENTE.md`.

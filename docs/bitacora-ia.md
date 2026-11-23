# Bitácora de uso de IA

Registro de cómo se usó inteligencia artificial para construir **ezfit**. Las fechas y los incrementos salen del historial de commits del repositorio (`git log`).

## Herramienta y forma de trabajo

- **Herramienta:** Claude Code (modelo Claude de Anthropic), usado desde la terminal y VS Code en Windows.
- **Método:** desarrollo guiado por especificaciones. Primero se escribieron los documentos de `specs/` y después la IA implementó el código siguiéndolos. Las reglas para la IA están en `CLAUDE.md`.
- **Reparto de trabajo:**
  - **Autor:** decide qué hace la app, aprueba la especificación y los cambios, crea las cuentas y credenciales (Supabase, Google Cloud, EAS) y prueba cada bloque en su teléfono (Samsung S22).
  - **IA:** redacta la especificación con las respuestas del autor, propone la arquitectura, escribe el código y las pruebas automáticas, verifica tipos, lint y pruebas, y hace un commit por incremento.
- **Controles sobre la IA:**
  - No puede agregar librerías sin aprobación (constitución, principio de simplicidad).
  - No puede implementar nada que no esté en la especificación: si falta algo, propone el cambio y espera.
  - Cada incremento pasa `npm run check` (TypeScript estricto, ESLint y Jest) antes del commit.
  - El autor prueba cada bloque en el teléfono con una lista "Cómo probarlo" y reporta fallas. La IA las corrige y solo entonces se marca el bloque como hecho.

## Registro por fecha

### 2 de noviembre de 2026: especificación y bloques 1 a 3

- La IA redactó la constitución, la especificación (versiones 0.1 a 0.3), el plan técnico y la lista de tareas a partir de la idea del autor y de sus respuestas (especificación, secciones 8 y 9).
- El autor resolvió las preguntas abiertas: nombre de la app, fecha de entrega, unidades kg/lb, mapas obligatorios y tarjeta para Google Cloud.
- La IA implementó del I-01 al I-09: proyecto base, base de datos local con catálogo de 83 ejercicios, cuenta y modo sin cuenta, ejercicios propios, rutinas, plan semanal, sesión de entrenamiento con RIR, técnica y máquina, y temporizador de descanso.
- Correcciones tras las pruebas del autor:
  - Búsqueda por grupo muscular.
  - Mostrar u ocultar la contraseña.
  - Rutinas Pierna/Push/Pull en lugar de rutinas por músculo (cambio pedido por el autor).
  - Arreglo de las notificaciones que impedían abrir la app en Expo Go.

### 3 de noviembre de 2026: bloque 3 cerrado y running

- Ajustes de la sesión tras la prueba: ejercicios plegados, pantalla Hoy y confirmación al quitar un ejercicio.
- I-10 a I-12: permiso de ubicación, mapa, seguimiento GPS con filtrado de puntos, pausa, recuperación si la app se cierra, resumen e historial de actividades.
- **Problema encontrado:** el mapa salía negro en Expo Go en Android. La IA lo diagnosticó (la clave de Google Maps de Expo Go expiró) y propuso adelantar la build de desarrollo con clave propia. El autor aprobó la excepción en la constitución.

### 21 de noviembre de 2026: feedback de la build de desarrollo

- El autor probó la build de desarrollo y dio feedback. La IA lo convirtió en la especificación 0.4:
  - Barra inferior en todas las pantallas.
  - Rutinas en tarjetas.
  - Aviso de privacidad.
  - Historial combinado por mes.
  - Mejores marcas de running.
  - Compartir el resumen como imagen.
- Ajustes visuales del mapa, del teclado, de la sesión y del temporizador.
- La IA escribió `guia-presentacion.md` para que el autor explique la app.

### 22 de noviembre de 2026: bloques 4 a 7

- I-13 a I-15: sincronización con Supabase (subida, bajada, restauración en otro teléfono, aviso al cerrar sesión con cambios sin subir, recuperación de contraseña).
- I-16 a I-18: cardio en aparatos, historial por mes y por ejercicio, repetir sesiones y guardar una sesión como rutina.
- I-19 y I-25: ícono propio, pantalla de carga y botón **Continuar con Google**.
- I-20: grabar la actividad con la pantalla apagada. La IA pidió permiso para agregar `expo-task-manager` y el autor lo aprobó.
- I-21: sugerencia de peso con reglas fijas (sin IA dentro de la app, supuesto S-07), incremento de peso y gráfica de progreso. La IA dibujó la gráfica sin librería para no agregar dependencias.
- I-26: la IA confirmó la licencia de free-exercise-db (dominio público) y eligió a mano 81 fotos para los 83 ejercicios.
- Recorte para entregar a tiempo: el autor decidió dejar pendientes los requisitos P2 de I-23.
- Preparación del APK independiente (perfil `preview` de EAS) y de la entrega.

## Qué funcionó bien y qué no

- **Bien:**
  - La especificación con requisitos numerados permitió pedir bloques completos y comprobar cada uno con su lista de pruebas.
  - Las pruebas automáticas (más de 240) detectaron errores antes de llegar al teléfono.
- **A vigilar:**
  - La IA no puede probar en el teléfono real. Los problemas de mapa, notificaciones y diseño solo aparecieron en las pruebas del autor.
  - Cuando el editor se congeló, la IA perdió la conversación. Se pudo continuar porque todo estaba en commits y en `specs/`.

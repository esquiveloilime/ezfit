# Instrucciones para Claude Code

**ezfit**: app móvil de gimnasio y running hecha con React Native y Expo. Se entrega como APK entre el 25 y el 27 de noviembre de 2026. Este proyecto se desarrolla con **desarrollo guiado por especificaciones**: los documentos de `specs/` mandan y el código los sigue.

## Documentos

Leer antes de cualquier tarea, en este orden:

| Archivo | Contiene |
|---|---|
| `specs/00-constitucion.md` | Principios que no se pueden romper |
| `specs/01-especificacion.md` | Qué hace la app y cómo se comprueba |
| `specs/02-plan-tecnico.md` | Tecnologías, arquitectura, modelo de datos, sincronización |
| `specs/03-tareas.md` | Bloques, incrementos, fechas límite y listas de prueba |

## Cómo trabajar

El autor del proyecto no programa: pide incrementos, aprueba planes y prueba en su teléfono. Explícale las cosas en español, sin dar por hecho que conoce los términos técnicos.

La prioridad es avanzar rápido. El autor pide bloques completos ("Implementa el bloque 3"). Para cada bloque de `specs/03-tareas.md`:

1. Lee los incrementos del bloque y los requisitos que cubren.
2. Implementa los incrementos en orden, sin esperar aprobación de un plan. Detente a preguntar solo si no está claro qué debe hacer la app.
3. En cada incremento: escribe sus pruebas automáticas, verifica tipos, lint y pruebas, y haz un commit.
4. Al terminar el bloque, entrega al autor las listas "Cómo probarlo" juntas y los pasos para ejecutar la app.
5. Corrige lo que el autor reporte. Cuando confirme que todo pasó, marca los incrementos como hechos en `specs/03-tareas.md`.

## Reglas

- **No implementes nada que no esté en la especificación.** Si falta algo o un requisito parece incorrecto, detente y propón el cambio a la especificación. Una vez aprobado, actualiza la especificación y el código en el mismo commit.
- **Un commit por incremento**, aunque se hagan varios el mismo día. No mezcles refactorizaciones no pedidas.
- **No agregues dependencias** fuera de las del plan técnico sin explicarlo y sin aprobación.
- **No rompas la compatibilidad con Expo Go** antes del incremento I-19. La única excepción es el dibujo del mapa en Android, que se ve en la build de desarrollo (constitución, principio 7).
- **Peso:** cada serie guarda su propia unidad (`kg` o `lb`) tal como la eligió el usuario; nunca conviertas al guardar. La unidad por defecto es `lb`.
- **No actualices la versión de Expo** a mitad del proyecto.
- **La base de datos local es la fuente de verdad.** Las pantallas nunca leen ni escriben directamente en Supabase; eso solo lo hace la capa de sincronización.
- **Las reglas de negocio van en `src/domain/`**, sin dependencias de React Native, y con pruebas.
- **Ningún texto de interfaz escrito directamente en un componente:** todos van en `src/i18n/`.
- **Nunca subas secretos** al repositorio. La clave de servicio de Supabase no se usa en este proyecto.
- **Ante la duda, pregunta.** Es preferible una pregunta a una suposición sobre qué debe hacer la app.

## Convenciones

- Código, archivos, tablas y columnas en inglés. Interfaz, documentación y commits en español. El glosario de equivalencias está en el plan técnico, sección 3.
- TypeScript estricto. Sin `any` salvo justificación en un comentario.
- Mensajes de commit: `I-07: descripción breve en español`.
- Todo cambio en el esquema de la base de datos va con su migración, tanto en SQLite como en Supabase.

## Comandos

| Para qué | Comando |
|---|---|
| Iniciar la app (Expo Go) | `npx expo start --go` (si la red bloquea la conexión: agregar `--tunnel`) |
| Iniciar la app (build de desarrollo, para ver el mapa) | `npx expo start` (si la red bloquea la conexión: agregar `--tunnel`) |
| Generar la build de desarrollo | `npx eas-cli build --profile development --platform android` |
| Verificar tipos | `npm run typecheck` |
| Lint | `npm run lint` |
| Pruebas | `npm test` |
| Todo lo anterior antes de un commit | `npm run check` |
| Generar una migración de SQLite tras cambiar `src/db/schema.ts` | `npm run db:generate` |
| Instalar una librería | `npx expo install <paquete>` (elige la versión compatible con el SDK 57) |
| Revisar versiones y configuración | `npx expo-doctor` |

- Las rutas (pantallas) viven en `app/`; todo lo demás en `src/` con el alias `@/` (por ejemplo, `@/ui`).
- Las migraciones de Supabase están en `supabase/migrations/` y se aplican pegándolas en el editor SQL del panel de Supabase, en orden.
- `AGENTS.md` trae consejos generales de Expo; si choca con este archivo o con `specs/`, mandan estos.

## Estado

Bloque actual: 4, running con la app abierta. Los bloques 1 (I-01 a I-03) y 2 (I-04 a I-06) quedaron probados y cerrados el 2 de noviembre de 2026, y el bloque 3 (I-07 a I-09) el 3 de noviembre de 2026.

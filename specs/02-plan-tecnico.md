# Plan técnico

**ezfit**, app móvil de gimnasio y running.
Versión 0.5, 21 de noviembre de 2026: librerías para compartir el resumen de una actividad como imagen (RUN-14).
Versión 0.4, 3 de noviembre de 2026: el mapa en Android se prueba en una build de desarrollo desde el bloque 4.
Versión 0.3, 2 de noviembre de 2026: modo sin cuenta, inicio de sesión con Google, fotos y videos de ejercicios.

Este documento describe **cómo** se construye lo que pide `01-especificacion.md`. No contiene código. Las versiones y límites de servicios se verificaron el 1 de octubre de 2026; las fuentes están al final.

## 1. Decisiones principales

| Tema | Decisión | Por qué | Alternativa descartada |
|---|---|---|---|
| Framework | React Native con **Expo SDK 57** (React Native 0.86) y TypeScript estricto | Es la versión estable actual; permite desarrollar desde Windows y probar en el teléfono con Expo Go | React Native sin Expo: más configuración nativa sin ningún beneficio para este proyecto |
| Navegación | **Expo Router** | Viene con Expo, rutas por archivos, fácil de seguir para un agente | React Navigation configurado a mano |
| Base de datos local | **SQLite** con `expo-sqlite` y **Drizzle ORM** | Funciona en Expo Go, es relacional (igual que los datos de la app), y Drizzle da tipos y migraciones | WatermelonDB y Realm no funcionan en Expo Go; AsyncStorage no sirve para consultas de historial |
| Backend | **Supabase**: autenticación y base de datos Postgres con seguridad por fila | Mismo modelo relacional que SQLite, lo que simplifica la sincronización; plan gratuito suficiente; no hay que programar un servidor | Firebase: su base de datos no relacional obligaría a mantener dos modelos de datos distintos |
| Sincronización | **Motor propio y simple**: escribir primero en local, subir pendientes, bajar cambios, gana la última modificación | Los datos son de un solo usuario, así que casi no hay conflictos; evita depender de un servicio extra | PowerSync o similares: más potentes, pero agregan un servicio y complejidad que el proyecto no necesita |
| Mapas | **react-native-maps** (Google Maps en Android, Apple Maps en iOS) | Es la librería de mapas que se carga dentro de Expo Go. En Android, Expo Go la carga pero el mapa sale negro (sección 2), así que el mapa se ve con la build de desarrollo y la clave propia | MapLibre y `expo-maps` no funcionan en Expo Go; MapLibre queda como plan B (riesgo R-03) |
| Ubicación | **expo-location**, y **expo-task-manager** para la tarea de segundo plano (RUN-10) | Incluida en Expo Go para seguimiento con la app abierta; con expo-task-manager sigue en segundo plano en una build de desarrollo | Librerías de terceros de pago |
| Avisos de descanso | **expo-notifications**, solo notificaciones locales | Las notificaciones locales funcionan en Expo Go | Notificaciones push: no se necesitan y no funcionan en Expo Go para Android |
| Estado en pantalla | **Zustand** para la sesión y la actividad en curso; consultas en vivo de Drizzle para lo demás | Mínimo y fácil de probar | Redux: demasiada estructura para este tamaño |
| Validación | **Zod** | Valida formularios y los datos que llegan del servidor con el mismo esquema | Validación manual |
| Estilos | Hojas de estilo de React Native con un archivo de tokens de diseño (colores, espaciado, tipografía) y componentes propios | Sin dependencias, control total del aspecto | Librerías de componentes: imponen un aspecto genérico y agregan peso |
| Gráficas | **Componente propio** dibujado con vistas de React Native (I-21) | Solo se necesita una gráfica de líneas; así no se agregan dependencias ni cambios nativos | `react-native-gifted-charts`: pide además `react-native-svg` y una librería de degradados |
| Pruebas | **Jest** con `jest-expo` para lógica de dominio y sincronización | Estándar en Expo | Pruebas de interfaz automatizadas: no caben en el calendario |
| Builds | **EAS Build** en la nube | Genera la APK sin instalar Android Studio y funciona desde Windows | Compilar en local: instalación pesada y frágil en Windows |
| Modo sin cuenta | La misma base de datos SQLite, en un archivo propio del modo sin cuenta; la sincronización no se ejecuta hasta que hay cuenta | No hace falta otra forma de guardar datos: todo lo de la app ya funciona sobre SQLite | Iniciar sesión anónima en Supabase: necesita internet la primera vez, justo lo que se quiere evitar |
| Inicio de sesión con Google | `@react-native-google-signin/google-signin` (versión gratuita) y Supabase, que recibe el token de Google | Muestra las cuentas de Google del teléfono y se entra con un toque; es lo que Supabase recomienda para apps móviles | Abrir el navegador para iniciar sesión: más pasos y falla más al volver a la app |
| Fotos de ejercicios | Imágenes de **free-exercise-db** (dominio público), incluidas dentro de la app y mostradas con el componente de imagen de React Native | Sin pagos ni problemas de derechos, se ven sin internet, sin dependencias nuevas | Descargarlas de internet: no se verían en un gimnasio sin señal |
| Videos tutoriales | Abrir YouTube con `Linking`, que ya trae React Native | Sin reproductor propio ni dependencias | Reproductor dentro de la app: más peso y complejidad, fuera de alcance |
| Estado de la conexión | **expo-network** | Funciona en Expo Go; lo usan la sincronización (para subir al recuperar la conexión) y el botón de tutorial | `@react-native-community/netinfo`: equivalente, pero no es parte de Expo |
| Compartir una actividad como imagen | **react-native-view-shot** para convertir la tarjeta del resumen en imagen y **expo-sharing** para abrir el menú de compartir del teléfono (RUN-14) | Las dos vienen en Expo Go; el menú de compartir ya permite guardar en la galería, así que no se pide permiso de fotos | `expo-media-library`: pide permiso de la galería solo para guardar, y el menú de compartir ya lo hace |

Las dependencias `@react-native-google-signin/google-signin` y `expo-network` se agregaron en la versión 0.3 y el autor las aprobó el 2 de noviembre de 2026. La dependencia `expo-task-manager` se agregó con I-20 y el autor la aprobó el 22 de noviembre de 2026.

## 2. Qué funciona en Expo Go y qué no

Esto condiciona el orden del trabajo.

| Función | En Expo Go | Qué se hace |
|---|---|---|
| Pesas, rutinas, historial, base de datos local | Sí | Se desarrolla y prueba en Expo Go |
| Cuenta con correo y sincronización | Sí | Igual |
| Modo sin cuenta, fotos de ejercicios y botón de tutorial | Sí | Igual |
| Seguimiento de running con la app abierta | Sí | Fase A de running, bloque 4 |
| Dibujo del mapa en Android | **No**: la clave de Google Maps que trae Expo Go expiró y el mapa sale negro (solo se ve el logo de Google) | Build de desarrollo con clave propia desde el bloque 4 (sección 6). La ruta se mide y se guarda igual en Expo Go |
| Aviso de fin de descanso (notificación local) | Sí | Igual |
| Running con la pantalla apagada (RUN-10) | **No** en Android | Fase B: build de desarrollo instalada en el S22, bloque 7 |
| Continuar con Google (CUE-08) | **No** | Se prueba con la build de desarrollo, bloque 7 (I-25). En Expo Go el botón no se muestra y la librería no se carga |
| Mapa en la APK final | Requiere clave propia de Google Maps | Se configura en el bloque 4, junto con la build de desarrollo, con la tarjeta de débito del autor (riesgo R-03) |

Una **build de desarrollo** es una versión propia de la app que se instala en el teléfono como APK y se usa igual que Expo Go, pero sin sus limitaciones. Se genera por primera vez en el bloque 4, solo para ver el mapa; a partir del bloque 7 el desarrollo continúa con ella. Salvo el dibujo del mapa en Android, todos los requisitos P1 siguen pudiendo probarse en Expo Go.

- **Librería:** `expo-dev-client`, que convierte la app en build de desarrollo. Se agregó en la versión 0.4.
- **Configuración:** `eas.json` con el perfil `development` (APK de instalación directa). La clave de Google Maps llega como variable de entorno de EAS (`GOOGLE_MAPS_API_KEY`) y `app.config.ts` la pasa al plugin de react-native-maps.
- **Al iniciar la app:** con `expo-dev-client` instalado, `npx expo start` abre la build de desarrollo; para Expo Go se usa `npx expo start --go`.

## 3. Arquitectura

### Capas

| Capa | Responsabilidad | Regla |
|---|---|---|
| **Pantallas** | Mostrar datos y recibir toques | No contienen reglas de negocio ni consultas directas a la base de datos |
| **Funcionalidades** | Componentes y lógica de cada módulo (sesión, rutinas, running, etc.) | Un módulo no importa componentes internos de otro |
| **Dominio** | Cálculos y reglas puras: recomendación de peso, volumen, distancia, ritmo, filtrado de puntos GPS | Sin dependencias de React Native ni de la base de datos; cubierto por pruebas |
| **Datos** | Esquema, migraciones, repositorios y datos iniciales | Único lugar que conoce SQLite |
| **Sincronización** | Subir y bajar cambios | Único lugar que habla con las tablas de Supabase |
| **Servicios** | Envolturas de ubicación, notificaciones, autenticación | Aíslan las librerías nativas para poder sustituirlas en pruebas |

### Estructura de carpetas

```
app/                    Pantallas y rutas (Expo Router)
  (auth)/               Bienvenida, registro, inicio de sesión
  (onboarding)/         Incorporación
  (tabs)/               Hoy, Rutinas, Correr, Historial, Perfil
src/
  features/             Un directorio por módulo de la especificación
  domain/               Reglas y cálculos puros, con sus pruebas
  db/                   Esquema, migraciones, repositorios, datos iniciales
  sync/                 Motor de sincronización
  services/             Supabase, ubicación, notificaciones
  ui/                   Componentes base y tokens de diseño
  i18n/                 Textos en español
assets/
  exercises/            Fotografías del catálogo, con un archivo de fuente y licencia
specs/                  Estos documentos
```

### Idioma del código

- Código, nombres de archivos, tablas y columnas: **inglés**.
- Textos de la interfaz, documentación y mensajes de commit: **español**.

| Término de la especificación | Nombre en el código |
|---|---|
| Ejercicio | exercise |
| Rutina / plantilla | routine (plantilla = rutina sin dueño) |
| Plan semanal | plan |
| Sesión | workout |
| Serie | set |
| Bloque de cardio | cardio entry |
| Actividad de running | run |
| Máquina usada | machine |
| Estado de ánimo | mood |

## 4. Modelo de datos

El mismo modelo existe en SQLite (teléfono) y en Postgres (Supabase).

### Campos comunes

Toda tabla sincronizada tiene:

| Campo | Uso |
|---|---|
| `id` | Identificador único generado en el teléfono, para poder crear registros sin conexión |
| `user_id` | Dueño del registro. Vacío en el catálogo y las plantillas. En modo sin cuenta lleva la marca `local` hasta que el usuario crea su cuenta (sección 5) |
| `created_at`, `updated_at` | Fechas de creación y de última modificación |
| `deleted_at` | Borrado lógico: el registro se marca, no se elimina, para que el borrado también se sincronice |
| `sync_status` | Solo en el teléfono: sincronizado o pendiente |

### Tablas

| Tabla | Contenido | Campos propios principales |
|---|---|---|
| `profiles` | Ajustes del usuario | nivel, unidad de peso, días de entrenamiento, plan activo, descanso por defecto, inicio automático, sonido, vibración, incremento de peso, incorporación completada |
| `exercises` | Catálogo y ejercicios propios | nombre, grupo muscular, grupos secundarios, equipo, tipo de registro, usa RIR, usa técnica, notas, archivado, clave de foto (solo catálogo), enlace de video |
| `routines` | Rutinas propias y plantillas | nombre, descripción, categoría (propia, tiempo, músculo, plan), duración estimada. La categoría `músculo` (`muscle`) agrupa las rutinas de Pierna, Push y Pull |
| `routine_exercises` | Ejercicios de una rutina | rutina, ejercicio, orden, series objetivo, repeticiones mínimas y máximas, descanso |
| `plans` | Planes semanales | nombre, días por semana |
| `plan_days` | Rutina de cada día de un plan | plan, orden, rutina, día de la semana (opcional) |
| `workouts` | Sesiones | rutina de origen (opcional), inicio, fin, estado (en curso, terminada), ánimo, notas |
| `workout_exercises` | Ejercicios de una sesión | sesión, ejercicio, orden, máquina, notas, ejercicio de referencia (de la sesión pasada cuyas series se muestran al repetirla o al traerlo, HIS-03 y HIS-04) |
| `sets` | Series | ejercicio de sesión, orden, tipo (calentamiento, efectiva), peso, unidad, repeticiones, duración, distancia, RIR, técnica, hora |
| `cardio_entries` | Bloques de cardio | sesión, aparato, duración, nivel, velocidad, distancia, inclinación, notas |
| `runs` | Actividades de running | tipo, nombre, inicio, fin, tiempo en movimiento, distancia, ritmo promedio, ruta simplificada, notas, estado |
| `run_points` | Puntos GPS crudos. **Solo en el teléfono** | actividad, latitud, longitud, precisión, hora, tramo |

### Notas del modelo

- **Catálogo y plantillas:** vienen dentro de la app como datos iniciales con identificadores fijos, y se cargan una vez en Supabase con los mismos identificadores. Así están disponibles sin conexión y las referencias coinciden en ambos lados.
- **Series de referencia al repetir una sesión (HIS-03):** no se copian como series hechas. La sesión nueva se crea con los ejercicios, y los valores de referencia se leen de la sesión de origen.
- **Unidad de peso:** cada serie guarda el peso tal como se escribió y su unidad (`kg` o `lb`), sin convertir (SES-03, AJU-01). La conversión (1 kg = 2.20462 lb) vive en la capa de dominio y solo se usa para totales, récords, recomendaciones y gráficas. La unidad por defecto de `profiles` es `lb`.
- **Ruta de running:** mientras la actividad está activa, cada punto se guarda en `run_points`. Al terminar, se calcula una ruta simplificada y comprimida que se guarda en `runs` y es lo único que se sincroniza. Una carrera de 10 km ocupa unos pocos kilobytes.
- **Una base de datos local por usuario:** el archivo de SQLite lleva el identificador del usuario en el nombre. Así, al cambiar de cuenta en el mismo teléfono no se mezclan datos (CUE-03). El modo sin cuenta usa su propio archivo, que pasa a la cuenta al crearla (sección 5).
- **Fotos:** van dentro de la app y no se sincronizan. En Supabase el catálogo solo guarda la clave de la foto (sección 9).

## 5. Sincronización

### Principio

La app lee y escribe siempre en SQLite. La nube es una copia de respaldo que además permite usar otro teléfono.

### Funcionamiento

1. **Escritura:** cada cambio se guarda en SQLite, actualiza `updated_at` y marca el registro como pendiente.
2. **Subida:** se envían los registros pendientes, tabla por tabla y en orden de dependencia (primero las sesiones, luego sus ejercicios, luego sus series). El servidor inserta o actualiza según el `id`, por lo que repetir un envío no duplica nada. Al confirmarse, se marcan como sincronizados.
3. **Bajada:** por cada tabla se piden los registros modificados en el servidor desde la última bajada. Un registro bajado se aplica solo si el local no está pendiente o si el del servidor es más reciente.
4. **Borrados:** viajan como cualquier otra modificación, gracias al borrado lógico.

### Cuándo se ejecuta

Al abrir la app, al recuperar la conexión, al terminar una sesión o una actividad, y cuando el usuario toca "Sincronizar". Nunca en medio de una serie y nunca bloqueando la pantalla.

### Reglas

- **Conflictos:** gana la modificación más reciente, registro por registro. En el servidor, un disparador ignora la subida de una versión más antigua que la guardada (migración 0004), y en el teléfono el registro bajado solo se aplica según la regla de la bajada.
- **Teléfono nuevo:** la primera vez que se abre la base de una cuenta, la app espera a terminar la bajada antes de mostrar las pantallas, con la opción de continuar sin esperar; así no pide la incorporación a quien ya la hizo (SIN-04).
- **Running:** una actividad se sube hasta que se guarda o se descarta; mientras está en curso o en el resumen solo existe en el teléfono que la grabó.
- **Reloj:** el punto de corte de cada bajada usa una marca de tiempo puesta por el servidor, para no perder cambios si el reloj del teléfono está mal.
- **Fallos:** si una subida falla, los registros siguen pendientes y se reintenta en la siguiente ocasión. El estado de error se muestra en **Perfil** (SIN-03).
- **Seguridad:** cada tabla en Supabase tiene reglas por fila: un usuario solo puede leer y escribir registros cuyo `user_id` es el suyo. El catálogo y las plantillas son de solo lectura para todos.

### Modo sin cuenta y paso a una cuenta (CUE-07)

- Sin cuenta, la app usa un archivo de SQLite propio del modo sin cuenta. Los registros del usuario llevan `user_id = local` y el motor de sincronización no se ejecuta.
- Al crear una cuenta o iniciar sesión desde el modo sin cuenta:
  1. En una sola transacción se cambia `local` por el identificador del usuario en todos los registros y se marcan como pendientes. Si algo falla, no cambia nada y el usuario sigue en modo sin cuenta con sus datos.
  2. El archivo pasa a ser la base de datos de esa cuenta. Si en el teléfono ya existía la base de datos de esa misma cuenta, los registros se copian a ella.
  3. Ajustes: se consulta el perfil de la cuenta en Supabase. Si existe y tiene la incorporación completada, el perfil local se descarta y se usa el de la cuenta (D-03). Si no existe, se sube el local.
  4. Se sincroniza como siempre: se suben los registros del teléfono y se bajan los de la cuenta. Los identificadores se generan en el teléfono, así que no chocan con los que ya tenía la cuenta.
- Una sesión o actividad que esté en curso en ese momento sigue en curso.
- Después de cerrar sesión, "Empezar sin cuenta" crea un archivo nuevo y vacío.

### Pruebas obligatorias del motor

- Reintentar una subida no duplica registros.
- Un registro local pendiente no es reemplazado por una versión más antigua del servidor.
- Un borrado hecho sin conexión llega al servidor y a un segundo teléfono.
- Una cuenta no puede leer registros de otra.
- Pasar del modo sin cuenta a una cuenta nueva sube todos los registros, sin duplicados.
- Pasar del modo sin cuenta a una cuenta con datos conserva los registros de los dos lados y deja los ajustes de la cuenta.
- Si el paso a una cuenta falla a la mitad, no quedan registros con la marca `local` mezclados con los de la cuenta.

## 6. Running

### Fase A: con la app abierta (Expo Go)

- Lectura continua de la ubicación con la máxima precisión, aproximadamente un punto cada segundo o cada 5 metros.
- La pantalla se mantiene encendida durante la actividad.
- Cada punto aceptado se guarda de inmediato en `run_points` (RUN-08).

### Filtrado de puntos (RUN-07)

Un punto se descarta si:

- su precisión reportada es peor que 25 metros,
- implica una velocidad imposible para una persona corriendo (más de 12 m/s respecto al punto anterior), o
- está a menos de 3 metros del último punto aceptado.

Los umbrales son valores iniciales; se ajustan con pruebas reales en la calle y quedan como constantes con nombre.

### Cálculos

- **Distancia:** suma de las distancias entre puntos aceptados consecutivos del mismo tramo.
- **Ritmo actual:** calculado sobre los últimos 30 segundos, para que no salte en cada lectura.
- **Ritmo promedio:** tiempo en movimiento entre distancia.
- **Tramos:** cada pausa cierra un tramo y cada reanudación abre otro, para no unir con una línea lo recorrido en pausa (RUN-04).

Todos estos cálculos viven en la capa de dominio y se prueban con recorridos grabados de ejemplo.

### Fase B: con la pantalla apagada (build de desarrollo)

- Seguimiento en segundo plano con un servicio en primer plano de Android y su notificación permanente.
- Permiso de ubicación "todo el tiempo", pedido solo cuando el usuario inicia su primera actividad y con explicación previa.
- La tarea de segundo plano escribe directamente en SQLite; la pantalla solo lee.
- En teléfonos Samsung hay que indicar al usuario que quite la restricción de batería para la app; se agrega una pantalla de ayuda.
- Si el permiso no se concede, o en Expo Go, la actividad se graba como en la fase A, con la pantalla encendida y el aviso de RUN-10. Desde la pantalla previa se puede volver a pedir el permiso.
- El servicio se detiene si el usuario cierra la app; al volver a abrirla se ofrece guardar lo registrado (RUN-08).

## 7. Temporizador de descanso

- El temporizador guarda la **hora de finalización**, no un contador. Al volver a la app o reabrirla, el tiempo restante se recalcula, así sobrevive al cierre de la app (SES-10).
- Al iniciar se programa una notificación local para la hora de finalización. Si se salta o se ajusta, la notificación se cancela o reprograma.
- Con la app en pantalla, avisa con sonido y vibración sin notificación.

## 8. Inicio de sesión con Google

- Cubre CUE-08. Solo funciona en la build de desarrollo y en la APK. La capa de servicios detecta si la app corre en Expo Go; en ese caso no carga la librería y el botón no aparece.
- **Funcionamiento:** la librería muestra el selector de cuentas de Google del teléfono y devuelve un token. La app se lo entrega a Supabase, que crea la cuenta o abre la existente. La sesión se guarda igual que con correo y contraseña.
- **Configuración en Google Cloud** (gratis, no pide tarjeta):
  - Pantalla de consentimiento con datos básicos (correo y nombre), publicada. Con solo esos datos Google no pide revisión.
  - Un ID de cliente de tipo "Web", que se registra en Supabase.
  - Un ID de cliente de tipo "Android" con el nombre del paquete y la huella SHA-1 de la llave con la que EAS firma la app. Si la build de desarrollo y la APK final usan llaves distintas, se registra una huella por cada una.
- **Mismo correo:** Supabase une la cuenta de Google con una cuenta de correo y contraseña ya existente cuando el correo coincide y está confirmado. Como el registro con correo no pide confirmación (CUE-01 lleva directo a la incorporación), en I-25 se comprueba qué hace Supabase en ese caso (riesgo R-11).

## 9. Fotos y videos de los ejercicios

### Fotos (EJE-05)

- **Fuente:** free-exercise-db, un repositorio público con unos 800 ejercicios y sus fotos, con licencia Unlicense (dominio público). La licencia se vuelve a confirmar al empezar I-26 y se guarda un archivo con la fuente y la licencia en `assets/exercises/`. Plan B: Wikimedia Commons, solo con fotos de licencia libre y anotando la atribución que pida cada una.
- Una foto por ejercicio, elegida a mano para que corresponda con el ejercicio del catálogo. Meta: 60 de los 80 ejercicios con foto.
- Peso total menor a 8 MB. Si se pasa, las imágenes se reducen una sola vez en la computadora, sin agregar nada a la app.
- Cada ejercicio del catálogo guarda una clave de foto. Un índice en `src/db/` relaciona cada clave con su imagen. Sin clave, se muestra el ícono del grupo muscular con los íconos que ya trae Expo (`@expo/vector-icons`).

### Videos (EJE-06)

- Campo opcional `video_url` en `exercises`. En los ejercicios propios lo escribe el usuario y se valida con Zod (solo direcciones `http` o `https`).
- El botón **Ver tutorial** abre el enlace del ejercicio si lo tiene, o si no una búsqueda en YouTube con "cómo hacer" más el nombre del ejercicio. La función que arma la dirección vive en `src/domain/` y tiene pruebas.
- Antes de abrir YouTube se consulta el estado de la conexión con expo-network. Sin conexión se muestra un aviso en lugar de abrir nada.

## 10. Entorno de trabajo

### En la computadora (Windows)

- Node.js en su versión LTS, Git, un editor (VS Code) y Claude Code.
- No hace falta Android Studio.

### Cuentas gratuitas necesarias

| Servicio | Para qué | Cuándo |
|---|---|---|
| GitHub | Repositorio | Antes de empezar |
| Expo | Expo Go y builds en la nube | Antes de empezar |
| Supabase | Cuentas de usuario y base de datos | Bloque 1 |
| Google Cloud | Clave de Google Maps para la build de desarrollo y la APK, y credenciales del inicio de sesión con Google | Maps: en el bloque 4, con tarjeta de débito (R-03). Google: en I-25, sin tarjeta |
| Claude (plan Pro o superior) | Claude Code; el plan gratuito no lo incluye | Antes de empezar |

### En el teléfono

- Expo Go, con sesión iniciada en la misma cuenta de Expo que la computadora.
- Teléfono y computadora en la misma red wifi. Si la red de la escuela lo bloquea, Expo ofrece un modo túnel.

### Configuración y secretos

- La dirección y la clave pública de Supabase van en un archivo de entorno que no se sube al repositorio; se incluye un archivo de ejemplo sin valores.
- La clave pública de Supabase puede ir en la app porque la seguridad la dan las reglas por fila. La clave de servicio de Supabase **nunca** se usa en la app ni se guarda en el repositorio.
- La clave de Google Maps se guarda como secreto de EAS y se restringe al paquete de la app.
- Los ID de cliente de Google no son secretos (van dentro de la app), pero igual se guardan en el archivo de entorno para no repetirlos en el código.

## 11. Estrategia de pruebas

| Tipo | Qué cubre | Quién |
|---|---|---|
| Automáticas | Dominio (recomendaciones, distancia, ritmo, filtrado, volumen, dirección del tutorial), sincronización y paso del modo sin cuenta a una cuenta | El agente las escribe y ejecuta en cada incremento |
| Tipos y lint | Todo el código | El agente, antes de cada commit |
| Manuales guiadas | Cada incremento, con la lista "Cómo probarlo" de `03-tareas.md` | El autor, en el S22 |
| De campo | Running en la calle, con un recorrido de distancia conocida | El autor |
| Regresión final | Recorrido completo de los flujos F1 a F8 de la especificación | El autor, antes de generar la APK final |

## 12. Riesgos

| ID | Riesgo | Impacto | Qué se hace |
|---|---|---|---|
| R-01 | Expo SDK 58 está en beta y puede salir como versión estable durante el proyecto; el Expo Go de la tienda solo soporta la versión más reciente | Expo Go deja de abrir el proyecto | No actualizar el SDK a mitad del proyecto. Expo CLI puede instalar en Android la versión de Expo Go que corresponde al proyecto. Desde el bloque 7 se usa la build de desarrollo y el riesgo desaparece |
| R-02 | El seguimiento en segundo plano no funciona en Expo Go y los Samsung cierran apps en segundo plano para ahorrar batería | RUN-10 no se cumple | Es P2 y está aislado en el bloque 7. La fase A (pantalla encendida) cumple todos los P1 de running |
| R-03 | Google Cloud pide una cuenta de facturación con tarjeta para emitir la clave de Maps. El autor no tiene tarjeta de crédito, pero sí de débito | Sin clave, el mapa no aparece en la APK | Plan A: registrar la tarjeta de débito (Google acepta muchas tarjetas de débito Visa o Mastercard con compras en línea habilitadas; puede hacer un cargo temporal de verificación que se devuelve). El mapa en Android (Maps SDK for Android) no tiene costo por uso, así que no habrá cobros. Hacerlo cuanto antes, no al final. Plan B: si Google rechaza la tarjeta, cambiar a MapLibre con mapas de OpenStreetMap, que no pide clave ni tarjeta, solo en la build de desarrollo. Plan C ya no es posible: en Android, Expo Go no muestra el mapa (sección 2) |
| R-04 | El plan gratuito de Supabase pausa los proyectos tras 7 días sin actividad | El inicio de sesión falla el día de la demostración | Revisar el panel de Supabase la víspera de la entrega (24 de noviembre) y reactivar si hace falta. Las pesas siguen funcionando sin conexión, y el modo sin cuenta no depende de Supabase |
| R-05 | Errores de sincronización que dupliquen o pierdan datos | Pérdida de confianza en la app | Motor simple, pruebas obligatorias (sección 5) y un bloque completo dedicado |
| R-06 | El tiempo no alcanza | Entrega incompleta | La APK final debe estar lista el 23 de noviembre. Los P2 están al final y se recortan en el orden indicado en `03-tareas.md` |
| R-07 | iOS no se prueba en dispositivo real | Fallos desconocidos en iPhone | Se declara como limitación de la versión 1. Si se consigue un iPhone prestado, Expo Go permite probar casi todo |
| R-08 | El código generado por agentes se desvía de la especificación o crece sin control | Deuda técnica, errores difíciles de rastrear | Reglas en `CLAUDE.md`, incrementos pequeños, el autor prueba cada uno antes del commit |
| R-09 | Resuelto: el maestro solo pide los mapas como extra (P-01) | — | — |
| R-10 | El plan gratuito de EAS limita el número de builds al mes | No poder generar la APK final | Hacer pocas builds y solo cuando cambie algo nativo; verificar el límite vigente antes del bloque 7. Google (I-25) se agrega en la misma build que el segundo plano (I-20) si es posible |
| R-11 | Google no funciona en la APK por una huella SHA-1 mal registrada, o Supabase no une la cuenta de Google con una cuenta de correo sin confirmar | El botón de Google falla, o el usuario termina con dos cuentas | Registrar la huella de cada llave de firma de EAS. Probar en I-25 el caso de un correo que ya tiene cuenta con contraseña; si Supabase no las une, proponer el ajuste a CUE-08 antes de seguir. Correo y contraseña siguen disponibles |
| R-12 | La licencia de las fotos no permite usarlas, o pesan demasiado | No hay fotos, o la APK crece mucho | Confirmar la licencia antes de copiar imágenes; plan B con Wikimedia Commons. Límite de 8 MB y una foto por ejercicio. EJE-05 es P2: si falla, los ejercicios muestran el ícono |

## 13. Después de la entrega: camino a las tiendas

No forma parte de la versión 1. Para publicar haría falta:

- Cuenta de desarrollador en Google Play y, para iOS, en Apple (ambas de pago).
- Con la cuenta de Apple, agregar el inicio de sesión con Apple (D-01). La App Store lo exige cuando la app ofrece inicio de sesión con Google.
- Política de privacidad pública y la declaración de uso de ubicación en segundo plano que exige Google Play.
- Eliminar cuenta desde la app (CUE-06).
- Pasar Supabase a un plan sin pausas por inactividad.
- Probar en iPhone real e íconos, capturas y textos de la ficha.

## Fuentes

- [Expo SDK 57](https://expo.dev/changelog/sdk-57)
- [Registro de cambios de Expo (SDK 58 beta)](https://expo.dev/changelog)
- [Expo Go: inicio de sesión requerido](https://expo.dev/changelog/expo-go-57-login)
- [expo-location: ubicación en segundo plano](https://docs.expo.dev/versions/latest/sdk/location/)
- [expo-task-manager: limitaciones en Expo Go](https://docs.expo.dev/versions/latest/sdk/task-manager/)
- [expo-notifications: notificaciones locales en Expo Go](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [react-native-maps en Expo y clave de Google Maps](https://docs.expo.dev/versions/latest/sdk/map-view/)
- [Límites del plan gratuito de Supabase](https://www.cloudzero.com/blog/supabase-pricing/)

Fuentes agregadas en la versión 0.3; se revisan al implementar cada incremento:

- [Supabase: inicio de sesión con Google en React Native](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase: vinculación de identidades](https://supabase.com/docs/guides/auth/auth-identity-linking)
- [@react-native-google-signin/google-signin con Expo](https://react-native-google-signin.github.io/docs/setting-up/expo)
- [free-exercise-db](https://github.com/yuhonas/free-exercise-db)
- [expo-network](https://docs.expo.dev/versions/latest/sdk/network/)

Fuentes agregadas en la versión 0.4:

- [Expo Go (SDK 57, Android): react-native-maps muestra el mapa negro](https://github.com/expo/expo/issues/49323)
- [react-native-maps: Google Maps en blanco en Expo Go](https://github.com/react-native-maps/react-native-maps/issues/5888)
- [Builds de desarrollo de Expo](https://docs.expo.dev/develop/development-builds/introduction/)

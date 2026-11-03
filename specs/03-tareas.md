# Tareas y calendario

**ezfit**, app móvil de gimnasio y running.
Versión 0.3, 2 de noviembre de 2026: modo sin cuenta, Google, fotos y videos.

El trabajo se divide en **26 incrementos** agrupados en **9 bloques**. No hay calendario de commits: el maestro no los revisa, así que se avanza lo más rápido posible y varios bloques pueden hacerse el mismo día. Los identificadores entre paréntesis (por ejemplo, SES-03) remiten a `01-especificacion.md`.

## Fechas límite

Entrega: entre el **25 y el 27 de noviembre de 2026**, con la APK instalable y el repositorio. Las fechas de abajo son límites, no un ritmo: si un bloque se termina antes, se empieza el siguiente de inmediato.

| Bloque | Tema | Incrementos | Terminar a más tardar |
|---|---|---|---|
| 0 | Preparación | Repositorio con los documentos | 4 de noviembre |
| 1 | Fundamentos, modo sin cuenta y cuenta | I-01 a I-03 | 6 de noviembre |
| 2 | Ejercicios, rutinas e incorporación | I-04 a I-06 | 8 de noviembre |
| 3 | Sesión de entrenamiento | I-07 a I-09 | 10 de noviembre |
| 4 | Running con la app abierta | I-10 a I-12 | 12 de noviembre |
| 5 | Sincronización | I-13 a I-15 | 14 de noviembre |
| 6 | Cardio, historial y copiar | I-16 a I-18 | 16 de noviembre |
| 7 | APK, Google, segundo plano, recomendaciones y fotos | I-19, I-25, I-20, I-21, I-26 | 19 de noviembre |
| 8 | Pulido y APK final | I-22 a I-24 | 23 de noviembre |

Al terminar el bloque 6 están completos todos los requisitos P1. I-25 e I-26 se agregaron en la versión 0.3; llevan esos números para no cambiar los de los demás incrementos, y se hacen en el orden en que aparecen en el bloque 7. Del 24 de noviembre a la entrega solo hay margen para imprevistos, sin funciones nuevas.

## Cómo se trabaja cada incremento

1. **Pedir:** el autor le indica a Claude Code qué bloque toca ("Implementa el bloque 3").
2. **Implementar:** Claude implementa los incrementos del bloque uno tras otro, sin esperar aprobación de un plan. Solo se detiene a preguntar si hay una duda sobre qué debe hacer la app; esa duda se resuelve en la especificación. Verifica tipos, lint y pruebas, y hace un commit por incremento (sirve de respaldo, aunque nadie los revise).
3. **Probar:** el autor sigue las listas "Cómo probarlo" del bloque en su teléfono.
4. **Corregir y cerrar:** lo que falle se corrige en ese momento. Cuando todo pasa, se marcan los incrementos como hechos en este archivo y se pasa al siguiente bloque.

### Un incremento está terminado cuando

- Cumple los criterios de aceptación de los requisitos que cubre.
- No hay errores de tipos, de lint ni pruebas fallando.
- El autor completó la lista "Cómo probarlo" en el S22 (al probar su bloque).
- Los textos nuevos están en el archivo de textos en español.
- Si cambió algún requisito, la especificación se actualizó en el mismo commit.

### Mensajes de commit

En español, con el identificador del incremento: `I-07: sesión de entrenamiento y registro de series`. No hay reglas de ritmo ni de tamaño.

---

## Bloque 0 · Preparación (a más tardar el 4 de noviembre)

Tareas del autor, sin código:

- [x] Responder las preguntas abiertas de la especificación (resueltas el 2 de noviembre).
- [x] Elegir el nombre de la app: ezfit.
- [ ] Revisar las decisiones D-01 a D-06 de la especificación (sección 8) y avisar si alguna no te convence.
- [ ] Tener un plan de Claude Pro o superior (el plan gratuito no incluye Claude Code).
- [ ] Instalar en Windows: Node.js LTS, Git, VS Code y Claude Code (ver `instalar-claude-code.md`).
- [ ] Crear cuentas en GitHub, Expo y Supabase.
- [ ] Crear la cuenta de Google Cloud y registrar la tarjeta de débito para la clave de Maps (riesgo R-03). Hacerlo ya: si Google la rechaza, hay tiempo para el plan B. La misma cuenta servirá en el bloque 7 para el inicio de sesión con Google, que no pide tarjeta.
- [ ] Instalar Expo Go en el S22 e iniciar sesión.
- [ ] Crear la carpeta del proyecto con los documentos en `specs/` y `CLAUDE.md` en la raíz, y abrir Claude Code ahí.

---

## Bloque 1 · Fundamentos, modo sin cuenta y cuenta

### I-01 · Proyecto base y navegación ✅

Crear el proyecto con Expo y TypeScript estricto, la estructura de carpetas del plan técnico, lint, pruebas, tokens de diseño, componentes base (botón, campo de texto, tarjeta, pantalla), archivo de textos y la barra inferior con las cinco secciones vacías. Completar la sección de comandos de `CLAUDE.md`.

Cubre: RNF-06, base de RNF-01.

Cómo probarlo:
- [x] La app abre en Expo Go en el S22.
- [x] Se ven las cinco secciones (Hoy, Rutinas, Correr, Historial, Perfil) y se puede navegar entre ellas.
- [x] Todos los textos están en español.

### I-02 · Base de datos local y catálogo de ejercicios ✅

Esquema completo de SQLite con todas las tablas del plan técnico (incluidos la clave de foto y el enlace de video de los ejercicios), migraciones, datos iniciales del catálogo (80 ejercicios o más), pantalla de catálogo con búsqueda y filtros, y ficha del ejercicio con el botón **Ver tutorial**. Las fotos llegan en I-26; mientras tanto se muestra el ícono del grupo muscular.

Cubre: EJE-01, EJE-02, EJE-06.

Cómo probarlo:
- [x] El catálogo muestra los ejercicios en español, con modo avión activado.
- [x] Buscar "press" y "PRESS" da los mismos resultados; buscar "biceps" encuentra "bíceps".
- [x] Los filtros por músculo y equipo funcionan combinados con la búsqueda.
- [x] Revisar la lista de ejercicios y avisar si falta alguno importante o hay nombres raros.
- [x] Abrir un ejercicio y tocar **Ver tutorial**: se abre YouTube buscando cómo hacer ese ejercicio.
- [x] En modo avión, **Ver tutorial** avisa que necesita internet y no se traba.

### I-03 · Bienvenida, modo sin cuenta y cuenta de usuario ✅

Pantalla de bienvenida y modo sin cuenta con su propia base de datos local. Proyecto de Supabase con las tablas, las reglas de seguridad por fila y el catálogo cargado. Pantallas de registro e inicio de sesión, sesión persistente, cierre de sesión y base de datos local por usuario. Aviso en Perfil para quien no tiene cuenta y paso de los datos del modo sin cuenta a la cuenta, solo en el teléfono (la subida a la nube se prueba en I-13 y la unión con una cuenta con datos en I-14).

Cubre: CUE-00, CUE-01, CUE-02, CUE-03 (sin el aviso de pendientes, que llega en I-15), CUE-07 (en el teléfono).

Cómo probarlo:
- [x] Con internet apagado, abrir la app por primera vez y tocar **Empezar sin cuenta**: entra sin pedir nada.
- [x] Cerrar y abrir la app: sigue en modo sin cuenta, sin volver a la bienvenida.
- [x] Perfil muestra el aviso "Tus datos solo están en este teléfono" y el botón para crear cuenta.
- [x] Desde ese botón, crear una cuenta con correo y contraseña: no se repite la incorporación y la app sigue igual.
- [x] Cerrar sesión: vuelve a la bienvenida. Crear una cuenta desde ahí.
- [x] Cerrar la app por completo y abrirla: sigue dentro.
- [x] Abrirla en modo avión: entra sin pedir datos.
- [x] Cerrar sesión y probar con correo o contraseña incorrectos: el error se entiende.
- [x] Crear una segunda cuenta en el mismo teléfono: no ve nada de la primera.
- [x] Cerrar sesión y tocar **Empezar sin cuenta**: la app está vacía.

---

## Bloque 2 · Ejercicios, rutinas e incorporación

### I-04 · Ejercicios personalizados ✅

Crear, editar y archivar ejercicios propios, con tipo de registro, opciones de RIR y técnica, y enlace opcional a un video. Creación rápida desde el selector de ejercicios.

Cubre: EJE-03, EJE-04, EJE-06 (enlace propio).

Cómo probarlo:
- [x] Crear un ejercicio de "solo tiempo" (por ejemplo, plancha) y otro de "peso y repeticiones" sin RIR.
- [x] Ambos aparecen en el catálogo marcados como propios.
- [x] Archivar uno: desaparece del selector.
- [x] Un ejercicio del catálogo no se puede editar.
- [x] Crear un ejercicio con el enlace de un video de YouTube: **Ver tutorial** abre ese video.
- [x] Escribir algo que no es un enlace: la app lo rechaza con un mensaje claro.

### I-05 · Rutinas predeterminadas y propias ✅

Datos iniciales de las plantillas del anexo A, pantalla de rutinas, detalle de rutina, y creación, edición, duplicado y eliminación de rutinas propias.

Cubre: RUT-01, RUT-03, RUT-04.

Cómo probarlo:
- [x] Se ven las plantillas por tiempo; las de Pierna, Push y Pull de 30, 45 y 60 minutos; y los planes semanales.
- [x] Revisar el contenido de las plantillas y avisar qué cambiarías.
- [x] Crear una rutina propia con cuatro ejercicios, cambiar el orden y editar las series objetivo.
- [x] Duplicar una plantilla y modificar la copia; la plantilla original no cambia.
- [x] Eliminar una rutina propia pide confirmación.

### I-06 · Incorporación, plan semanal y pantalla Hoy ✅

Flujo de incorporación (principiante o no, días, unidad), asignación de plan semanal y pantalla Hoy con la rutina del día. Ajuste de unidad de peso en Perfil.

Cubre: CUE-05, RUT-02, AJU-01.

Cómo probarlo:
- [x] Empezando sin cuenta, responder que eres principiante y elegir lunes, miércoles y viernes: propone el plan de 3 días.
- [x] Hoy muestra la rutina que toca; en un día sin entrenamiento muestra descanso.
- [x] Cerrar sesión (o borrar los datos de Expo Go), crear una cuenta nueva desde la bienvenida y responder que no eres principiante: llegas a Hoy con las tres opciones del flujo F2.
- [x] La incorporación no vuelve a aparecer al reabrir la app.
- [x] La unidad por defecto es lb; cambiarla a kg en Perfil.

---

## Bloque 3 · Sesión de entrenamiento

El bloque más importante para la experiencia de uso. Probar en el gimnasio real si es posible.

### I-07 · Sesión y registro de series

Iniciar una sesión desde la rutina de hoy, cualquier rutina o vacía. Agregar, quitar y reordenar ejercicios. Registrar, editar y eliminar series con valores ya llenos. Resumen de la última vez. La sesión en curso sobrevive al cierre de la app.

Cubre: SES-01, SES-02, SES-03, SES-09, SES-10.

Cómo probarlo:
- [ ] Empezar la rutina de hoy y registrar tres series de un ejercicio: desde la segunda, los campos ya vienen llenos.
- [ ] Contar los toques para registrar una serie con valores llenos: dos o menos.
- [ ] Cerrar la app a la fuerza a media sesión y abrirla: todo sigue ahí.
- [ ] Con una sesión en curso, Hoy muestra "Entrenando" en lugar de "Hoy toca"; al terminarla muestra "Hoy entrenaste" con su resumen.
- [ ] Agregar un ejercicio que no estaba en la rutina, quitar otro y cambiar el orden.
- [ ] Los ejercicios aparecen plegados con su avance; al tocar uno se abre y el que estaba abierto se cierra. Al entrar se abre el primero sin completar.
- [ ] Corregir el peso de una serie ya registrada.
- [ ] Registrar una serie en lb y la siguiente en kg con un toque en el selector: cada una se guarda y se muestra con su unidad, sin convertir.
- [ ] Probar un ejercicio de "solo tiempo": pide tiempo, no peso.

### I-08 · RIR, técnica, máquina, ánimo y cierre de sesión

Selectores de RIR y técnica por serie, campo de máquina con sugerencias, series de calentamiento, pantalla de cierre con resumen, estado de ánimo y nota, y descarte de sesión.

Cubre: SES-04, SES-05, SES-06, SES-07, SES-11, SES-12.

Cómo probarlo:
- [ ] Marcar RIR y técnica en una serie con un toque cada uno.
- [ ] En un ejercicio propio sin RIR, el selector no aparece.
- [ ] Anotar una marca de máquina; en la siguiente sesión del mismo ejercicio aparece como sugerencia.
- [ ] Marcar una serie como calentamiento: se distingue de las demás.
- [ ] Terminar una sesión con series en kg y en lb: el volumen total sale en la unidad por defecto y es correcto. El resumen es correcto, se puede elegir ánimo y escribir una nota.
- [ ] Descartar una sesión pide confirmación.

### I-09 · Temporizador de descanso

Temporizador automático y manual, ajuste de más y menos 15 segundos, saltar, aviso con sonido y vibración, notificación local con la app en segundo plano, y ajustes de descanso en Perfil.

Cubre: SES-08, AJU-02.

Cómo probarlo:
- [ ] Al confirmar una serie, el temporizador arranca solo con el tiempo de la rutina.
- [ ] Sumar 15 segundos y saltarlo funcionan.
- [ ] Bloquear el teléfono durante el descanso: llega una notificación al terminar.
- [ ] Cerrar la app a medio descanso y abrirla: el tiempo restante es correcto.
- [ ] Desactivar el inicio automático en Perfil: ya no arranca solo, pero se puede iniciar a mano.

---

## Bloque 4 · Running con la app abierta

Los mapas son obligatorios: el maestro los pide como extra y la APK entregada debe mostrarlos. Todo esto funciona en Expo Go, con la pantalla encendida, con o sin cuenta.

Tarea paralela del autor: tener la clave de Google Maps (o saber que Google rechazó la tarjeta de débito) antes de terminar este bloque.

### I-10 · Permisos, mapa y pantalla previa

Explicación y solicitud del permiso de ubicación, mapa centrado en la ubicación actual, indicador de señal GPS y selector de tipo de actividad.

Cubre: RUN-01, RUN-02.

Cómo probarlo:
- [ ] La primera vez, la app explica para qué quiere la ubicación antes de que aparezca el permiso de Android.
- [ ] El mapa muestra tu ubicación real.
- [ ] Negar el permiso (desde ajustes del teléfono): la sección explica cómo activarlo y el resto de la app funciona.
- [ ] Bajo techo, el indicador de señal marca regular o sin señal.

### I-11 · Seguimiento en vivo

Grabación de la actividad con tiempo, distancia, ritmo actual y promedio. Ruta dibujada en vivo. Pausar, reanudar y terminar. Filtrado de puntos. Guardado de puntos conforme llegan y recuperación si la app se cierra. Funcionamiento sin internet. Aviso de mantener la pantalla encendida.

Cubre: RUN-03, RUN-04, RUN-07, RUN-08, RUN-09.

Cómo probarlo (en la calle):
- [ ] Caminar o correr 1 km medido (pista o ruta conocida): la app marca entre 0.95 y 1.05 km.
- [ ] La línea sigue el camino real, sin saltos.
- [ ] Quedarse quieto 2 minutos: la distancia casi no cambia.
- [ ] Pausar, caminar 50 metros, reanudar: ese tramo no cuenta ni se une con una línea.
- [ ] Cerrar la app a media actividad y abrirla: ofrece guardar lo registrado.
- [ ] Con datos móviles y wifi apagados: la distancia y la ruta se siguen registrando.

### I-12 · Resumen, guardado e historial de actividades

Pantalla de resumen con el mapa de la ruta completa y las métricas, nombre y notas, guardar o descartar, lista de actividades y detalle.

Cubre: RUN-05, RUN-06.

Cómo probarlo:
- [ ] Al terminar, el mapa muestra toda la ruta ajustada a la pantalla.
- [ ] Distancia, tiempo, ritmo y velocidad promedio son coherentes entre sí.
- [ ] La actividad guardada aparece en Historial y su detalle coincide con el resumen.
- [ ] Eliminar una actividad pide confirmación.

---

## Bloque 5 · Sincronización

### I-13 · Subida de cambios

Motor de sincronización: marcado de pendientes, subida por tablas en orden, reintentos y disparadores automáticos. Pruebas automáticas del motor.

Cubre: SIN-01, SIN-02, SIN-05 (subida), CUE-07 (subida al crear cuenta).

Cómo probarlo:
- [ ] Registrar una sesión con conexión: los datos aparecen en el panel de Supabase.
- [ ] Registrar otra en modo avión, quitar el modo avión: sube sola en menos de un minuto.
- [ ] En el panel de Supabase no hay registros duplicados.
- [ ] Usar la app sin cuenta, registrar una sesión y una actividad, y luego crear una cuenta: las dos aparecen en el panel de Supabase.
- [ ] En modo sin cuenta no se intenta sincronizar (Perfil muestra el aviso, no un error).

### I-14 · Bajada, restauración e indicador de estado

Bajada de cambios, restauración completa al iniciar sesión en un teléfono sin datos, estado de sincronización y botón manual en Perfil. Las actividades de running se sincronizan con su ruta.

Cubre: SIN-03, SIN-04, SIN-05 (bajada), SIN-06, CUE-07 (unión con una cuenta que ya tiene datos).

Cómo probarlo:
- [ ] Borrar los datos de Expo Go (o usar otro teléfono) e iniciar sesión: aparecen rutinas, sesiones, ejercicios propios, ajustes y actividades con su mapa.
- [ ] Perfil muestra "sincronizado"; en modo avión tras un cambio muestra "pendiente".
- [ ] El botón de sincronizar funciona y no interrumpe una sesión en curso.
- [ ] Borrar los datos de Expo Go, empezar sin cuenta, registrar una sesión y luego iniciar sesión en la cuenta que ya tiene datos: se ven las sesiones de los dos lados, sin duplicados, y los ajustes son los de la cuenta.

### I-15 · Robustez sin conexión y recuperación de contraseña

Aviso al cerrar sesión con cambios pendientes, manejo de errores de red en toda la app, borrados sincronizados, prueba de aislamiento entre cuentas y recuperación de contraseña por correo.

Cubre: CUE-03 (completo), CUE-04, RNF-03, RNF-04.

Cómo probarlo:
- [ ] Entrenar una sesión completa en modo avión, de principio a fin, sin ningún error.
- [ ] Cerrar sesión con cambios pendientes: la app avisa.
- [ ] Eliminar una rutina, sincronizar, restaurar en limpio: la rutina no reaparece.
- [ ] Con dos cuentas, ninguna ve datos de la otra.
- [ ] Pedir el correo de recuperación y cambiar la contraseña.

---

## Bloque 6 · Cardio, historial y copiar

Las tablas de este bloque ya existen y ya se sincronizan; cada incremento verifica que sus datos suben y bajan.

### I-16 · Cardio en aparatos

Bloques de cardio dentro de la sesión, sesiones solo de cardio, valores llenos de la última vez y cronómetro opcional.

Cubre: CAR-01, CAR-02.

Cómo probarlo:
- [ ] Agregar a una sesión un bloque de caminadora con tiempo, nivel y velocidad.
- [ ] La siguiente vez que eliges caminadora, vienen los valores anteriores.
- [ ] Guardar una sesión que solo tiene cardio.
- [ ] Usar el cronómetro en lugar de escribir el tiempo.

### I-17 · Historial de sesiones y por ejercicio

Lista de sesiones por fecha, detalle de sesión e historial por ejercicio con filtro por máquina, accesible desde catálogo, historial y sesión en curso.

Cubre: HIS-01, HIS-02.

Cómo probarlo:
- [ ] Historial muestra las sesiones y las actividades de running por fecha.
- [ ] El detalle de una sesión muestra todo lo registrado, incluidos máquina, cardio y nota.
- [ ] El historial de un ejercicio muestra sus series de todas las fechas.
- [ ] Filtrar por una máquina deja solo las series hechas en ella.

### I-18 · Repetir sesiones y traer ejercicios

Repetir una sesión anterior, traer un ejercicio de un día anterior a la sesión en curso y guardar una sesión como rutina.

Cubre: HIS-03, HIS-04, RUT-05.

Cómo probarlo:
- [ ] "Repetir hoy" en una sesión pasada abre una sesión nueva con los mismos ejercicios y las series de ese día como referencia.
- [ ] Modificar la sesión nueva no cambia la original.
- [ ] En una sesión en curso, traer un ejercicio de otro día.
- [ ] Guardar una sesión terminada como rutina y encontrarla en Rutinas.

**Punto de control:** al cerrar este bloque, todos los requisitos P1 están completos y probados en Expo Go.

---

## Bloque 7 · APK, Google, segundo plano, recomendaciones y fotos

### I-19 · Build de desarrollo y APK

Configurar EAS Build, la clave de Google Maps, el ícono y el nombre de la app. Generar la build de desarrollo e instalarla en el S22. Verificar que todo lo anterior funciona fuera de Expo Go.

Cubre: RNF-07, supuestos S-08 y S-09.

Cómo probarlo:
- [ ] La app se instala en el S22 con su propio ícono y nombre.
- [ ] El mapa aparece en la sección Correr.
- [ ] Registrar una sesión corta y una actividad corta: todo funciona igual que en Expo Go.

Si Google rechazó la tarjeta de débito, aplicar el plan B (MapLibre con OpenStreetMap) o C del riesgo R-03 y registrarlo en la especificación. El mapa es obligatorio (S-09): la APK no se da por buena sin él.

### I-25 · Continuar con Google

Credenciales gratuitas en Google Cloud (pantalla de consentimiento, ID de cliente web y Android con la huella de la llave de EAS), proveedor de Google en Supabase, librería de inicio de sesión con Google y botón en la bienvenida y en el inicio de sesión. En Expo Go el botón no aparece. Si es posible, se incluye en la misma build que I-20 para ahorrar builds (R-10).

Cubre: CUE-08.

Tarea del autor: crear las credenciales en Google Cloud siguiendo los pasos que da Claude (no pide tarjeta).

Cómo probarlo (en la build de desarrollo):
- [ ] Tocar **Continuar con Google** en la bienvenida: aparecen tus cuentas de Google, eliges una y entras.
- [ ] Cerrar y abrir la app: sigue dentro.
- [ ] Usar la app sin cuenta, registrar algo y entrar con Google desde Perfil: los datos pasan a la cuenta.
- [ ] Con un correo que ya tiene cuenta de ezfit con contraseña, entrar con Google: se ven los datos de esa misma cuenta, no una vacía.
- [ ] En Expo Go el botón no aparece y lo demás funciona igual.

### I-20 · Running con la pantalla apagada

Seguimiento en segundo plano con notificación permanente, permiso de ubicación en segundo plano con explicación previa y pantalla de ayuda sobre la restricción de batería en Samsung. Retirar el aviso de mantener la pantalla encendida.

Cubre: RUN-10.

Cómo probarlo (en la calle):
- [ ] Iniciar una actividad, bloquear el teléfono y guardarlo en el bolsillo durante 10 minutos: la ruta y la distancia están completas.
- [ ] Mientras la actividad está activa hay una notificación permanente.
- [ ] Repetir la prueba de 1 km medido con el teléfono bloqueado: entre 0.95 y 1.05 km.

### I-21 · Recomendaciones de peso y gráfica de progreso

Reglas de recomendación en la capa de dominio con sus pruebas, sugerencia visible al iniciar un ejercicio, ajuste del incremento y gráfica del mejor peso por sesión.

Cubre: REC-01, HIS-05, AJU-03.

Cómo probarlo:
- [ ] Tras una sesión donde todas las series llegaron al máximo del rango con RIR de 1 o más, la siguiente sugiere subir peso y explica por qué.
- [ ] Tras una sesión floja, sugiere mantener o bajar.
- [ ] Un ejercicio sin historial no muestra sugerencia.
- [ ] Tocar la sugerencia llena los campos; no se aplica sola.
- [ ] El historial de un ejercicio muestra la gráfica.

### I-26 · Fotografías de los ejercicios

Confirmar la licencia de free-exercise-db, elegir una foto por ejercicio del catálogo, copiarlas a `assets/exercises/` con el archivo de fuente y licencia, y mostrarlas en el catálogo, el selector y la ficha del ejercicio.

Cubre: EJE-05.

Cómo probarlo:
- [ ] Revisar el catálogo: al menos 60 ejercicios tienen foto y cada foto corresponde a su ejercicio. Avisar cuáles no coinciden.
- [ ] En modo avión, las fotos se siguen viendo.
- [ ] Un ejercicio sin foto y uno propio muestran el ícono del grupo muscular.
- [ ] Las fotos no hacen lento el desplazamiento del catálogo.

---

## Bloque 8 · Pulido y entrega

### I-22 · Pulido de la experiencia de uso

Revisión de todas las pantallas: estados vacíos, mensajes de error, consistencia visual, tamaño de botones, contraste, tamaño de letra grande y tiempos de carga con 300 sesiones de prueba.

Cubre: RNF-01, RNF-02, RNF-08.

Cómo probarlo:
- [ ] Empezando sin cuenta, ninguna pantalla queda en blanco sin explicación.
- [ ] Con el tamaño de letra del sistema al máximo, nada se corta ni se encima.
- [ ] Entrenar una sesión completa usando solo una mano.
- [ ] Anotar todo lo que resulte incómodo y corregir lo más importante.

### I-23 · Requisitos P2 restantes

En este orden, hasta donde alcance el tiempo: parciales por kilómetro, récords personales, editar sesiones pasadas, cambiar plan y días de entrenamiento.

Cubre: RUN-11, HIS-07, HIS-06, AJU-04.

Cómo probarlo:
- [ ] Cada función terminada cumple sus criterios de la especificación.
- [ ] Lo que no se alcanzó queda anotado como pendiente en la especificación.

### I-24 · Versión de entrega

APK final, recorrido de regresión de los flujos F1 a F8, README del repositorio (qué es, cómo ejecutarla, capturas, fuente y licencia de las fotos), y entrega de la APK y del repositorio.

Cómo probarlo:
- [ ] Instalar la APK final en el S22 y recorrer los flujos F1 a F8 completos: empezar sin cuenta, entrenar, correr y al final crear la cuenta (F8).
- [ ] Verificar el 24 de noviembre que el proyecto de Supabase está activo (riesgo R-04).
- [ ] El repositorio tiene README y no contiene claves.

---

## Si falta tiempo

Se recorta en este orden, de lo primero a lo último:

1. I-23 completo (P2 restantes).
2. La gráfica de I-21 (HIS-05).
3. Las recomendaciones de I-21 (REC-01).
4. I-26 (fotos): los ejercicios muestran el ícono del grupo muscular. El botón de tutorial sigue.
5. I-25 (Google): queda solo correo y contraseña.
6. I-20 (segundo plano): la app se entrega con el aviso de pantalla encendida.
7. El cronómetro de cardio (CAR-02) y las series de calentamiento (SES-12).

Nunca se recorta: I-22 (pulido), I-24 (entrega), ni ningún requisito P1.

Si un bloque pasa de su fecha límite, el siguiente empieza por terminarlo. Si el 19 de noviembre no está lista la build de desarrollo (I-19), se aplica el orden de recorte para tener la APK final el 23.

## Trazabilidad

| Módulo | Requisitos | Incrementos |
|---|---|---|
| Cuenta | CUE-00 a CUE-05, CUE-07, CUE-08 | I-03, I-06, I-13, I-14, I-15, I-25 |
| Ejercicios | EJE-01 a EJE-06 | I-02, I-04, I-26 |
| Rutinas | RUT-01 a RUT-05 | I-05, I-06, I-18 |
| Sesión | SES-01 a SES-12 | I-07, I-08, I-09 |
| Cardio | CAR-01, CAR-02 | I-16 |
| Historial | HIS-01 a HIS-07 | I-17, I-18, I-21, I-23 |
| Recomendaciones | REC-01 | I-21 |
| Running | RUN-01 a RUN-11 | I-10, I-11, I-12, I-20, I-23 |
| Sincronización | SIN-01 a SIN-06 | I-13, I-14, I-15 |
| Ajustes | AJU-01 a AJU-04 | I-06, I-09, I-21, I-23 |
| No funcionales | RNF-01 a RNF-08 | I-01, I-15, I-19, I-22, I-24 |

Los requisitos P3 (CUE-06, RUN-12, AJU-05) no tienen incremento asignado.

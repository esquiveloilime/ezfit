# Especificación funcional

**ezfit**, app móvil de gimnasio y running.

| | |
|---|---|
| Nombre | **ezfit** |
| Versión | 0.3, con las respuestas del autor sobre los supuestos |
| Fecha | 2 de noviembre de 2026 |
| Entrega | Entre el 25 y el 27 de noviembre de 2026: APK instalable y repositorio |
| Documentos relacionados | `00-constitucion.md`, `02-plan-tecnico.md`, `03-tareas.md` |

Este documento describe **qué** hace la app y **cómo se comprueba** que lo hace. No describe cómo se construye; eso está en el plan técnico.

## 1. Resumen

Una app móvil para personas que van al gimnasio y salen a correr, o que apenas quieren empezar. Tiene dos partes:

- **Pesas y cardio:** registrar la rutina del día (ejercicios, series, peso, repeticiones, RIR, técnica, máquina usada, cardio en aparatos, estado de ánimo), seguir rutinas predeterminadas o propias, y ver el progreso de cada ejercicio.
- **Running:** grabar una carrera o caminata con GPS, ver la ruta dibujada en un mapa y obtener distancia, tiempo y ritmo, al estilo de Strava. Los mapas los pide el maestro como extra, pero en este proyecto son obligatorios.

La cuenta es opcional: la app se puede usar desde el primer momento sin crear cuenta ni tener internet, y la cuenta se crea después para respaldar los datos en la nube y usarlos en otro teléfono.

El resultado esperado es una app sencilla, rápida de usar durante el entrenamiento y con buena experiencia de uso.

## 2. Usuarios

| Usuario | Qué necesita |
|---|---|
| **Principiante** | Que la app le diga qué hacer: un plan semanal según los días que puede entrenar, con ejercicios, series y repeticiones ya definidos. |
| **Con experiencia** | Armar sus propias rutinas, registrar rápido, anotar detalles (RIR, técnica, máquina) y ver su progreso. |
| **Corredor ocasional** | Grabar su recorrido y ver cuánto corrió, en cuánto tiempo y a qué ritmo. |

Una misma persona puede ser los tres.

## 3. Glosario

| Término | Significado |
|---|---|
| **Ejercicio** | Un movimiento del catálogo o creado por el usuario (press de banca, sentadilla). |
| **Rutina** | Lista ordenada de ejercicios con series y repeticiones objetivo. Es un plan, no un registro. |
| **Plantilla** | Rutina predeterminada que viene con la app. No se puede modificar, pero sí copiar. |
| **Plan semanal** | Conjunto de rutinas repartidas en los días de la semana. |
| **Sesión** | Lo que el usuario hizo en una visita al gimnasio. Es el registro real. |
| **Serie** | Una ejecución de un ejercicio dentro de una sesión, con sus datos (peso, repeticiones, etc.). |
| **Serie efectiva** | Serie de trabajo real, en contraste con una serie de calentamiento. |
| **RIR** | Repeticiones en reserva: cuántas repeticiones más podría haber hecho el usuario al terminar la serie. |
| **Técnica** | Calificación de 1 a 5 que el usuario da a la calidad de su serie. |
| **Actividad** | Una carrera o caminata al aire libre grabada con GPS. |
| **Modo sin cuenta** | Uso de la app sin haber creado cuenta. Los datos solo se guardan en el teléfono. |
| **Ritmo** | Minutos por kilómetro (min/km). |

## 4. Alcance

### Incluido en la versión 1

- Uso sin cuenta desde el primer momento, con la opción de crear cuenta después sin perder datos.
- Cuenta de usuario con correo y contraseña, o con Google.
- Catálogo de ejercicios con fotografía y enlace a un video tutorial, y ejercicios personalizados.
- Rutinas predeterminadas (por tiempo; Pierna, Push y Pull; plan semanal) y rutinas propias.
- Registro de sesión de pesas y cardio con todos los datos descritos en la sección 6.
- Temporizador de descanso manual y automático.
- Historial por sesión y por ejercicio; copiar sesiones y ejercicios de días anteriores.
- Recomendaciones para subir de peso.
- Running al aire libre: grabación con GPS, ruta en mapa (obligatoria), métricas, historial.
- Uso sin conexión del apartado de pesas y sincronización con la nube para quien tenga cuenta.

### Fuera de alcance en la versión 1

- Funciones sociales: seguir a otros usuarios, feed, comentarios, retos, segmentos.
- Relojes, pulseras, sensores de frecuencia cardiaca.
- Animaciones de los ejercicios y videos reproducidos dentro de la app (los tutoriales se abren en YouTube).
- Fotografías en ejercicios personalizados (solo pueden llevar enlace a video).
- Running en caminadora con GPS: correr en caminadora se registra como cardio (CAR-01).
- Nutrición, peso corporal, medidas.
- Inicio de sesión con Apple: exige la cuenta de desarrollador de Apple, que es de pago (ver D-01).
- Notificaciones push enviadas desde un servidor.
- Otros idiomas además del español.
- Publicación en Google Play o App Store (se deja preparado el camino, ver plan técnico).
- Versión web.

### Prioridades

Cada requisito tiene una prioridad:

- **P1:** imprescindible para la entrega.
- **P2:** planeado para la entrega; es lo primero que se recorta si falta tiempo.
- **P3:** después de la entrega.

## 5. Flujos principales

Estos flujos describen el uso de principio a fin. Los requisitos de la sección 6 detallan cada paso.

### F1. Primer uso de un principiante

1. Abre la app. La primera pantalla ofrece **Empezar sin cuenta**, **Crear cuenta**, **Iniciar sesión** y **Continuar con Google**. Elige empezar sin cuenta (o cualquiera de las otras).
2. La app pregunta si es principiante. Responde que sí.
3. La app pregunta qué días puede ir al gimnasio. Puede elegir días concretos de la semana o solo una cantidad.
4. La app pregunta en qué unidad prefiere ver el peso (lb viene seleccionada, porque las máquinas del gimnasio marcan libras). Esta es solo la unidad por defecto: cada serie se puede registrar en kg o en lb.
5. La app propone un plan semanal acorde a esos días y muestra qué rutina toca cada día.
6. Acepta el plan. Llega a la pantalla **Hoy**, que muestra la rutina del día y un botón para empezar.

### F2. Primer uso de alguien con experiencia

1. Empieza sin cuenta o con cuenta, y responde que no es principiante.
2. Elige unidad de peso.
3. Llega a **Hoy** sin plan asignado, con tres opciones: empezar una sesión vacía y elegir ejercicios, crear una rutina propia, o explorar las rutinas predeterminadas.

### F3. Entrenar (el flujo que más se repite)

1. En **Hoy** toca "Empezar". La sesión se abre con los ejercicios de la rutina.
2. En el primer ejercicio ve qué hizo la última vez y, si aplica, la recomendación de peso. Si no sabe cómo se hace, abre la ficha del ejercicio y ve la foto o el video tutorial.
3. Anota en qué máquina lo hace si es distinta a la habitual.
4. Hace la serie. Los campos ya traen los valores de la vez anterior; los ajusta si cambiaron y confirma. Opcionalmente marca RIR y técnica.
5. Al confirmar, arranca solo el temporizador de descanso. Cuando termina, el teléfono avisa.
6. Repite con las demás series y ejercicios. Puede agregar, quitar o cambiar de orden los ejercicios.
7. Si hace cardio, agrega un bloque de cardio con aparato, tiempo, nivel y velocidad.
8. Toca "Terminar". Ve un resumen, elige su estado de ánimo, opcionalmente escribe una nota y guarda.

### F4. Repetir un día anterior

1. En **Historial** abre una sesión pasada.
2. Toca "Repetir hoy". Se abre una sesión nueva con los mismos ejercicios y, como referencia, las series que hizo ese día.
3. Modifica lo que quiera (agrega o quita ejercicios) y entrena como en F3.

También puede, desde una sesión en curso, traer un solo ejercicio de un día anterior.

### F5. Salir a correr

1. Entra a **Correr**. La primera vez, la app explica para qué necesita la ubicación y pide el permiso.
2. Ve el mapa centrado en donde está y un indicador de la señal GPS. Elige correr o caminar.
3. Toca "Iniciar". Ve tiempo, distancia y ritmo actualizándose, y su ruta dibujándose en el mapa.
4. Puede pausar y reanudar.
5. Toca "Terminar". Ve el resumen con el mapa completo de la ruta, distancia, tiempo y ritmo promedio. Le pone nombre si quiere y guarda.
6. La actividad queda en su historial de actividades.

### F6. Revisar el progreso

1. En **Historial** ve sus sesiones por fecha y sus actividades de running.
2. Abre un ejercicio y ve todas las series que ha hecho a lo largo del tiempo, con una gráfica de su evolución.

### F7. Sin conexión

1. El gimnasio no tiene señal. El usuario entrena igual que en F3; todo se guarda en el teléfono.
2. Si tiene cuenta, un indicador muestra que hay cambios pendientes de subir.
3. Cuando el teléfono recupera la conexión, la app sube los cambios sola.

### F8. Crear cuenta después de usar la app sin cuenta

1. El usuario lleva días usando la app sin cuenta. En **Perfil** ve el aviso "Tus datos solo están en este teléfono" y el botón para crear cuenta.
2. Crea una cuenta con correo y contraseña, o entra con Google.
3. Todo lo que registró sin cuenta (sesiones, rutinas, ejercicios propios, actividades, ajustes) pasa a su cuenta y se sube a la nube. No pierde nada.

### Navegación

Cinco secciones principales, siempre visibles en una barra inferior:

| Sección | Contenido |
|---|---|
| **Hoy** | Rutina del día, sesión en curso, accesos rápidos. |
| **Rutinas** | Rutinas propias, rutinas predeterminadas, catálogo de ejercicios. |
| **Correr** | Grabar una actividad. |
| **Historial** | Sesiones, actividades y progreso por ejercicio. |
| **Perfil** | Ajustes, plan semanal, cuenta (o botón para crearla), estado de sincronización. |

## 6. Requisitos funcionales

### 6.1 Cuenta e incorporación (CUE)

**CUE-00 · P1 · Pantalla de bienvenida**
- La primera vez que se abre la app se muestran las opciones **Empezar sin cuenta**, **Crear cuenta**, **Iniciar sesión** y **Continuar con Google** (esta última solo cuando CUE-08 esté implementado).
- Empezar sin cuenta lleva directo a la incorporación (CUE-05) y no necesita internet.
- La bienvenida no vuelve a aparecer mientras el usuario esté usando la app, con o sin cuenta.

**CUE-07 · P1 · Modo sin cuenta**
- Sin cuenta funciona todo lo de las secciones 6.2 a 6.8 y 6.10: pesas, cardio, rutinas, historial, recomendaciones y running. Los datos se guardan solo en el teléfono y no se sincronizan.
- En **Perfil** se muestra "Tus datos solo están en este teléfono; si desinstalas la app o cambias de teléfono los perderás", con el botón para crear cuenta o iniciar sesión. La app no interrumpe al usuario con otros avisos para que cree cuenta.
- Al crear una cuenta o iniciar sesión desde el modo sin cuenta, todos los datos del teléfono pasan a esa cuenta y se sincronizan:
  - Si la cuenta es nueva, se sube todo tal cual, incluidos los ajustes y la incorporación.
  - Si la cuenta ya tenía datos (por ejemplo, de otro teléfono), se juntan: las sesiones, rutinas, ejercicios propios y actividades de ambos lados se conservan. Los ajustes y el plan activo que se quedan son los de la cuenta, y la incorporación no se repite.
- No se puede volver a modo sin cuenta con los datos de una cuenta. Después de cerrar sesión (CUE-03), "Empezar sin cuenta" arranca con la app vacía.

**CUE-01 · P1 · Registro**
El usuario crea una cuenta con correo y contraseña.
- Se valida el formato del correo y que la contraseña tenga al menos 8 caracteres.
- El campo de contraseña tiene un botón con ícono de ojo para mostrar u ocultar lo escrito; empieza oculto.
- Los errores (correo ya registrado, sin conexión, contraseña débil) se muestran en español y dicen qué hacer.
- Al registrarse con éxito pasa a la incorporación (CUE-05), salvo que venga del modo sin cuenta y ya la haya hecho (CUE-07).
- Registrarse necesita internet.

**CUE-02 · P1 · Inicio de sesión persistente**
- El usuario inicia sesión con correo y contraseña.
- Al cerrar y volver a abrir la app sigue dentro, sin volver a escribir sus datos.
- Después del primer inicio de sesión, la app abre y funciona sin conexión.

**CUE-03 · P1 · Cerrar sesión**
- Si hay cambios sin sincronizar, la app avisa y pide confirmación antes de cerrar sesión.
- Si otra persona inicia sesión en el mismo teléfono, no ve ningún dato del usuario anterior.
- Al cerrar sesión la app vuelve a la pantalla de bienvenida (CUE-00).

**CUE-04 · P2 · Recuperar contraseña**
- Desde la pantalla de inicio de sesión se puede pedir un correo para restablecer la contraseña.

**CUE-05 · P1 · Incorporación**
- Pregunta si el usuario es principiante.
- Si lo es: pregunta sus días de entrenamiento (días concretos de la semana, o una cantidad entre 2 y 6) y propone un plan semanal acorde (RUT-02). El usuario puede aceptarlo, elegir otro o saltarse el paso.
- Si eligió días concretos y acepta un plan con otra cantidad de días (por ejemplo, el de 3 días en lugar del de 6), la app le pide ajustar sus días a la cantidad del plan, para que cada día de entrenamiento tenga su rutina.
- Si no lo es: no asigna plan; lleva a **Hoy** con las opciones de F2.
- En ambos casos pregunta la unidad de peso por defecto (kg o lb, con lb preseleccionada).
- La incorporación se muestra una sola vez por cuenta, o una sola vez en el teléfono en modo sin cuenta. Todo lo elegido se puede cambiar después en **Perfil**.

**CUE-06 · P3 · Eliminar cuenta**
- El usuario puede borrar su cuenta y todos sus datos. Es obligatorio para publicar en tiendas.

**CUE-08 · P2 · Continuar con Google**
- En la bienvenida y en la pantalla de inicio de sesión hay un botón **Continuar con Google**. Con un toque se elige la cuenta de Google y se entra; si es la primera vez, se crea la cuenta de ezfit.
- Si el correo de Google ya tenía una cuenta de ezfit con contraseña, entra a esa misma cuenta, no a una nueva.
- Desde el modo sin cuenta funciona igual que crear cuenta (CUE-07).
- Se verifica en la build de desarrollo y en la APK; no funciona dentro de Expo Go (D-02).

### 6.2 Ejercicios (EJE)

**EJE-01 · P1 · Catálogo incluido**
- La app trae al menos 80 ejercicios en español, disponibles sin conexión.
- Cada ejercicio tiene: nombre, grupo muscular principal, grupos secundarios, tipo de equipo (barra, mancuernas, máquina, polea, peso corporal, otro), tipo de registro (EJE-03) y, cuando exista, una fotografía (EJE-05) y un enlace a un video tutorial (EJE-06).
- Todos los grupos musculares (pecho, espalda, hombro, bíceps, tríceps, cuádriceps, femoral, glúteo, pantorrilla, abdomen) tienen al menos 5 ejercicios.

**EJE-02 · P1 · Buscar y filtrar**
- Búsqueda por nombre o por grupo muscular principal, que ignora mayúsculas y acentos. Por ejemplo, "bice" muestra los ejercicios de bíceps aunque su nombre no diga "bíceps" (como "Curl martillo").
- Filtros por grupo muscular y por tipo de equipo, combinables con la búsqueda.

**EJE-03 · P1 · Ejercicio personalizado**
Si un ejercicio no está en el catálogo, el usuario lo crea.
- Campos: nombre (obligatorio), grupo muscular, tipo de equipo, notas y enlace a un video tutorial (opcional; la app solo comprueba que sea una dirección web).
- Elige el tipo de registro: peso y repeticiones, solo repeticiones, solo tiempo, peso y tiempo, o distancia y tiempo.
- Elige si quiere anotar RIR y técnica en ese ejercicio.
- El ejercicio aparece en el catálogo junto a los incluidos, marcado como propio, y se puede crear desde el selector de ejercicios sin salir de la sesión.

**EJE-04 · P2 · Editar y archivar ejercicios propios**
- Un ejercicio propio se puede editar o archivar. Archivado ya no aparece al elegir ejercicios, pero su historial se conserva.
- Los ejercicios del catálogo no se pueden editar ni borrar.

**EJE-05 · P2 · Fotografía del ejercicio**
- Los ejercicios del catálogo muestran una fotografía de cómo se ejecutan, en el catálogo, en el selector de ejercicios y en la ficha del ejercicio dentro de la sesión.
- Las fotografías vienen dentro de la app, así que se ven sin conexión.
- Solo se usan fotografías con licencia libre que permita incluirlas en la app y en el repositorio; la fuente y la licencia se anotan en el repositorio.
- Al menos 60 de los 80 ejercicios incluidos tienen fotografía. Los que no la tienen, y los ejercicios propios, muestran un ícono del grupo muscular.

**EJE-06 · P1 · Video tutorial**
- Cada ejercicio tiene un botón **Ver tutorial** que abre el video en YouTube (o en el navegador si YouTube no está instalado).
- Si el ejercicio tiene un enlace a un video concreto, se abre ese enlace. Si no lo tiene, se abre una búsqueda en YouTube con el texto "cómo hacer" más el nombre del ejercicio.
- Los ejercicios del catálogo traen enlace concreto solo en los que el autor haya revisado; los demás usan la búsqueda.
- Necesita internet. Sin conexión, el botón avisa que el video necesita internet en lugar de fallar.
- El botón está a la mano durante la sesión de entrenamiento, pero no ocupa el lugar de los controles para registrar series.

### 6.3 Rutinas (RUT)

**RUT-01 · P1 · Rutinas predeterminadas**
La app incluye plantillas en tres categorías:
- **Por tiempo:** 30, 45 y 60 minutos.
- **Pierna, Push y Pull:** una rutina de pierna, una de empuje (pecho, hombro y tríceps) y una de jalón (espalda y bíceps), cada una en versiones de 30, 45 y 60 minutos.
- **Plan semanal:** de 2, 3, 4, 5 y 6 días (ver anexo A).

Cada plantilla muestra sus ejercicios con series y rango de repeticiones, y se puede empezar una sesión directamente desde ella.

**RUT-02 · P1 · Plan semanal activo**
- El usuario puede tener un plan semanal activo, con una rutina asignada a cada día de entrenamiento.
- **Hoy** muestra la rutina que corresponde al día actual, o un mensaje de descanso si no toca entrenar.
- Si eligió una cantidad de días sin días concretos, **Hoy** muestra la siguiente rutina del plan en orden.
- Si hay una sesión en curso, **Hoy** muestra "Entrenando" con esa sesión y el botón para continuarla, en lugar de la rutina que toca.
- Si ya terminó una sesión ese día, **Hoy** muestra "Hoy entrenaste" con un resumen corto (duración, series y volumen) y la opción de empezar otra sesión. La siguiente rutina del plan aparece hasta el día siguiente.

**RUT-03 · P1 · Crear rutina propia**
- Campos: nombre, lista ordenada de ejercicios y, por ejercicio, series objetivo, rango de repeticiones y tiempo de descanso (opcionales).
- Los ejercicios se eligen del catálogo con EJE-02, o se crean al momento con EJE-03.

**RUT-04 · P1 · Editar, duplicar y eliminar rutinas**
- Las rutinas propias se pueden editar, duplicar y eliminar (con confirmación).
- Las plantillas se pueden duplicar para obtener una copia editable.
- Eliminar o editar una rutina no altera las sesiones ya registradas.

**RUT-05 · P2 · Guardar una sesión como rutina**
- Desde una sesión terminada se puede crear una rutina con los mismos ejercicios y número de series.

### 6.4 Sesión de entrenamiento (SES)

**SES-01 · P1 · Iniciar sesión de entrenamiento**
- Se puede empezar desde: la rutina de hoy, cualquier rutina o plantilla, una sesión vacía, o una sesión anterior (HIS-03).
- Solo hay una sesión en curso a la vez. Si ya hay una, la app ofrece continuarla.

**SES-02 · P1 · Gestionar ejercicios durante la sesión**
- Agregar, quitar y reordenar ejercicios en cualquier momento.
- Quitar un ejercicio con series registradas pide confirmación.
- Los ejercicios se muestran plegados: solo el nombre y el avance (por ejemplo, "2 de 4 series", con una marca cuando se completan las series objetivo). Al tocar uno se abre con sus series y los campos para registrar; solo hay uno abierto a la vez. Al entrar a la sesión se abre el primer ejercicio sin completar, y al agregar un ejercicio se abre ese.

**SES-03 · P1 · Registrar una serie**
- Los campos dependen del tipo de registro del ejercicio (peso y repeticiones, solo tiempo, etc.).
- Los campos vienen llenos con los valores de la serie equivalente de la última sesión; si no hay, con los de la serie anterior de hoy; si tampoco, vacíos.
- Con los valores ya llenos, registrar la serie toma como máximo dos toques.
- El peso admite decimales y se captura con teclado numérico y botones de más y menos.
- Junto al peso hay un selector kg / lb. El usuario puede cambiar la unidad de cualquier serie con un toque, sin conversión: se guarda tal como la escribió. Una serie nueva toma la unidad de la serie equivalente anterior de ese ejercicio; si no hay, la unidad por defecto del usuario.
- Cada ejercicio muestra un resumen de la última vez que se hizo, con la unidad de cada serie (por ejemplo, "135 lb × 10, 10, 8").
- Se pueden agregar más series que las del objetivo de la rutina, o hacer menos.

**SES-04 · P1 · RIR por serie**
- Selector de 0 a 5 o más, opcional. Se marca con un toque.
- Solo aparece en ejercicios que tienen RIR activado.

**SES-05 · P1 · Técnica por serie**
- Calificación de 1 a 5, opcional. Se marca con un toque.
- Solo aparece en ejercicios que tienen técnica activada.

**SES-06 · P1 · Máquina usada**
- En cada ejercicio de la sesión hay un campo de texto libre para anotar la máquina o marca usada.
- Al escribir, sugiere las máquinas que el usuario ya anotó antes para ese ejercicio.
- Por defecto viene la última máquina usada en ese ejercicio.

**SES-07 · P1 · Estado de ánimo**
- A cada sesión se le asigna un estado de ánimo en una escala de 1 a 5. Se pregunta al terminar y se puede cambiar después.
- Es opcional.

**SES-08 · P1 · Temporizador de descanso**
- **Automático:** arranca al confirmar una serie, con el descanso definido para ese ejercicio en la rutina o, si no hay, con el valor por defecto del usuario (AJU-02).
- **Manual:** se puede iniciar en cualquier momento con una duración elegida.
- Mientras corre se puede sumar o restar 15 segundos, o saltarlo.
- Al terminar avisa con sonido y vibración. Si la app está en segundo plano o la pantalla apagada, avisa con una notificación.
- El inicio automático se puede desactivar en ajustes.

**SES-09 · P1 · Editar y eliminar series**
- Cualquier serie de la sesión en curso se puede corregir o eliminar.

**SES-10 · P1 · La sesión en curso no se pierde**
- Si la app se cierra, se bloquea el teléfono o el sistema la mata, al volver la sesión sigue exactamente donde quedó, incluido el temporizador de descanso.

**SES-11 · P1 · Terminar o descartar**
- Al terminar se muestra un resumen: duración, ejercicios, series y volumen total.
- Se puede agregar una nota a la sesión.
- Descartar una sesión pide confirmación.
- Una sesión sin ninguna serie ni cardio registrado no se guarda.

**SES-12 · P2 · Series de calentamiento**
- Una serie se puede marcar como calentamiento. Se distingue visualmente y no cuenta para recomendaciones ni récords.

### 6.5 Cardio en aparatos (CAR)

**CAR-01 · P1 · Registrar cardio**
- A una sesión se le agregan uno o más bloques de cardio. Una sesión puede ser solo de cardio.
- Campos: aparato (caminadora, elíptica, bicicleta fija, escaladora, remo, otro), duración, nivel y velocidad. Opcionales: distancia, inclinación, notas.
- Los campos vienen llenos con los valores de la última vez que se usó ese aparato.

**CAR-02 · P2 · Cronómetro de cardio**
- La duración se puede tomar con un cronómetro dentro de la sesión en lugar de escribirla.

### 6.6 Historial y progreso (HIS)

**HIS-01 · P1 · Historial de sesiones**
- Lista de sesiones ordenada por fecha, con rutina, duración y estado de ánimo.
- Al abrir una sesión se ve todo lo registrado: ejercicios, series, máquina, cardio, nota.

**HIS-02 · P1 · Historial por ejercicio**
- Cada ejercicio tiene una vista con todas sus series a lo largo del tiempo, agrupadas por fecha.
- Se puede filtrar por máquina usada.
- Se accede desde el catálogo, desde el historial y desde la sesión en curso.

**HIS-03 · P1 · Repetir una sesión anterior**
- Desde una sesión pasada se crea una sesión nueva con los mismos ejercicios, en el mismo orden, con las series de ese día como valores de referencia.
- La sesión nueva es independiente: modificarla no cambia la original.

**HIS-04 · P1 · Traer un ejercicio de un día anterior**
- En una sesión en curso se puede agregar un ejercicio eligiéndolo de una sesión pasada, con sus series de ese día como referencia.

**HIS-05 · P2 · Gráfica de progreso**
- En el historial de un ejercicio de peso y repeticiones, una gráfica muestra la evolución del mejor peso por sesión, convertido a la unidad por defecto del usuario para que los puntos sean comparables (1 kg = 2.20462 lb).

**HIS-06 · P2 · Editar una sesión pasada**
- Se pueden corregir series, máquina, ánimo y notas de una sesión terminada, o eliminarla con confirmación.

**HIS-07 · P2 · Récords personales**
- El historial de un ejercicio muestra el mayor peso levantado y la fecha. Al superarlo durante una sesión, la app lo indica. Para comparar series registradas en unidades distintas se convierten internamente; el récord se muestra en la unidad en que se registró.

### 6.7 Recomendaciones de peso (REC)

**REC-01 · P2 · Sugerencia al iniciar un ejercicio**
Aplica solo a ejercicios de peso y repeticiones. Usa las series efectivas de la última sesión terminada de ese ejercicio (en la misma máquina, si se anotó) y el rango de repeticiones de la rutina (si no hay rutina, 8 a 12).

| Situación en la última sesión | Sugerencia |
|---|---|
| Todas las series llegaron al máximo del rango, con RIR de 1 o más y técnica promedio de 4 o más (cuando se registraron) | Subir el peso un incremento |
| La mayoría de las series quedó por debajo del mínimo del rango, o la técnica promedio fue de 2 o menos | Bajar el peso un incremento |
| Cualquier otro caso | Mantener el peso e intentar una repetición más |
| No hay sesiones anteriores del ejercicio | No se muestra sugerencia |

- La sugerencia se da en la unidad en que se registraron las series de la última sesión. El incremento por defecto es 2.5 kg o 5 lb, según esa unidad, y se puede cambiar (AJU-03).
- La sugerencia explica en una línea por qué se hace.
- Es solo una sugerencia: se aplica a los campos con un toque y nunca cambia valores por su cuenta.

### 6.8 Running (RUN)

Running es solo al aire libre, con GPS. Las distancias se muestran siempre en kilómetros y los ritmos en minutos por kilómetro. El mapa es obligatorio: debe verse en la APK entregada.

**RUN-01 · P1 · Permiso de ubicación**
- Antes de pedir el permiso del sistema, la app explica para qué lo usa.
- Si el usuario lo niega, la sección explica cómo activarlo desde los ajustes del teléfono y el resto de la app sigue funcionando.

**RUN-02 · P1 · Pantalla previa**
- Mapa centrado en la ubicación actual.
- Indicador de calidad de la señal GPS (buena, regular, sin señal).
- Selector de tipo de actividad: correr o caminar.
- Botón de iniciar, deshabilitado mientras no haya señal.

**RUN-03 · P1 · Seguimiento en vivo**
- Durante la actividad se muestran: tiempo en movimiento, distancia (km), ritmo actual y ritmo promedio (min/km).
- La ruta se dibuja en el mapa conforme avanza el usuario y el mapa lo sigue.
- La pantalla no se apaga sola mientras la actividad está activa.

**RUN-04 · P1 · Pausar, reanudar y terminar**
- En pausa no se suma tiempo ni distancia.
- Al reanudar, el tramo recorrido durante la pausa no se une con una línea a la ruta.
- Terminar pide confirmación para evitar toques accidentales.

**RUN-05 · P1 · Resumen y guardado**
- Al terminar se muestra: mapa con la ruta completa ajustada a la pantalla, distancia, tiempo en movimiento, ritmo promedio y velocidad promedio (km/h).
- El usuario puede poner nombre y notas, guardar o descartar (con confirmación).
- Por defecto el nombre se genera con el tipo y el momento del día ("Carrera de la mañana").

**RUN-06 · P1 · Historial de actividades**
- Lista de actividades con fecha, distancia, tiempo y ritmo.
- Al abrir una se ve el mismo detalle que en el resumen. Se puede eliminar con confirmación.

**RUN-07 · P1 · Precisión de las mediciones**
- En un recorrido de distancia conocida de 1 km, la distancia medida queda entre 0.95 y 1.05 km.
- Con el teléfono quieto durante 2 minutos al aire libre, la distancia no aumenta más de 20 metros.
- La ruta dibujada no muestra saltos evidentes fuera del camino recorrido.

**RUN-08 · P1 · La actividad en curso no se pierde**
- Los puntos se guardan en el teléfono conforme se registran.
- Si la app se cierra durante una actividad, al volver a abrirla ofrece guardar lo registrado o descartarlo.

**RUN-09 · P1 · Funciona sin internet**
- La ruta, la distancia y el tiempo se registran aunque no haya conexión. Si el mapa no puede cargar sus imágenes, la ruta se dibuja de todos modos y se avisa que el mapa aparecerá al recuperar la conexión.

**RUN-10 · P2 · Seguimiento con la pantalla apagada**
- La actividad sigue registrándose con la pantalla apagada o con otra app abierta.
- En Android se muestra una notificación permanente mientras la actividad está activa.
- Mientras este requisito no esté implementado, la app avisa al iniciar que la pantalla debe permanecer encendida.

**RUN-11 · P2 · Parciales por kilómetro**
- El detalle de la actividad muestra el tiempo y el ritmo de cada kilómetro.

**RUN-12 · P3 · Extras**
- Pausa automática al detenerse, elevación, exportar la ruta, compartir una imagen del recorrido.

### 6.9 Sin conexión y sincronización (SIN)

**SIN-01 · P1 · Pesas sin conexión**
- Todo lo de las secciones 6.2 a 6.7 funciona igual en modo avión, con o sin cuenta. En modo sin cuenta no hace falta internet ni la primera vez; con cuenta, solo el primer inicio de sesión lo necesita.

**SIN-02 · P1 · Sincronización automática**
- Solo aplica con cuenta. En modo sin cuenta no se sincroniza nada (CUE-07).
- Los cambios se suben solos cuando hay conexión: al abrir la app, al terminar una sesión o actividad, y al recuperar la conexión.
- La sincronización no bloquea ni interrumpe lo que el usuario está haciendo.

**SIN-03 · P1 · Estado visible**
- Con cuenta, en **Perfil** se ve el estado: sincronizado, con cambios pendientes, o con error. Hay un botón para sincronizar manualmente.
- Sin cuenta, en su lugar se ve el aviso de CUE-07.

**SIN-04 · P1 · Recuperar datos en otro teléfono**
- Al iniciar sesión en un teléfono nuevo, la app descarga rutinas, sesiones, ejercicios propios, actividades y ajustes del usuario.

**SIN-05 · P1 · Sin duplicados ni pérdidas**
- Reintentar una sincronización interrumpida no crea registros duplicados.
- Si el mismo registro cambió en dos teléfonos, se conserva la modificación más reciente.

**SIN-06 · P1 · Las actividades de running también se sincronizan**
- Incluida la ruta, de modo que el mapa se puede ver en otro teléfono.

### 6.10 Ajustes (AJU)

**AJU-01 · P1 · Unidad de peso**
- La unidad por defecto es lb y se puede cambiar a kg en **Perfil**.
- La unidad por defecto solo decide con qué unidad empieza una serie sin antecedentes y en qué unidad se muestran totales y gráficas. Cada serie conserva la unidad que el usuario eligió al registrarla (SES-03) y se muestra con ella.
- El volumen total de una sesión (SES-11) se calcula convirtiendo cada serie a la unidad por defecto.

**AJU-02 · P1 · Descanso**
- Tiempo de descanso por defecto (90 segundos de inicio), inicio automático sí o no, sonido sí o no, vibración sí o no.

**AJU-03 · P2 · Incremento de peso**
- Incremento usado por las recomendaciones.

**AJU-04 · P2 · Plan y días de entrenamiento**
- Cambiar de plan semanal y de días de entrenamiento después de la incorporación.

**AJU-05 · P3 · Tema oscuro**

## 7. Requisitos no funcionales

**RNF-01 · Facilidad de uso**
- Registrar una serie con valores ya llenos toma dos toques o menos.
- Los botones del flujo de entrenamiento se pueden tocar con el pulgar usando una sola mano y miden al menos 48 puntos.
- Ninguna pantalla queda en blanco: las listas vacías explican qué hacer y los errores dicen cómo resolverlos.

**RNF-02 · Rendimiento**
- En el Samsung S22, la app llega a **Hoy** en menos de 3 segundos.
- Con 300 sesiones de prueba cargadas, el historial se desplaza con fluidez y abre una sesión en menos de 1 segundo.

**RNF-03 · Confiabilidad**
- Cerrar la app a la fuerza en cualquier momento no pierde datos ya confirmados por el usuario.

**RNF-04 · Seguridad**
- Un usuario no puede leer ni modificar datos de otro, aunque manipule las peticiones. Se verifica con dos cuentas de prueba.
- El repositorio no contiene claves privadas ni contraseñas.

**RNF-05 · Privacidad**
- La ubicación solo se lee con una actividad de running activa.
- Las rutas son privadas: solo las ve su dueño.

**RNF-06 · Idioma**
- Toda la interfaz está en español de México. Los textos están centralizados para poder traducirlos después.

**RNF-07 · Compatibilidad**
- Android: verificado en Samsung S22. Debe funcionar en las versiones de Android que soporte la versión de Expo usada.
- iOS: el código es compatible, pero no se verifica en dispositivo real en la versión 1.

**RNF-08 · Accesibilidad básica**
- Contraste suficiente entre texto y fondo, y la interfaz no se rompe con el tamaño de letra grande del sistema.

## 8. Supuestos confirmados

Decisiones donde la idea original no decía nada. El autor las revisó el 2 de noviembre.

| ID | Decisión |
|---|---|
| S-01 | La cuenta no es obligatoria. La app se usa sin cuenta y sin internet desde el primer momento (CUE-07); la cuenta se crea después sin perder datos. |
| S-02 | Inicio de sesión con correo y contraseña, y con Google (CUE-08). Apple queda fuera (D-01). |
| S-03 | El catálogo y las plantillas se escriben para este proyecto; no vienen de un servicio externo. Los ejercicios del catálogo llevan fotografía (EJE-05) y enlace a video tutorial (EJE-06). |
| S-04 | Running es solo al aire libre con GPS. Correr en caminadora se registra como cardio (CAR-01). |
| S-05 | Las distancias de running se muestran en kilómetros. |
| S-06 | Todos los servicios usados deben ser gratuitos para el tamaño de este proyecto. |
| S-07 | Las recomendaciones usan reglas fijas (sección 6.7), no inteligencia artificial. |
| S-08 | Se entregan la APK instalable y el repositorio. La app se demuestra en el Samsung S22 instalada desde esa APK; si eso fallara, se demuestra en Expo Go. |
| S-09 | Los mapas los pide el maestro como extra, pero son obligatorios en este proyecto: la APK entregada debe mostrar el mapa con la ruta (RUN-02, RUN-03, RUN-05). |

### Decisiones derivadas de las respuestas

Al aplicar las respuestas anteriores surgieron estos detalles. Se tomó la opción más sencilla y segura; el autor puede cambiar cualquiera antes de que se implemente.

| ID | Decisión | Por qué |
|---|---|---|
| D-01 | Sin inicio de sesión con Apple en la versión 1. | Apple exige su cuenta de desarrollador, que cuesta 99 dólares al año, aunque la app solo se use en Android. Choca con S-06. Se agrega al publicar en la App Store, que de todos modos exige esa cuenta. |
| D-02 | Continuar con Google es P2 y se prueba a partir de la build de desarrollo (bloque 7). | El inicio de sesión con Google no funciona dentro de Expo Go, y la constitución pide que todo lo P1 se pueda probar en Expo Go. Crear las credenciales de Google es gratis y no pide tarjeta. |
| D-03 | Al iniciar sesión desde el modo sin cuenta en una cuenta que ya tiene datos, se juntan; los ajustes que quedan son los de la cuenta. | La constitución dice que los datos del usuario no se pierden. |
| D-04 | Los videos se abren en YouTube; si un ejercicio no tiene enlace revisado, se abre una búsqueda. | Un enlace a un video concreto se rompe si el video se borra, y revisar 80 enlaces antes de la entrega es mucho trabajo. La búsqueda siempre funciona. |
| D-05 | Las fotografías salen de un banco de imágenes de ejercicios con licencia libre y van dentro de la app; los ejercicios sin foto muestran un ícono. Los ejercicios propios no llevan foto. | Funcionan sin internet y no hay problemas de derechos. Fotos en ejercicios propios obligarían a subir imágenes a la nube, algo que el calendario no justifica. |
| D-06 | El modo sin cuenta es P1. | Es lo primero que ve el usuario y cambia cómo se guardan los datos, así que tiene que construirse desde el principio. |

## 9. Preguntas resueltas

| ID | Pregunta | Respuesta del autor (2 de noviembre) |
|---|---|---|
| P-01 | ¿El maestro pide algo más además de los mapas? | Los mapas son un extra del maestro, pero obligatorios. No pide nada más. |
| P-02 | ¿Cómo se llama la app? | **ezfit**. |
| P-03 | ¿Fecha exacta y qué se entrega? | Entre el 25 y el 27 de noviembre. La APK y el repositorio. |
| P-04 | ¿Puedes registrar una tarjeta en Google Cloud? | No tiene tarjeta de crédito, sí de débito. Se intenta con la de débito; ver riesgo R-03 del plan técnico. |
| P-05 | ¿El maestro revisa los commits? | No. No hay calendario de commits; se avanza lo más rápido posible. |
| P-06 | ¿Kg o lb? | Las máquinas marcan lb, pero cada usuario registra en la unidad que quiera (AJU-01, SES-03). |

## Anexo A. Contenido de las plantillas

### Planes semanales

| Días | Distribución |
|---|---|
| 2 | Cuerpo completo A · Cuerpo completo B |
| 3 | Cuerpo completo A · B · C |
| 4 | Torso A · Pierna A · Torso B · Pierna B |
| 5 | Torso · Pierna · Empuje · Jalón · Pierna |
| 6 | Empuje · Jalón · Pierna, dos veces |

- A un principiante se le propone por defecto el plan que coincide con sus días. Si elige 5 o 6 días, la app le recuerda la importancia del descanso y le ofrece también el de 3 o 4 días.
- Cada rutina de un plan tiene entre 5 y 7 ejercicios, 3 series por ejercicio, rango de 8 a 12 repeticiones en ejercicios principales y de 10 a 15 en accesorios, y prioriza máquinas y movimientos básicos.

### Por tiempo

| Duración | Contenido |
|---|---|
| 30 min | Cuerpo completo, 4 ejercicios compuestos, descansos cortos |
| 45 min | Cuerpo completo, 5 a 6 ejercicios |
| 60 min | Cuerpo completo, 7 a 8 ejercicios |

### Pierna, Push y Pull

| Tipo | Músculos |
|---|---|
| Pierna | Cuádriceps, femoral, glúteo y pantorrilla |
| Push (empuje) | Pecho, hombro y tríceps |
| Pull (jalón) | Espalda, hombro posterior y bíceps |

Cada tipo tiene tres versiones, con la misma cantidad de ejercicios que las rutinas por tiempo: 30 minutos con 4 ejercicios y descansos cortos, 45 minutos con 5 a 6 ejercicios y 60 minutos con 7 a 8 ejercicios. En la pestaña Rutinas se muestran agrupadas por tipo.

Hasta la versión 0.3 había una rutina por músculo objetivo (pecho, espalda, pierna, hombro, brazos y abdomen); el autor las reemplazó por estas el 2 de noviembre de 2026.

El contenido exacto (qué ejercicios lleva cada plantilla) se redacta en la tarea correspondiente y el autor lo revisa antes de aprobarla.

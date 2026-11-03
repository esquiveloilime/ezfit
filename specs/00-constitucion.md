# Constitución del proyecto

**ezfit**, app móvil de gimnasio y running.
Versión 0.3, 3 de noviembre de 2026: el mapa en Android se prueba en la build de desarrollo.

Estos principios mandan sobre cualquier otro documento y sobre cualquier decisión de implementación. Si una tarea choca con uno de ellos, se detiene la tarea y se consulta al autor del proyecto. Solo el autor puede cambiar este documento.

## 1. La especificación va primero

No se implementa nada que no esté descrito en `01-especificacion.md`. Si durante el trabajo aparece una necesidad nueva o un requisito resulta incorrecto, primero se corrige la especificación y después el código, en el mismo commit. El código nunca es la fuente de verdad sobre qué debe hacer la app.

## 2. Usarla en el gimnasio tiene que ser más rápido que una libreta

La app se usa con una mano, entre series, con poco tiempo y poca atención. Registrar una serie con los valores de la vez anterior toma como máximo dos toques. Cualquier pantalla del flujo de entrenamiento que pida más pasos de los necesarios se considera un defecto, aunque funcione.

## 3. El apartado de pesas funciona sin internet

La base de datos del teléfono es la fuente de verdad de lo que ve el usuario. Todo lo relacionado con rutinas, sesiones, series y cardio funciona igual con o sin conexión. La sincronización con la nube ocurre en segundo plano y nunca bloquea una acción del usuario.

## 4. Los datos del usuario no se pierden

- Una sesión o una actividad de running en curso sobrevive al cierre de la app, a una llamada o a que el sistema la mate.
- Nada se borra de forma definitiva sin confirmación.
- La sincronización nunca reemplaza un dato más reciente con uno más antiguo ni crea duplicados.

## 5. Privacidad por defecto

- Cada usuario solo puede leer y escribir sus propios datos; esto se garantiza en el servidor, no solo en la app.
- La ubicación se lee únicamente mientras hay una actividad de running activa y el usuario lo ve claramente.
- No se guardan secretos (claves privadas, contraseñas) en el repositorio.

## 6. Multiplataforma, con Android como plataforma verificada

El código debe funcionar en Android y en iOS. En la versión 1 solo se verifica en un dispositivo real Android (Samsung S22). No se escribe código exclusivo de una plataforma sin una alternativa para la otra, y cualquier diferencia de comportamiento se documenta.

## 7. Compatible con Expo Go mientras sea posible

Todo requisito de prioridad P1 debe poder probarse en Expo Go. Hay dos excepciones: el seguimiento de running en segundo plano, que necesita una build de desarrollo, y el dibujo del mapa en Android, porque la clave de Google Maps que trae Expo Go dejó de funcionar (el autor lo aprobó el 3 de noviembre de 2026). El resto de running, incluida la medición de la ruta, se sigue probando en Expo Go. No se agregan librerías que rompan la compatibilidad con Expo Go sin que el plan técnico lo indique.

## 8. Incrementos pequeños y comprobables

El trabajo avanza en incrementos que el autor puede probar en su teléfono. No hay un ritmo fijo de commits: se avanza tan rápido como se pueda, y varios incrementos pueden hacerse el mismo día. Cada incremento deja la app funcionando y tiene su lista de pasos para probarlo. Los incrementos se agrupan en bloques, y el autor prueba cada bloque completo antes de pasar al siguiente.

## 9. Calidad mínima no negociable

- TypeScript en modo estricto, sin errores de tipos ni de lint al hacer commit.
- La lógica de dominio (recomendaciones, cálculos de distancia y ritmo, sincronización) tiene pruebas automáticas.
- Los textos de la interfaz están en español y centralizados en un solo lugar, para poder traducir después.

## 10. Sencillez técnica y costo cero

- Solo se usan servicios con plan gratuito suficiente para el proyecto.
- Se prefiere la solución más simple que cumpla el requisito. No se agregan dependencias fuera de las listadas en el plan técnico sin justificarlo y sin aprobación del autor.
- No se construye nada "por si acaso": lo que está fuera del alcance de la versión 1 no se implementa ni se deja preparado a medias.

# Diario de decisiones

Decisiones importantes del proyecto, en orden. Cada una dice qué se decidió, por qué y qué alternativa se descartó. El detalle completo está en `specs/`.

| Fecha | Decisión | Por qué | Alternativa descartada |
|---|---|---|---|
| 2 nov | Trabajar con desarrollo guiado por especificaciones (`specs/`) | El autor no programa: así decide qué hace la app y la IA implementa sin adivinar | Pedir pantallas sueltas a la IA sin documento de referencia |
| 2 nov | React Native con **Expo SDK 57** y TypeScript estricto | Se desarrolla desde Windows y se prueba en el teléfono con Expo Go | React Native sin Expo: más configuración nativa sin beneficio |
| 2 nov | **SQLite** en el teléfono como fuente de verdad, con Drizzle | La app funciona sin internet y sin cuenta; los datos no se pierden | AsyncStorage (no sirve para historial); Realm o WatermelonDB (no funcionan en Expo Go) |
| 2 nov | **Supabase** para cuentas y respaldo, con un motor de sincronización propio | Gratis, relacional igual que SQLite y sin programar servidor | Firebase (base no relacional); PowerSync (servicio extra) |
| 2 nov | La cuenta no es obligatoria (modo sin cuenta, S-01, D-06) | El usuario empieza a entrenar en segundos; la cuenta se crea después sin perder datos | Exigir registro al abrir |
| 2 nov | Sin inicio de sesión con Apple (D-01) | Exige pagar 99 dólares al año; la app se entrega para Android | Incluirlo |
| 2 nov | Peso guardado en la unidad que eligió el usuario, sin convertir; `lb` por defecto | Las máquinas del gimnasio marcan lb, pero cada quien registra como quiera (P-06) | Convertir todo a kg al guardar |
| 2 nov | Rutinas predeterminadas Pierna, Push y Pull | Pedido del autor al probar: es como entrena la gente | Una rutina por músculo |
| 2 nov | Recomendaciones de peso con **reglas fijas**, no con IA (S-07) | Son predecibles, se prueban y no dependen de un servicio | Un modelo de IA dentro de la app |
| 3 nov | Adelantar la build de desarrollo para ver el mapa | La clave de Google Maps de Expo Go expiró y el mapa salía negro en Android | Esperar al bloque 7; cambiar a MapLibre (queda como plan B) |
| 21 nov | Especificación 0.4 con el feedback del autor | Las pruebas en el teléfono mostraron mejoras de uso (barra inferior, historial por mes, privacidad) | Dejar la especificación original |
| 22 nov | Agregar `expo-task-manager` para correr con la pantalla apagada | Android necesita una tarea en segundo plano para seguir leyendo el GPS | Entregar con el aviso de mantener la pantalla encendida |
| 22 nov | Gráfica de progreso dibujada sin librería | La librería propuesta pedía dos librerías nativas más; solo se necesita una línea | `react-native-gifted-charts` |
| 22 nov | Fotos de free-exercise-db dentro de la app | Dominio público (Unlicense, confirmada) y se ven sin internet | Descargarlas de internet; Wikimedia Commons (plan B) |
| 22 nov | **Retirar las fotos de los ejercicios** (EJE-05) | El autor las probó en el teléfono y prefiere el ícono: la ficha y el catálogo se veían mejor sin foto | Mantener las fotos |
| 22 nov | Sugerencia de peso con umbrales de 5 y 6 repeticiones (REC-01) | Al probarla, el autor notó que con pocas repeticiones conviene bajar el peso y buscar al menos 6, en lugar de comparar solo con el rango de la rutina | La regla original de "mayoría por debajo del mínimo del rango" |
| 22 nov | **Recorte:** I-23 (P2 restantes) queda pendiente y el pulido se limita a lo que falle en las pruebas | Entregar el APK hoy | Seguir agregando funciones y arriesgar la entrega |
| 22 nov | Entregar un APK independiente (perfil `preview` de EAS) | La build de desarrollo necesita la computadora con `expo start`; el APK funciona solo | Entregar la build de desarrollo o Expo Go |

## Pendientes por el recorte

Quedan anotados para una versión posterior:

- Parciales por kilómetro (RUN-11).
- Récords personales (HIS-07).
- Editar sesiones pasadas (HIS-06).
- Cambiar plan y días de entrenamiento (AJU-04).
- Compartir una actividad como imagen (RUN-14).
- Descanso en la barra de notificaciones (SES-13).

# 2. MISIOA · INPERIALISMOAREN FAKTOREAK

**Estado:** desarrollo de cinco pantallas en rama aislada. La rama NO modifica GitHub Pages hasta que se integre. La base de datos NO debe activar la misión 2 antigua y la nueva en momentos distintos.

## Fuente didáctica y actividades

Material de referencia único: «Inperialismoaren garaia eta Lehen Mundu Gerra (kapitalismoaren garapena)», páginas/diapositivas **6 a 18** del PDF proporcionado por el docente.

| Ejercicio | Título | Diapositivas | Actividad interactiva | Contenido de origen |
| --- | --- | --- | --- | --- |
| 1 | Kausen kabinetea | 6 | Once tarjetas asignadas a cinco apartados, por selección o arrastre | Económicos, demográficos, religiosos, políticos e ideológicos/científicos |
| 2 | Kapitalaren ibilbideak | 7–9 | Reconstrucción de tres hitos en línea de tiempo y dos decisiones económicas | Mercados, materias primas, inversión, Suez (1869), Hiyaz (1908), Panamá (1914) |
| 3 | Migrazioen liburua | 10–12 | Lectura de tres cifras de una gráfica y dos elecciones de contexto | Demografía, condiciones laborales, misiones católicas y protestantes; religiones indígenas |
| 4 | Boterearen artxiboa | 13–16 | Cinco expedientes históricos de lectura crítica | Control de rutas, prestigio, chauvinismo, justificación racista, documento de 1863 |
| 5 | Esploratzaileen espedientea | 17–18 | Atlas de selección múltiple, polos, cronología y caso Congo | Nilo, Níger, Congo, Zambeze, Himalaya, Siberia, Australia, Peary, Amundsen, Stanley y Livingstone |

**Discrepancia que existe en el documento original:** la diapositiva 10 dice en su párrafo que Europa pasó de **300 a 450 millones** entre 1850 y 1900, mientras que su **tabla** presenta 1850: **266 millones**, 1870: **310 millones** y 1900: **400 millones**. El ejercicio 3 utiliza expresamente **las cifras de la tabla**, sin mezclar ambas series ni presentar una cifra corregida sin autorización.

**Tratamiento crítico:** la fuente de 1863 de la diapositiva 16 no se reproduce de forma literal porque contiene afirmaciones racistas y deshumanizadoras. Se presenta como ejemplo histórico de racismo utilizado para justificar la dominación, no como conocimiento científico válido. El expediente de Stanley contextualiza su vinculación con la explotación colonial del Congo según la diapositiva 18.

## Reglas del juego

- Solo accede el alumno de un equipo que haya completado la misión 1. El profesor dispone de vista previa con \`?preview=1\`; nunca guarda puntuaciones.
- Cinco ejercicios secuenciales: el segundo requiere el primero, el tercero requiere el segundo, etc. No se puede avanzar manipulando solo el navegador.
- Comprobación en Supabase mediante una función \`SECURITY DEFINER\`, con identificador real de usuario y equipo, serialización por equipo y estado compartido.
- Se devuelve al alumno **solo** si el ejercicio está completado; tras un error no se devuelven respuestas correctas, posiciones equivocadas, aciertos parciales ni pistas.
- La corrección está preparada para una tabla **privada**, \`public.mission2_answer_keys\`, habilitada con RLS y sin política de lectura. **No hay claves correctas publicadas en el JavaScript, HTML ni migración pública.**
- Al completar el quinto ejercicio se añade exactamente una finalización del equipo en \`mission_completions(mission_id=2)\`; el disparador existente genera la insignia que desbloquea la misión 3.
- Reintentos ilimitados, incluida repetición idempotente de un ejercicio ya completado. No se cambia ningún ejercicio de la misión 1.

## Archivos

- \`inperialismoaren-faktoreak.html\`: sala única con cinco ejercicios/pantallas.
- \`assets/mission2-faktoreak.css\`: diseño de museo histórico, papel, colores coherentes y versión adaptable a escritorio, tableta y móvil.
- \`js/mission2-faktoreak.js\`: actividades y acceso a Supabase, **sin claves de solución**.
- \`js/app.js\`: únicamente añade la ruta de entrada para la segunda misión. Las demás misiones se conservan.
- \`supabase/mission2_faktoreak.sql\`: tablas, seguridad, nueva RPC y cambio de misión 2 cuando se decida publicarla. **No contiene las respuestas privadas**.
- \`tests/mission2-content.test.mjs\`, \`tests/mission2-browser-smoke.mjs\`: estructura, seguridad y navegación con servidor simulado, sin datos de alumnos.

## Activación segura (aún no publicada)

1. Aprobar primero las pruebas de interfaz y los cinco ejercicios en Chromium de la rama. Realizar una revisión visual con dispositivos y verificar la autenticación de docente y dos estudiantes de ensayo.
2. Preparar en Supabase el esquema \`mission2_exercise_completions\`, la tabla privada \`mission2_answer_keys\` y la función \`submit_mission2_exercise\`. **Cargar las cinco claves correctas exclusivamente mediante una operación privada de administrador en Supabase**, nunca mediante GitHub, logs, HTML o variables públicas.
3. Validar cinco envíos correctos y varios erróneos con un equipo temporal en una transacción que termine con \`ROLLBACK\`; comprobar duplicados, concurrencia y roles.
4. Coordinar el cambio del enlace de la misión 2 en \`main\` con el bloqueo de \`submit_mission(2,...)\` genérico, para que no queden dos vías de aprobación. El cierre se completa actualizando el título de la misión 2 en \`public.missions\`.
5. Probar misión 1 → los cinco ejercicios de la misión 2 → insignia 2 → misión 3 en sesiones reales y revisar el panel docente. No modificar imágenes, estilos, tarjetas ni tamaños de la misión 1.

**IMPORTANTE:** no ejecutar el SQL de esta rama directamente en un aula activa antes del despliegue coordinado, porque al bloquear la antigua misión 2 los alumnos necesitarán la nueva interfaz. La prueba de Chromium simulada no sustituye la validación autenticada real. Si falta la tabla de progreso, la nueva página informa de que la activación está pendiente y no permite guardar.

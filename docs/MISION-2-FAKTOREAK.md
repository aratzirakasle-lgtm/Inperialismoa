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


## Verificación real de Supabase en entorno existente (sin publicar la nueva misión)

**20/11/2026 · preparación aditiva realizada:**
- Se ha aplicado solo la **parte aditiva** de la migración: tabla de finalización \`mission2_exercise_completions\`, tabla privada \`mission2_answer_keys\`, su política RLS y la función \`submit_mission2_exercise\`. No se ha ejecutado el cambio de \`submit_mission(2,...)\` ni el cambio de nombre de la misión 2 publicada.
- Se han cargado **cinco juegos de claves de corrección exclusivamente en la tabla privada de Supabase**, sin incluirlos en GitHub. La comprobación de permisos confirmó que el rol \`authenticated\` no puede leer la tabla privada.
- Prueba transaccional autenticada a nivel SQL con identidades ficticias de dos alumnos de un mismo equipo y un profesor: cinco ejercicios secuenciales aceptados; envío inválido rechazado sin pistas ni posiciones; intento de saltarse ejercicio 1 rechazado; el segundo alumno ve el progreso compartido; no se duplican finalizaciones; el profesor no puede guardar como alumno.
- Al completar el ejercicio 5, la función creó exactamente una finalización de la misión 2, una insignia y devolvió \`next_mission_id=3\`. Todo el ensayo se hizo dentro de una transacción terminada en **ROLLBACK**.
- Comprobación posterior: **3 usuarios Auth, 3 perfiles, 1 equipo**, **0** finalizaciones o insignias de la misión 2 de ensayo, 5 conjuntos privados de respuestas, y el título publicado de la misión 2 **continúa siendo** «El reparto de África».

**Pendiente antes de publicar:** validación de sesiones desde navegador con usuarios de ensayo autorizados, integración de interfaz en \`main\`, ajuste sincronizado de \`submit_mission(2,...)\` para evitar rutas de aprobación alternativas y actualización del título público. Las pruebas SQL no reemplazan concurrencia real de dos conexiones HTTP ni el recorrido visual autenticado.


## Rediseño visual del ejercicio 1 · concepto de museo a color

El primer ejercicio se ha reconstruido como una **sala de museo con cinco vitrinas** (económica roja, demográfica turquesa, religiosa morada, política verde e ideológica/científica ocre), con iluminación, marcos de madera y latón, ilustraciones SVG vectoriales originales, cartelas de pergamino y mesa expositiva. La vista está desarrollada en **HTML + CSS + JavaScript real**, no consiste en una imagen de fondo con zonas falsas.

Interacción: las 11 cartelas mantienen sus IDs históricos y pueden colocarse haciendo clic en la cartela y después en el botón «+» de una vitrina, o arrastrando y soltando. Las cartelas se **mueven de verdad** del escritorio al interior de la vitrina y pueden reubicarse. «Berriz hasi» limpia el borrador local; «EGIAZTATU» queda disponible cuando todas están colocadas, y sigue invocando la RPC privada de Supabase sin ofrecer pistas si hay errores. No se han alterado preguntas, respuestas, permisos ni el desbloqueo de los cinco ejercicios. Las otras cuatro interfaces conservan su presentación previa para su rediseño individual posterior.

La réplica está inspirada directamente en el concepto ilustrado aprobado por el docente, recreado mediante componentes nativos para permitir accesibilidad, escalado de interfaz y arrastre real. No es una imagen estática ni una promesa de reproducción idéntica píxel a píxel: se prioriza que sea operativa y adaptable.

La prueba \`tests/mission2-browser-smoke.mjs\` realiza un recorrido de las cinco pantallas, comprueba el movimiento entre vitrinas mediante *drag and drop*, la colocación de las 11 cartelas con clics, la activación de verificación y la ausencia de escritura desde el modo de profesor. Se generan capturas para revisar escritorio y móvil.


### Segunda revisión visual: fidelidad a la maqueta colorida

Se ha revisado expresamente la **diferencia** entre la maqueta museística 16:9 aprobada y la captura de Chromium de la primera versión. No se considera una réplica pixel-perfect: se ha llevado a una composición funcional muy próxima.

- Fondo escenográfico con **mapa histórico, una lámpara de época, globo terráqueo, instrumentos, fotografía enmarcada, libros, busto y mueble de madera** mediante \`assets/m2-room-illustration.svg\`.
- **Cinco escenas históricas policromadas** independientes en \`assets/m2-scene-*.svg\`: monedas, barco con viajeros, iglesia de misión, fortificación con cañón y globo con libros, sobre vitrinas burdeos, turquesa, violeta, verde y dorada.
- Rediseño horizontal: muebles centrados, márgenes destinados a objetos de museo, cabecera granate amplia y una mesa de cartelas compacta, medidos también en **1672×941** (formato exacto del concepto).
- Rótulos resumidos en las tarjetas para mejorar lectura; sus descripciones originales se conservan en atributos de accesibilidad/tooltip y **no cambian los IDs ni las respuestas válidas**.
- Placas doradas ahora **clicables y enfocables con teclado**: nunca se pierde la capacidad de añadir tarjetas a una vitrina por estar llena. Se puede además arrastrar, recolocar o devolver a la mesa.
- Los compartimentos de las vitrinas crecen automáticamente al añadir tarjetas; Chromium comprueba que ninguna queda recortada aun concentrando once tarjetas en una misma vitrina.
- La vista previa del profesor muestra también «✓ EGIAZTATU» sin escribir datos; la navegación de revisión se mantiene separada.
- Efectos de selección dorada y ajustes \`prefers-reduced-motion\` para evitar inestabilidad del arrastre.

La segunda revisión mantiene **intactos** los ejercicios 2 a 5, la lógica de permisos de Supabase, el esquema de corrección y las pantallas de la misión 1. Todos los cambios siguen exclusivamente en la rama de desarrollo / PR n.º 2.

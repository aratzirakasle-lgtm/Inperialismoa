# Tercer ejercicio · «MIGRAZIOEN BULEGOA (1850–1900)»
## Replica HTML del concepto gráfico B · 20/11/2026

La pantalla del tercer ejercicio se ha sustituido por una sola escena de **cuatro minijuegos**, desarrollados con HTML real, CSS y elementos SVG/WebP decorativos extraídos del prototipo aprobado. El título se sitúa arriba; en orden de lectura:

1. **Mundu mugimenduan:** tres valores de población europea (1850, 1870, 1900), una pregunta sobre las condiciones laborales y la migración y otra sobre las misiones religiosas. Conserva exactamente las preguntas, los identificadores y las alternativas preexistentes en JS.
2. **Norantz hedatu ziren misioak?:** atlas con tres localizaciones que el alumno debe relacionar con África, Asia y Oceanía, las tres zonas **nombradas explícitamente** en el PDF (página 11). No se incorporaron como respuestas las rutas hacia EE. UU., Argentina o Brasil dibujadas en una maqueta generada, porque no se documentan en las páginas empleadas.
3. **Egia ala gezurra?:** cinco afirmaciones sobre el censo 1850–1900, las condiciones de vida, la actividad de las iglesias y su utilización como justificación colonial. No se evalúa como "consecuencia positiva/negativa" lo que el PDF no presenta como tal.
4. **Emigrantearen maleta:** ocho cartelas ilustradas que se clasifican entre motivos/contextos de la emigración y la expansión y efectos documentados. Incluye la posibilidad de seleccionar, arrastrar y recolocar.

### Fundamento documental

PDF del proyecto, **«Inperialismoaren garaia eta Lehen Mundu Gerra (kapitalismoaren garapena)»**, diapositivas/páginas 10–12. La tabla de la p. 10 ofrece **1850: 266 000 000, 1870: 310 000 000, 1900: 400 000 000**. En la misma diapositiva existe un párrafo introductorio con otro par de cifras (300 y 450 millones); para el ejercicio se conserva la **tabla del propio documento**, que es la que se evaluaba antes. La p. 11 menciona las iglesias católica y protestante y las misiones de Asia, África y Oceanía. La p. 12 trata el cambio de las religiones indígenas en África durante el siglo XX. No se introducen datos de destinos migratorios específicos que no estén documentados.

### Recursos artísticos

- \`assets/m2-atlas-original-map.webp\` — cartografía original del concepto aprobado B.
- \`assets/m2-atlas-original-migrants.webp\` — escena histórica de emigrantes.
- \`assets/m2-atlas-original-mission.webp\` — escena misionera original.
- Las maletas y los controles son elementos reales en DOM: no hay cartelas pintadas que resulten imposibles de mover.

### Contrato de respuestas y seguridad

La tercera actividad **pasó de 5 a 21 campos**. Al no exponer respuestas correctas en el navegador, **la clave privada \`public.mission2_answer_keys.expected\` para exercise=3 DEBE ACTUALIZARSE EN SUPABASE ANTES DE PUBLICAR**, tras la revisión pedagógica. NUNCA añadir los valores correctos a una migración pública, un test público ni a JavaScript del alumnado. El RPC preexistente \`public.submit_mission2_exercise\` exige coincidencia exacta de todas las claves. Si aún guarda solo cinco, los nuevos envíos serán rechazados por el servidor.

Claves públicas (son identificadores de campos, **no soluciones**):

- Bloque I: \`1850\`, \`1870\`, \`1900\`, \`migration\`, \`missionaries\`.
- Bloque II: \`route_africa\`, \`route_asia\`, \`route_oceania\`.
- Bloque III: \`statement_1\`, \`statement_2\`, \`statement_3\`, \`statement_4\`, \`statement_5\`.
- Bloque IV: \`bag_growth\`, \`bag_conditions\`, \`bag_better\`, \`bag_conversion\`, \`bag_settlement\`, \`bag_missions\`, \`bag_oceania\`, \`bag_faith\`.

Todos los valores enviados son strings. Rutas: valores permitidos \`africa\`, \`asia\`, \`oceania\`; afirmaciones: \`egia\` o \`gezurra\`; maletas: \`cause\` o \`effect\`. La comprobación de cada parte solo indica si está cumplimentada; **no da pistas, colores de acierto ni soluciones**. La corrección auténtica y el desbloqueo de la siguiente sala permanecen en Supabase.

### Qué no debe publicarse ni afirmarse como validado

- La rama de la PR #2 sigue en borrador. No modificar la web pública ni \`main\` sin autorización.
- Las pruebas de alumnos/profesor de GitHub Actions usan una **réplica de Supabase**, no cuentas reales ni la clave privada definitiva.
- Pendiente: prueba con usuario real de alumno y profesor, actualización privada de la clave de 21 campos, comparación de resolución de imágenes y rendimiento antes de comprimir más.
- La primera misión y ejercicios 1, 2, 4, 5 de la segunda no han cambiado funcionalmente.

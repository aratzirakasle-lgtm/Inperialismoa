# Misión 3 · Inperialismoa mugimenduan

El quinto ejercicio añade una sala de proyección en euskera. El alumnado monta tres películas sobre la expansión imperialista de Rusia, Estados Unidos y Japón. Cada película tiene cuatro decisiones. Una película completa abre la siguiente y la tercera habilita el montaje final. El sexto ejercicio sigue pendiente en el recorrido.

## Revisar la vista previa

1. Abrir el sitio servido desde la rama de desarrollo e iniciar sesión en el museo con una cuenta que tenga el rol `teacher`.
2. Ir a `berlingo-areto-sekretua.html?preview=1&station=cinema`. También se puede entrar con el quinto medallón desde la vista previa de la misión 3.
3. Si se dispone del PDF curricular, pulsar **22. diapositiba ikusi**, elegir el PDF y abrir la página 22. El visor del navegador permite ampliar la diapositiva.
4. Montar y comprobar cada película. Los aciertos, errores y decisiones pendientes se indican con texto y símbolos además de color. Se pueden pausar y saltar las proyecciones.

La comprobación docente reutiliza el flujo de Supabase del museo, que exige una sesión válida y consulta el rol en `profiles`. El progreso de ensayo vive en memoria durante la visita. Se conserva al cambiar de sala, película o consultar los apuntes. Una recarga inicia otro ensayo. Las pruebas de navegador simulan las respuestas de Supabase.

## Fuente y arte

El PDF de aula y la maqueta de referencia mencionada en el encargo no estaban en los materiales disponibles. La comparación curricular formal con el original queda pendiente. Las doce respuestas y los resúmenes siguen el encargo recibido. En particular, el montaje ruso usa flechas para la expansión hacia el Himalaya y la India, y el estadounidense presenta el control de Cuba con un perímetro de influencia. Filipinas y Puerto Rico aparecen por separado, igual que Formosa y Corea.

El PDF elegido se abre como archivo local en la página 22. Cuando esté disponible una copia autorizada de la diapositiva, se puede guardar en `assets/m3-cinema/diapositiba-22.webp` y configurar `data-cinema-source="./assets/m3-cinema/diapositiba-22.webp"` en `#station-body` del HTML para activar el visor ampliable integrado. El visor usa la imagen original completa.

Los doce fondos WebP se generaron para esta sala. Son recreaciones escénicas, sin valor de fuente documental. Los tres fondos principales son imágenes nativas de 1672 × 941. Los planos secundarios provienen de paneles nativos de 826–877 píxeles de ancho, sin ampliación en los archivos. Locomotora, barco, símbolos y proyector se dibujan con SVG o CSS en capas independientes.

## Archivos

| Archivos | Función |
| --- | --- |
| `berlingo-areto-sekretua.html`, `js/m3-berlin.js`, `js/m3-itinerary.mjs` | Montaje, desmontaje, control de entrada y quinto medallón. |
| `js/m3-cinema.mjs` | Doce decisiones, comprobación de vista previa y progresión. |
| `js/m3-cinema-ui.mjs` | Consola, película activa, estados, transporte y apuntes. |
| `js/m3-cinema-animation.mjs` | Objetos en capas, animación, planos verificados y montaje final. |
| `assets/m3-cinema.css`, `assets/m3-cinema/` | Estilos de la sala y fondos originales. |
| `tests/m3-cinema.test.mjs`, `tests/m3-cinema-browser.mjs` | Pruebas de lógica, permisos simulados, interacción, animación y vistas adaptables. |
| `.github/workflows/check.yml` | Prueba de Chromium y publicación de capturas y vídeo como artefacto de Actions. |

## Pruebas locales y reversión

```sh
node --test tests/m3-cinema.test.mjs tests/m3-itinerary.test.mjs
npm install --no-save --no-package-lock --ignore-scripts playwright@1.56.1
npx playwright install chromium
python3 -m http.server 8765 --bind 127.0.0.1
```

En otra terminal, `CINEMA_VIDEO=1 node tests/m3-cinema-browser.mjs` produce las capturas y la grabación en `test-output/`. Con un Chromium instalado se puede indicar `CINEMA_CHROMIUM=/ruta/al/binario`.

En la base `e5aefdd` y en esta rama se reproducen los mismos tres fallos de pruebas unitarias del vestíbulo C y del atlas fotográfico. La suite general de Chromium también reproduce los fallos de base en el marcador de aula, el vestíbulo C y el atlas fotográfico. La prueba del cronógrafo de la misión 2 reproduce en ambas versiones la discrepancia entre la lámina WebP cargada y el SVG que espera la prueba. Las pruebas de aula de la misión 1, del atlas de la misión 3 y de `Lau inperioen enigma` pasaron con Chromium.

Descartar la PR conserva la versión actual. Si el cambio se incorpora en el futuro, se puede revertir su commit. La rama no requiere migraciones.

Para un futuro lanzamiento, el solucionario de ensayo debe retirarse del cliente. El servidor autorizado deberá validar los doce IDs, aplicar los permisos de cada equipo y devolver únicamente los resultados. El guardado del borrador se podrá conectar entonces al mecanismo de equipos que se autorice para la misión 3.

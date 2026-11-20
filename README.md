# Inperialismoa · Museo digital de Historia (4.º ESO)

Web educativa HTML, CSS y JavaScript alojada en GitHub Pages y conectada a Supabase. Este documento describe **la aplicación actual**, no el prototipo inicial. El diseño de cada pantalla y sus imágenes históricas se conservan deliberadamente.

## Pantallas y recorrido

| Archivo | Contenido |
| --- | --- |
| `index.html` | Portada, inicio de sesión, museo, menú de misiones y panel docente |
| `index.html#mission1gallery` | Misión 1 · Ejercicio 1: `Potentzia handien galeria` (20 tarjetas) |
| `bi-sistema.html` | Misión 1 · Ejercicio 2: `Bi sistema, bi Europa` |
| `inperialismoaren-definizioa.html` | Misión 1 · Ejercicio 3: `Inperialismoaren definizioa` |
| `inperioen-aztarnak.html` | Misión 1 · Ejercicio 4: `Inperioen aztarnak` (cuatro expedientes y reflexión) |
| `esaldiak-osatu.html` | Misión 1 · Ejercicio 5: `Esaldiak osatu` y aviso final |
| `preview-bi-sistema.html` | Enlace de compatibilidad con la previsualización docente del segundo ejercicio |

El **alumnado** entra con una cuenta `student` de Supabase. Debe completar los cinco ejercicios de la primera misión, en orden, para que se registre la misión y se desbloquee la segunda. La corrección y la persistencia real dependen de las funciones seguras de Supabase.

El **profesorado** entra con una cuenta `teacher`. Desde el panel puede abrir `Vista del alumno` y visitar los cinco ejercicios a través del menú privilegiado. La previsualización docente y sus pantallas finales simuladas **no guardan resultados de equipos**, y la mera presencia de `?preview=1` en un enlace **no concede acceso docente**: el rol se verifica en Supabase. Para comprobar la experiencia real es necesario iniciar sesión con una cuenta auténtica de alumno en otro perfil de navegador o en incógnito.

Las misiones posteriores, el mapa de territorios, las entregas PDF, el seguimiento de clase y la evaluación del profesor se conservan en `js/app.js` y los datos de Supabase.

## Organización del repositorio

- `js/app.js`: portada, sesiones, navegación, misiones posteriores, mapas y panel docente.
- `js/galeria-potencias.js`, `js/galeria-iconos-color.js` y `assets/galeria-potencias.css`: ejercicio 1, tarjetas, imágenes SVG transparentes y vitrinas.
- `js/bi-sistema-live.js`, `js/bi-sistema-iconos.js` y `assets/bi-sistema-*.css`: ejercicio 2.
- `js/mission1-third-auth.js` y el HTML del ejercicio 3: autorización y juego de la definición.
- `inperioen-aztarnak.html` y `assets/inperioen-*.css`: globo, expedientes e investigación del ejercicio 4.
- `js/mission1-fifth-auth.js` y el HTML del ejercicio 5: palabras, registro y final de misión.
- `js/mission1-navigation.js`: menú que solo se monta cuando el usuario autenticado es profesor.
- `js/config.js`: URL y clave **pública** de Supabase; nunca introducir la `service_role`.
- `supabase/schema.sql` y `supabase/teacher_private_dashboard.sql`: referencias históricas de esquema. **No ejecutarlas otra vez directamente en producción** sin revisar las diferencias y migraciones.
- `.github/workflows/check.yml` y `tests/`: sintaxis, enlaces, archivos, roles y pruebas de regresión.

**Sobre los estilos e imágenes:** varios CSS contienen fotografías y fondos incrustados en base64 o capas de ajuste que preservan una composición visual concreta. Algunos archivos antiguos no están enlazados en las páginas actuales, pero se mantienen como referencias reversibles. No eliminarlos o fusionarlos automáticamente sin comparar las cinco pantallas en ordenador y móvil. El tamaño de estos activos es mayor que el de una web convencional.

## Configuración y acceso

La configuración publicada actualmente utiliza Supabase (`DEMO_MODE = false` en `js/config.js`). La sesión del mismo navegador se comparte entre las dos vistas según el rol. Por eso entrar a la URL pública mientras ya se está autenticado como profesor muestra el panel docente y no una sesión real de estudiante.

Para activar **una demostración local** habría que establecer `DEMO_MODE = true` expresamente; ese modo usa datos ficticios y almacenamiento local, y **no verifica** el funcionamiento de Supabase. No es el modo vigente en GitHub Pages.

URL pública: `https://aratzirakasle-lgtm.github.io/Inperialismoa/`

Para nuevos docentes y grupos, usar los controles del panel autorizado y revisar las políticas RLS. No colocar contraseñas, claves secretas ni datos personales del alumnado en el repositorio.

## Funcionalidades docentes que deben conservarse

- Seguimiento privado por equipo y clase, intentos, errores y fechas de entrega.
- Administración de clases y equipos, exportaciones CSV y rúbricas privadas.
- Reclamación de territorios en el mapa y liberación autorizada por el profesor.
- Entrega y descarga de documentos PDF mediante el bucket privado `entregas`.
- Vista del alumno sin escrituras reales y libre navegación de las cinco pantallas de misión 1.
- Persistencia de aciertos y finalización de misión según las funciones de Supabase.

## Comprobaciones

En un entorno con Node.js:

```bash
for file in js/*.js; do node --check "$file"; done
node tests/check-html-scripts.mjs
node --test tests/*.test.mjs
```

GitHub Actions ejecuta las comprobaciones estáticas y una batería adicional de **pruebas reales con Chromium**. Estas últimas simulan cuentas de profesor y alumno mediante un Supabase ficticio: validan bloqueos, libre navegación docente, visibilidad de las nueve tarjetas europeas en ordenador/tableta, fases finales y recuperación local de tarjetas sin escribir datos en el proyecto Supabase.

Para ejecutar las pruebas de navegador localmente:

```bash
npm install --no-save --no-package-lock playwright@1.56.1
npx playwright install chromium
python3 -m http.server 8765 &
node tests/browser-smoke.mjs
```

**Criterio pedagógico:** tras una respuesta incorrecta se muestra únicamente un aviso de corrección, **sin pistas históricas sobre la respuesta**. Los botones de ayuda explican el manejo de las tarjetas. Las fuentes y documentos históricos que forman parte del ejercicio 4 se conservan.

**Borradores:** el ejercicio 1 conserva en `sessionStorage` las tarjetas todavía sin enviar, separadas por alumno y equipo. Si se recarga y se vuelve a abrir la galería en la misma pestaña, se restauran las posiciones provisionales; no se registran como aciertos ni modifican Supabase. La vista docente no guarda borradores. El archivo `assets/accesibilidad-juegos.css` incorpora foco visible y reducción del movimiento cuando el usuario lo solicita en su dispositivo.

Las pruebas de Chromium se realizan con Supabase **simulado**, por lo que **todavía falta un ensayo completo con cuentas reales** que verifique la persistencia, la concurrencia y el desbloqueo de la misión 2 en el servidor. Antes de utilizar datos de menores, comprobar privacidad, copias de seguridad y requisitos del centro/RGPD.

## Auditoría y conservación

Véase `docs/AUDITORIA-2026-11-20.md` para el inventario, los ajustes de mantenimiento, las comprobaciones realizadas y los riesgos que necesitan una intervención separada. Los activos originales, las cinco pantallas y los datos de Supabase **no se han eliminado** durante esta depuración.

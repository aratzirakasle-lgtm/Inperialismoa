# Auditoría conservadora de Inperialismoa
**Fecha:** 20 de noviembre de 2026
**Repositorio:** `aratzirakasle-lgtm/Inperialismoa`
**Ámbito:** código HTML/CSS/JS, navegación, autorización del alumno y del profesor, consultas Supabase y pruebas automatizadas.

## Principio de conservación

No se ha borrado **ningún** HTML, fotografía, fondo, hoja de estilos, ejercicio, tarjeta, ruta de navegación, respuesta, tabla o dato de Supabase. Los CSS históricos de estética y las fotografías incrustadas en base64 permanecen en el repositorio. Algunas reglas repetidas tienen condiciones `@media` diferentes y **no** son duplicados eliminables.

## Inventario protegido

- Pantalla principal `index.html`, acceso de alumnado y profesorado, mapa, panel docente, entregas y misiones posteriores.
- Ejercicio 1 `Potentzia handien galeria`, 20 tarjetas ilustradas, cuatro vitrinas y corrector.
- Ejercicio 2 `bi-sistema.html`, clasificación, interpretación y cierre.
- Ejercicio 3 `inperialismoaren-definizioa.html`, cartelas, zonas y cierre.
- Ejercicio 4 `inperioen-aztarnak.html`, globo, cuatro expedientes, lectura y reflexión final.
- Ejercicio 5 `esaldiak-osatu.html`, cinco huecos, comprobación y desbloqueo de la misión 2.
- Acceso histórico `preview-bi-sistema.html` y rutas docentes protegidas por el rol `teacher`.
- Imágenes, CSS activos y CSS heredados con capas gráficas; conservados incluso cuando ya no son referencias de la versión principal.

## Incidencias corregidas

1. **Redibujo duplicado en el ejercicio 4.** `verifyCase` recreaba el mismo expediente dos veces tras comprobar una respuesta. Ahora lo hace una sola vez y únicamente tras obtener una respuesta válida. Cuando falla Supabase, el mensaje de error ya no se borra por un redibujo inmediato.
2. **Reintento de reflexión final.** Ante un fallo de red o de verificación, el botón se habilita de nuevo para no obligar a recargar.
3. **Lecturas consecutivas innecesarias de Supabase.** En la portada/panel, seis lecturas independientes se resuelven en paralelo. Se conservan las mismas tablas, filtros, roles y límites por consulta.
4. **Actualizaciones en tiempo real redundantes.** Cuatro eventos provocaban cuatro refrescos completos concurrentes. Ahora se coordinan y procesan también los eventos que lleguen durante una consulta.
5. **Suscripción de Supabase al salir.** Se cierra la suscripción al cerrar la sesión, evitando consultas residuales.
6. **Documentación obsoleta.** El README se ha actualizado para describir el `DEMO_MODE=false` real, los cinco ejercicios, los dos roles, la vista docente y las pruebas existentes. Se corrigió una etiqueta interna del cuarto ejercicio que todavía lo describía como un prototipo desconectado.

## Pruebas automáticas de regresión

- `tests/check-html-scripts.mjs`: sintaxis de scripts incrustados en todos los HTML.
- `tests/mission1-access.test.mjs`: bloqueos secuenciales y distinción docente/alumno.
- `tests/gallery-artwork.test.mjs`: 20 miniaturas transparentes, arrastre y crecimiento de los dos paneles de Europa.
- `tests/site-structure.test.mjs`: existencia de las cinco pantallas, rutas locales, imports, duplicidad de IDs, salvaguarda de los cinco ejercicios, renderizado no duplicado y coordinación de eventos.
- `.github/workflows/check.yml`: comprobación automática sobre la rama `main`.

Estas pruebas inspeccionan código e integridad estructural; **no sustituyen** una ejecución completa en un navegador con credenciales reales ni aseguran la compatibilidad visual con todos los dispositivos.

## Supabase: auditoría de solo lectura

Se consultaron los avisos de seguridad y rendimiento, sin ejecutar migraciones ni cambiar información de alumnos.

- `answer_keys` tiene RLS activado y ninguna política de lectura; se mantiene así para no exponer soluciones.
- Se han señalado funciones `SECURITY DEFINER` accesibles a usuarios autenticados. Se han comprobado filtros de rol, identidad y equipo en funciones esenciales; **no** se les ha retirado `EXECUTE` indiscriminadamente, porque son las operaciones reales del juego. Conviene revisar individualmente sus privilegios y sus pruebas de autorización.
- La protección de contraseñas filtradas aparece desactivada: conviene revisar [Supabase Auth · seguridad de contraseñas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
- El asesor indica 13 claves foráneas sin índice de cobertura y cuatro índices sin uso registrado. No se han creado ni borrado índices: conviene comparar con el tamaño y el uso de las tablas antes de intervenir. [Supabase Database Linter](https://supabase.com/docs/guides/database/database-linter).
- No se han consultado ni compartido contraseñas, expedientes privados o datos personales de los estudiantes.

## Comprobaciones pendientes para validar producción

- Acceso real mediante **una cuenta de estudiante** sin ejercicios superados, siguiendo los cinco juegos en orden; observar correcciones, intentos, persistencia tras recargar y desbloqueo de la misión 2.
- Acceso real mediante **una cuenta de profesor**: navegación libre por las pantallas iniciales/finales y ausencia de escrituras sobre equipos.
- Pruebas en móvil, tableta y ordenador, especialmente vitrinas completas, arrastre táctil, lectura de tarjetas y escala de fotografías.
- Dos estudiantes del mismo equipo usando dos navegadores para comprobar concurrencia y actualización de progreso.
- Validación de seguridad del centro, accesibilidad, RGPD, copias de seguridad y tratamiento de datos antes de usar datos reales de menores.

## Decisiones de mantenimiento

- **Sin borrados de activos**: mantener reversibilidad y fidelidad histórica del diseño.
- **Sin cambios de esquema ni de registros en Supabase**: una optimización con riesgo de datos debe pasar antes por una copia de seguridad y un plan de migración.
- **Sin modificar contenidos educativos**: textos, conceptos, respuestas, puntuaciones y actividades conservados.

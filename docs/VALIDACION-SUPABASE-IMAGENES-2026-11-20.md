# Validación de Supabase e imágenes · 20 de noviembre de 2026

**Estado: verificación parcial. NO es un ensayo completo de producción.**

Repositorio: aratzirakasle-lgtm/Inperialismoa. Proyecto Supabase: Inperialismoa (eu-west-1).

## Verificado directamente en Supabase

- Proyecto activo; 2 perfiles student, 1 teacher y 6 misiones.
- Consultas RLS ejecutadas bajo el rol authenticated y la identidad de un estudiante y de un profesor dentro de transacciones revertidas: el estudiante ve 0 finalizaciones de misión y el profesor 1; el estudiante ve 2 perfiles autorizados y el profesor 3. **No equivalen a inicios de sesión por contraseña.**
- El rol authenticated recibe «permission denied» al intentar leer answer_keys, como corresponde.
- En una transacción con ROLLBACK, un perfil docente no pudo ejecutar las funciones de escritura submit_gallery_attempt ni submit_mission1_exercise.
- Existe una finalización previa y una marca de misión 1, pero hay 0 estados de galería, 0 de bi-sistema, 0 de expedientes y 0 registros de los ejercicios 3 y 5. **Una marca heredada no demuestra que los cinco ejercicios actuales funcionen.** Usar un equipo nuevo para el ensayo.

Ningún registro de alumnos, equipos o misiones se ha cambiado.

## Peso de imágenes previo a cualquier compresión

Ejecutar desde la raíz del repositorio:

    node tests/image-baseline.mjs
    node tests/image-baseline.mjs --json

| Pantalla | HTML y CSS de origen (KiB aprox.) | Imágenes base64 decodificadas (KiB aprox.) |
| --- | ---: | ---: |
| index.html | 434 | 259 |
| bi-sistema.html | 640 | 439 |
| inperialismoaren-definizioa.html | 721 | 524 |
| inperioen-aztarnak.html | 4730 | 3459 |
| esaldiak-osatu.html | 471 | 340 |

Se suma el HTML y CSS local enlazado; no JavaScript, ni recursos dinámicos, ni la transferencia gzip/Brotli. Las cifras no son tiempos de red ni LCP. El ejercicio 4 es el mayor candidato de optimización, pero **no se ha comprimido ni cambiado ninguna ilustración**.

**Medición de rendimiento en navegador pendiente:** con cuentas de prueba y DevTools Network (Disable cache), registrar por cada pantalla tamaño transferido, duración y recursos lentos en escritorio, tableta y móvil; en Lighthouse/Performance registrar LCP y CLS, tres pasadas con la misma conexión y mediana. Comparar siempre antes y después de cualquier compresión sin tocar disposición ni contenido histórico.

## Pruebas reales con cuentas de ensayo

Se ha añadido tests/live-supabase-smoke.mjs. Este script no simula Supabase: abre la URL pública, usa credenciales reales, comprueba los roles, el restablecimiento de la sesión y la navegación docente y vigila las llamadas RPC. Por diseño no registra respuestas ni modifica equipos.

**Pendiente de ejecutar:** no se han proporcionado a la sesión contraseñas de cuentas de prueba y no se deben extraer las de estudiantes. Ejecutar solo con cuentas nuevas de ensayo autorizadas y variables de entorno, nunca incluirlas en archivos ni registros públicos:

    LIVE_STUDENT_EMAIL=... LIVE_STUDENT_PASSWORD=... \
    LIVE_TEACHER_EMAIL=... LIVE_TEACHER_PASSWORD=... \
    node tests/live-supabase-smoke.mjs

Opcionales: LIVE_BASE_URL y LIVE_STUDENT2_EMAIL/LIVE_STUDENT2_PASSWORD. Requiere Node.js, Playwright y Chromium; usar la instalación indicada en README.

## Ensayo completo pendiente: protocolo de aceptación

Preparar una clase y equipo NUEVOS de ensayo, dos estudiantes de prueba del mismo equipo y un profesor de prueba, cada cuenta en un navegador/perfil independiente. Debe constar que no hay finalizaciones previas.

1. Entrar como estudiante A y comprobar que solo ve su equipo y no existe navegación docente. Intentar abrir directamente las pantallas 2-5 y el parámetro preview=1 antes de avanzar: deben respetar los bloqueos.
2. Completar el ejercicio 1 (20 tarjetas). Probar una respuesta equivocada: no aparecen pistas, soluciones ni ayudas históricas. Comprobar persistencia al recargar.
3. Completar todas las fases del ejercicio 2, recargar y comprobar el desbloqueo correcto.
4. Completar los cinco conceptos del ejercicio 3; comprobar corrección, bloqueo de saltos y persistencia.
5. Completar cuatro expedientes y reflexión del ejercicio 4; verificar el estado tras recargar.
6. Completar cinco frases del ejercicio 5; comprobar aviso de misión 1 superada y desbloqueo de misión 2, persistente tras cerrar y reabrir sesión.
7. Acceder simultáneamente como estudiante B en otra sesión. Confirmar que ve el progreso real del mismo equipo, que no se duplican finalizaciones y que no puede saltar pasos aún pendientes.
8. Acceder como profesor, navegar libremente por las cinco pantallas y activar cada pantalla final de vista previa. Verificar que no se crean intentos ni cambios en los estados del equipo.
9. Verificar de forma privada, sin difundir datos identificables, un estado final en gallery_team_state, bi_sistema_team_state, mission1_exercise_completions (ejercicios 3 y 5), empire_dossier_team_state, mission_completions (misión 1) y mission_badges. No debe haber finalizaciones duplicadas.

**Aprobación:** solo cuando se pruebe con login real, persistencia, roles, corrección sin pistas, concurrencia, desbloqueo de misión 2 y ausencia de escrituras en vista docente. Ni la prueba SQL ni el navegador simulado equivalen a dicha validación.

## Conservación

Ningún cambio en la base de datos, políticas RLS, imágenes, CSS, HTML, ejercicios o lógica de juego. Todos los cambios de esta auditoría son scripts y documentación en rama separada, revisables antes de integrarlos.


## Perfil de transferencia con Chromium (recursos estáticos)

También se incluye tests/browser-network-profile.mjs, ejecutado automáticamente por GitHub Actions. Desactiva JavaScript, usa caché nueva en cada pantalla y registra solicitudes de documento, CSS e imágenes. En la primera ejecución sobre el servidor HTTP local del CI, las **cinco páginas se cargaron sin solicitudes fallidas** y la transferencia sin compresión coincidió con las cifras HTML/CSS de la tabla. Se observaron **0 solicitudes separadas de imagen**: las ilustraciones contabilizadas están incrustadas en el HTML o CSS. Esto explica por qué sus bytes se transfieren junto con el documento o los estilos.

Para repetir el perfil desde Chromium contra la web publicada (recurso público, sin iniciar sesión):

    PROFILE_BASE_URL=https://aratzirakasle-lgtm.github.io/Inperialismoa/ \
    node tests/browser-network-profile.mjs

La medida de la carga estática en el servidor local de CI **no es una medida real de la latencia de un alumno**; faltan los tiempos de red y la experiencia del navegador con JavaScript y Supabase activos. No comparar tiempos de una red local con los de Internet.


## Ensayo transaccional del recorrido íntegro en Supabase · 20/11/2026

**Realizado y superado, con ROLLBACK.** A diferencia de los mocks del navegador, este ensayo ha invocado las funciones instaladas en el proyecto real `Inperialismoa`, bajo `SET LOCAL ROLE authenticated` e identidades JWT temporales. Toda la preparación (tres identidades ficticias, una clase y un equipo de ensayo), los intentos, los estados y las insignias han permanecido dentro de una única transacción que terminó en `ROLLBACK`. No se han usado contraseñas, cuentas de menores ni respuestas de alumnos.

Verificaciones positivas y negativas superadas:

- Ejercicio 1: impedir saltar al segundo; detectar asignación errónea sin completar; aceptar 20 cartelas correctas y registrar estado.
- Ejercicio 2: aceptar los siete conceptos y dos casos de interpretación; completar solo después de las dos fases.
- Ejercicio 3: rechazar una respuesta errónea; registrar la finalización con cinco respuestas válidas.
- Ejercicio 4: impedir resolver sin leer los tres documentos de cada expediente; impedir la reflexión antes de los cuatro expedientes; completar los cuatro casos y la reflexión final.
- Ejercicio 5: rechazar la respuesta errónea sin completar la misión; tras la resolución válida, registrar la misión 1, generar **una** insignia y habilitar la misión 2.
- Equipo compartido: al cambiar a una segunda identidad de alumno del mismo equipo, se conserva el estado; reenvíos posteriores no duplican intentos ni finalizaciones. También se comprobó que un alumno no puede leer la tabla de finalizaciones reservada al profesor, aunque sí observa la insignia pertinente.
- Profesor: la previsualización de expedientes funciona sin escribir; la identidad docente no puede enviar la galería ni el ejercicio 5. Un alumno no puede activar `preview=true` en el corrector de expedientes.
- Segunda misión: se aceptó un intento en la misión 2 después de completar la primera, sin dar por aprobada una entrega vacía.

Se ejecutaron aserciones adicionales sobre los registros **antes del ROLLBACK**: dos intentos de galería, dos de clasificación/interpretación, finalizaciones 3 y 5, expediente 4 terminado, una única finalización de misión 1, una única insignia y un intento de misión 2. Todas se superaron.

Después de la transacción, el inventario real siguió siendo: 3 usuarios de Auth, 3 perfiles, 1 equipo, 1 finalización histórica de misión, 1 insignia, 0 intentos de galería, 0 intentos de bi-sistema, 0 intentos de expedientes y 0 finalizaciones de ejercicios 3/5. **No se conserva ningún registro de ensayo.** Las respuestas correctas necesarias para esta prueba no se incorporan al repositorio público.

**Alcance limitado:** se ha verificado la integración secuencial y el estado compartido a nivel de base de datos, **no** la autenticación con contraseñas desde el navegador, la interacción visual de un alumno real ni dos conexiones concurrentes escribiendo exactamente al mismo tiempo. Esos aspectos siguen pendientes de una prueba con cuentas de ensayo autorizadas.

## Medición sobre GitHub Pages

Se ha añadido en la rama de auditoría un paso de GitHub Actions que ejecuta `tests/browser-network-profile.mjs --json` contra la URL pública con JavaScript desactivado. Registra transferencia y duración de carga de los recursos estáticos de las cinco pantallas sin iniciar sesión ni escribir en Supabase. Al interpretar esos resultados, distinguir siempre la medición real de la web publicada de la experiencia autenticada y los indicadores Lighthouse.


### Resultado real de GitHub Pages · GitHub Actions #250

Ejecución `44749043101` (Chromium 141 con Playwright, runner `ubuntu-24.04`), con JavaScript desactivado, caché nueva por pantalla y una pasada. Las cinco peticiones HTTP y sus hojas CSS cargaron sin peticiones fallidas:

| Pantalla | Transferencia HTTP document + CSS (KiB) | Evento `load` (ms) | Fallos |
| --- | ---: | ---: | ---: |
| Portada / galería | 292,7 | 906 | 0 |
| Bi sistema | 463,0 | 180 | 0 |
| Definizioa | 540,3 | 117 | 0 |
| Inperioen aztarnak | **3530,1** | 227 | 0 |
| Esaldiak osatu | 352,1 | 129 | 0 |

En las cinco pantallas se contaron **0 solicitudes separadas de tipo imagen**, porque las ilustraciones relevantes van incrustadas como datos en HTML/CSS. No interpretar ese cero como ausencia de imágenes.

La transferencia es menor que el tamaño de origen en la auditoría estática, pero el ejercicio 4 sigue siendo el más pesado (aprox. 3,45 MiB transferidos). Esta es **una muestra de red desde el servidor de GitHub Actions**, sin inicio de sesión ni ejecución del juego. Los milisegundos no equivalen a la latencia del alumnado, ni miden LCP, CLS o interacción. Antes de decidir una compresión es necesario contrastar percepción visual a igualdad de resolución y completar las pruebas autenticadas.


## Verificación pública con JavaScript y Supabase reales · 20/11/2026

**GitHub Actions #254, resultado SUCCESS:** <https://github.com/aratzirakasle-lgtm/Inperialismoa/actions/runs/44750608267>. Script `tests/public-live-browser-audit.mjs`, sin credenciales, sin envíos RPC y sin modificaciones de contenido.

- Tres tamaños reales de viewport de Chromium: **1365×900, 768×1024 y 390×844**.
- Tres cargas con caché aislada para la portada en cada tamaño. Mediana de LCP observada: **164 ms (ordenador), 84 ms (tableta), 88 ms (móvil)**. Mediana CLS: **0** en los tres.
- Se mostró el formulario de entrada; el botón de acceso permaneció dentro de la ventana y se comprobó **0 px de desbordamiento horizontal** de documento en los tres tamaños.
- Los ejercicios `bi-sistema.html`, `inperialismoaren-definizioa.html`, `inperioen-aztarnak.html` y `esaldiak-osatu.html` **redireccionaron a login en los tres tamaños** (12 verificaciones de acceso no autenticado superadas).
- Sin errores JavaScript, sin HTTP 4xx/5xx de recursos propios, sin escrituras RPC inesperadas.
- Evidencia visual generada: <https://github.com/aratzirakasle-lgtm/Inperialismoa/actions/runs/44750608267/artifacts/14635431138> (tres capturas de la portada).

**Alcance:** los Web Vitals observados son **solo del login desautenticado** desde un runner GitHub Actions, no de juegos con alumnos. No se ha verificado login con contraseña, persistencia de sesión real de dos alumnos ni concurrencia de dos sesiones HTTP autenticadas, por falta de cuentas exclusivas de ensayo autorizadas. No se han usado ni alterado las credenciales reales de los tres usuarios del proyecto.

### Incidencias de revisión sin intervención

- La revisión estática detecta que el **quinto ejercicio identifica visualmente los huecos erróneos** (`classList.add('error')`) después de la comprobación, y su código incluye respuestas de validación local. El ejercicio tercero también incorpora objetivos esperados en el HTML. El servidor comprueba de nuevo las respuestas y las protege mediante permisos, pero la validación local **no equivale a ocultar todas las soluciones del navegador**. Si se interpreta «sin pistas» como no identificar cuáles fallan, este comportamiento necesita una decisión pedagógica: **no se ha modificado**, para respetar el alcance de la auditoría.
- El asesor de seguridad de Supabase marca **protección de contraseñas filtradas desactivada** y 17 funciones `SECURITY DEFINER` ejecutables por usuarios autenticados. Varias forman parte deliberada del sistema de corrección y control de acceso, por lo que **el aviso no demuestra por sí solo una vulnerabilidad**. Revisión específica pendiente, sin revocar permisos ni cambiar políticas.
- El asesor de rendimiento informa sobre 13 claves externas sin índice propio. No se añaden índices: primero habría que medir consultas reales y su necesidad, evitando alterar un servicio que está funcionando.

**Resultado:** las comprobaciones disponibles no muestran regresiones de navegación, bloqueo de pantallas ni de la portada. Falta la aceptación final del recorrido real con dos alumnos y docente, que no se puede certificar sin sesiones genuinas de prueba.

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

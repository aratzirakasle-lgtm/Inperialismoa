# Intervención 3 — Validación de aula y conservación del progreso

**Fecha:** 23 de noviembre de 2026. **Ámbito:** misión 1 de Inperialismoa, ejercicios 1–5.

## Alcance y alcance real de las pruebas

- Se comprobó la conexión con el proyecto **Inperialismoa** de Supabase (entorno real).
- La base de datos cuenta con **dos perfiles de alumno asignados al mismo equipo** y **un perfil de profesor**. No se publican identidades, contraseñas ni datos académicos.
- Las **27 tablas public** consultadas tienen la protección de filas (RLS) activada.
- Se ejecutaron llamadas **a las funciones SQL reales** con contexto `authenticated` y los dos perfiles de alumno, en secuencia, alternando su identidad de sesión.
- Cada escenario SQL se ejecutó dentro de `BEGIN … ROLLBACK`: ningún borrador, lectura, finalización ni intento de prueba quedó guardado.
- Estas pruebas **no equivalen** a dos navegadores con autenticaciones reales enviando peticiones en paralelo. Las pruebas con navegador existentes usan un Supabase simulado.

## Resultados contra PostgreSQL real (transacciones revertidas)

| Área | Escenario | Resultado |
| --- | --- | --- |
| Ej. 1 · Galería | Alumno A guarda una tarjeta; alumno B intenta sobreescribirla sin la posición previa; B añade otra; profesor intenta modificar | PASA: conflicto detectado, ambos cambios compatibles presentes y docente sin escritura |
| Ej. 2 · Bi sistema | Dos alumnos mueven distintas tarjetas; cambio obsoleto de la misma tarjeta y reinicio con revisión antigua | PASA: se conservan ambas tarjetas y se rechazan conflicto y reinicio |
| Ej. 3 · Definición | Dos identidades alternadas, versiones 0, 1 y 2, borrador compartido, reinicio antiguo, control de rol docente | PASA |
| Ej. 4 · Expedientes | Alumno A lee tres documentos; duplicados; alumno B no puede ver las lecturas de A ni verificar sin leer; profesor intenta registrar lecturas | PASA: lecturas independientes y validación de fuentes |
| Ej. 5 · Frases | Dos identidades alternadas, revisión antigua, intento de envío antiguo e incompleto, profesor intenta reiniciar | PASA |
| Progreso conservado | Conteos antes y después de las pruebas | PASA: cero borradores y cero finalizaciones nuevas en las tablas auditadas; tres perfiles y un equipo intactos |

La lógica de progresión del servidor exige haber completado las salas previas para desbloquear los borradores de ejercicios 3 y 5. Las pruebas insertaron esos requisitos temporalmente **dentro de una transacción que se revirtió**.

## Fallo detectado y corregido

**Caso:** A pierde conexión al mover una tarjeta en los ejercicios 3 o 5. Mientras tanto, B guarda una **tarjeta distinta**. Al reconectarse A, su acción pendiente se descartaba automáticamente por el mero hecho de que había cambiado la revisión global del equipo.

**Corrección aplicada:**
- Si el origen de la tarjeta pendiente no cambió y su destino continúa libre, la acción se reintenta usando la revisión más reciente.
- Si el origen ha cambiado o el destino está ocupado, **no se expulsa** la tarjeta del compañero: se adopta el estado del servidor y se avisa de que hay que revisarlo.
- Se mantiene el control de revisión atómico del servidor. Los cambios en conflicto nunca se fuerzan.

Archivos:
- `js/mission1-draft-sync.js`: reconciliación al reconectar.
- `tests/mission1-classroom-browser.mjs`: dos nuevas pruebas por ejercicio (3 y 5): recuperación compatible y choque en el mismo hueco.
- `js/mission1-third-auth.js`, `js/mission1-fifth-auth.js` y los dos HTML correspondientes: invalidación de caché para cargar la versión corregida.

Los tests nuevos están incorporados al flujo CI existente en `.github/workflows/check.yml`; **no debe darse por validado su resultado** hasta consultar el estado efectivo de GitHub Actions.

## Verificaciones pendientes para cerrar el ensayo de clase real

1. Abrir **dos navegadores o perfiles distintos**, autenticados con dos **cuentas de prueba autorizadas** pertenecientes al mismo equipo, conectados a Supabase real.
2. Completar las cinco salas: cambios simultáneos de tarjetas, cambios diferentes y el mismo hueco, validaciones y desbloqueos.
3. Cerrar sesión, recargar y entrar desde el otro dispositivo: comprobar progreso ya confirmado, intentos y ausencia de dobles finalizaciones.
4. Desconectar la red de A mientras B guarda cambios; volver a conectar A y confirmar el comportamiento del borrador local y de la sincronización.
5. Entrar con una **cuenta de profesor** en otro perfil, comprobar la lectura de progresos y que la vista previa docente no modifique el equipo.
6. Verificar la ejecución completa y verde de las acciones CI tras la corrección.

**Estado:** comprobación funcional del servidor real completada en transacciones reversibles; corrección de recuperación publicada en GitHub. **Validación end-to-end con dos sesiones de navegador realmente autenticadas: pendiente**. No se han usado contraseñas de alumnos, ni se han modificado los datos de clase.

# Lista operativa para la clase del 23 de noviembre de 2026

## Alcance y estado confirmado

Se han preservado todos los equipos, usuarios, insignias antiguas, resultados, imágenes y pantallas.
La navegación de los **cinco ejercicios actuales** de la primera misión exige completar el ejercicio anterior de verdad; una insignia anterior de la misión 1 ya no permite saltarlos.
La vista del alumno del museo considera la misión 1 completada cuando existe el registro del **ejercicio 5** en `mission1_exercise_completions`; por eso abre la segunda misión en ese momento. El panel docente sigue conservando el historial previo en `mission_completions` y `mission_badges`. No se ha borrado nada de Supabase.

Verificaciones de solo lectura efectuadas el 22 de noviembre:
- Una clase y un equipo.
- Dos perfiles de estudiante asignados al equipo y un perfil de profesor.
- Las tres cuentas están confirmadas; solo **una** de las dos cuentas de alumno tiene un inicio de sesión registrado.
- Todavía no hay registros de ejecución en los estados de los juegos 1, 2, 4 ni en las finalizaciones de 3 y 5.
- Existe una insignia **histórica** de misión 1. No debe confundirse con el progreso de los cinco ejercicios nuevos.
- Las funciones de corrección de Supabase y el disparador de insignia tras completar la misión 1 existen. No se han escrito ni eliminado datos durante la revisión.

## Comprobación con cuenta de alumno real (no realizada aún)

1. Abrir [la web oficial](https://aratzirakasle-lgtm.github.io/Inperialismoa/) en una ventana privada distinta de la sesión docente.
2. Entrar con una cuenta **student** ya vinculada a un equipo. Comprobar que aparece el nombre real del equipo, sin información de otros equipos.
3. **Ejercicio 1:** colocar unas tarjetas, recargar la misma pestaña y comprobar que el borrador se recupera. Verificar respuestas, recargar y comprobar que los aciertos que haya confirmado el servidor siguen fijados. Completar las 20 tarjetas.
4. **Ejercicio 2:** clasificar los siete conceptos, comprobar sus estados y completar la interpretación final. Salir y volver para confirmar el guardado.
5. **Ejercicio 3:** resolver las cinco relaciones y abrir el cuarto ejercicio después de recibir confirmación de guardado.
6. **Ejercicio 4:** abrir los tres documentos de cada expediente **desde la misma cuenta que va a verificar**. La función de servidor registra lecturas por usuario, incluso si otros miembros pertenecen al mismo equipo. Completar los cuatro expedientes y la reflexión final.
7. **Ejercicio 5:** completar las cinco frases, verificar que aparece la pantalla de misión completada y comprobar que la segunda misión queda desbloqueada. Cerrar sesión y volver a entrar para comprobar persistencia.
8. Comprobar en el panel docente el progreso del equipo. La previsualización del profesor no puede sustituir esta prueba real.

## Para trabajar simultáneamente desde varias cuentas

- Cada alumno debe tener su propio usuario de Supabase y estar asignado al equipo correcto.
- No cerrar pestañas mientras haya un envío en curso; si aparece un error de conexión, reintentar sin cambiar los datos correctos que ya constan en el servidor.
- En el ejercicio 4, la cuenta que verifica debe abrir los tres documentos antes de contestar. Las lecturas de una cuenta no desbloquean la comprobación de otra, aunque pertenezcan al mismo equipo.
- Los aciertos de los juegos 1 y 2 se mantienen por equipo en Supabase y se consultan al volver al juego.
- **No existe todavía** una prueba de concurrencia real con dos cuentas del mismo equipo sobre el servidor: probarla antes de usar dos dispositivos a la vez.

## Condición para mañana

Las pruebas automatizadas de Chromium usan Supabase **simulado**. Confirman la interfaz y los bloqueos sin alterar producción, pero no prueban el inicio de sesión, la red del centro, los datos reales ni la convivencia entre dispositivos.

Antes de empezar, verificar que se han creado los equipos necesarios: a fecha de auditoría solo consta **un equipo**. No publicar contraseñas ni datos personales de menores. Si se necesitan más equipos, crearlos desde las herramientas docentes autorizadas y comprobar sus credenciales.

## Qué no se debe cambiar a última hora

- No ejecutar de nuevo `supabase/schema.sql` ni borrar insignias antiguas.
- No modificar soluciones, criterios de corrección, registros de alumnos ni recursos artísticos.
- Mantener los mensajes de error sin pistas históricas que revelen respuestas.
- Evitar una reestructuración masiva de CSS o imágenes antes del ensayo de cuentas reales.

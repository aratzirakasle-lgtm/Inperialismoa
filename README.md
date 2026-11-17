# INPERIALISMOA
### Plataforma educativa de misiones sobre el imperialismo (siglo XIX)

Web estática HTML/CSS/JavaScript con dos modos:

- **Demostración (activado por defecto):** alumnos y profesor ficticios, cinco misiones de tres preguntas, desbloqueo al 100 %, marcador de equipos, mapas interactivos, reserva simulada de países, panel docente y formulario de entrega PDF (simulada, sin subir ni conservar el archivo). La demostración usa almacenamiento local en el navegador: **no sincroniza equipos entre dispositivos**.
- **Supabase (requiere configurar):** cuentas individuales, datos persistentes, comprobación de respuestas en el servidor, progreso de equipos, fechas y segundos, intentos, tics en tiempo real, reservas atómicas y almacenamiento privado de entregas PDF.

## 1. Archivos

| Ruta | Uso |
| --- | --- |
| index.html | Interfaz inicial, acceso, navegación y diálogos |
| css/styles.css | Diseño adaptado a móvil y ordenador |
| js/app.js | Preguntas, progreso, mapas y paneles |
| js/config.js | Configuración pública del frontend |
| supabase/schema.sql | Tablas, datos iniciales, permisos y funciones seguras |

## 2. Probar la demostración

Abre \`index.html\` desde un servidor web local (por ejemplo, Live Server de VS Code) o activa GitHub Pages desde **Settings → Pages → Deploy from a branch → main / (root)**. GitHub Pages publicará una URL bajo \`https://<usuario>.github.io/Inperialismoa/\`.

En la página de acceso pulsa **Entrar como alumno** o **Entrar como profesor**. Las cuentas y los datos de demostración son ficticios. El alumno pertenece a **Imperio Atlas**; algunas misiones están ya superadas por otros equipos para ilustrar el marcador.

**No utilizar aún con alumnado real:** el modo demostración no incluye autenticación y no almacena PDF. Para una clase necesitas conectar Supabase y verificar las políticas.

## 3. Configurar Supabase

1. Crea un proyecto Supabase en región europea.
2. Abre **SQL Editor**, pega \`supabase/schema.sql\` y ejecútalo. Revisa primero la consulta y pruébala con un proyecto vacío de ensayo.
3. En **Project settings → API / Data API**, toma la **Project URL** y la **publishable/anon key** del proyecto. No utilices nunca la clave **service_role**, ni contraseñas administrativas, en el repositorio.
4. Edita \`js/config.js\`:
   \`\`\`js
   export const SUPABASE_URL = "https://TU-PROYECTO.supabase.co";
   export const SUPABASE_ANON_KEY = "TU-CLAVE-PUBLICABLE";
   export const DEMO_MODE = false;
   \`\`\`
5. En **Authentication → Users** crea cuentas ficticias con correos válidos y contraseñas individuales para probar. La pantalla actual inicia sesión con **correo electrónico** y contraseña; el apodo visible se obtiene de \`profiles.display_name\`.
6. Crea equipos en la tabla \`teams\`, anota sus identificadores UUID, y vincula cada usuario Auth a un registro de \`profiles\`. Para el docente establece \`role='teacher'\` y \`team_id=null\`.
7. Activa GitHub Pages, comprueba el acceso con dos navegadores distintos y prueba las políticas, la reclamación simultánea y el almacenamiento antes de inscribir estudiantes.

Ejemplo (sustituye los UUID por los de tu proyecto):
\`\`\`sql
insert into public.teams(name) values ('Equipo Atlas') returning id;
insert into public.profiles(id, display_name, role, team_id)
values ('UUID_DE_AUTH_USERS', 'Apodo del alumno', 'student', 'UUID_DEL_EQUIPO');
\`\`\`

## 4. Normas de las actividades

- Las misiones 1–5 tienen, como contenido de muestra, **tres preguntas cada una** (15 preguntas en total).
- El servidor **no permite completar una misión sin pleno**; los intentos se registran. Si hay errores, el alumno puede revisar las respuestas y volver a enviar las tres. Durante una sesión se mantienen los aciertos en la interfaz.
- La misión 6 se desbloquea al superar la misión 5. La versión inicial permite **un territorio por equipo** (reclamación irreversible para el alumno; el profesor puede liberar).
- La sexta misión queda registrada como completada cuando el equipo **ha reclamado un país y registrado una entrega PDF**.
- Los mapas muestran los países **actuales**, no fronteras coloniales históricas; esto se explica en la interfaz para evitar una equivalencia errónea.
- En modo Supabase, los PDF se guardan en bucket privado \`entregas\`, tamaño máximo 20 MiB, y los accesos están limitados por equipo/docente.

## 5. Estado y mejoras pendientes

Esta es la **primera versión funcional de pruebas**, no una plataforma escolar lista para producción. Quedan por incorporar:
- Editor docente de ejercicios desde la web, creación y restablecimiento de cuentas desde el panel, rúbrica/calificación y reentregas revisadas.
- Control granular de desbloqueos manuales.
- Persistir entre sesiones cada acierto parcial individual para que permanezca bloqueado incluso al cerrar sesión.
- Pruebas automatizadas, auditoría de accesibilidad, protección y política de tratamiento de datos del alumnado (RGPD y normas del centro).
- Separar entornos de pruebas y producción, copias de seguridad y migraciones futuras.

Las modificaciones se versionan en **GitHub**, no es necesario crear nuevos HTML descargables en la Biblioteca de ChatGPT para cada cambio.

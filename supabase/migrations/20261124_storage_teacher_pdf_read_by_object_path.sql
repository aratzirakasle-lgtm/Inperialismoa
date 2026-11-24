-- Inperialismoa · Auditoría previa al aula, 24-11-2026.
-- Corrección de descarga de PDF por docente.
-- Antes, la subconsulta SELECT de teams resolvía 'name' a teams.name,
-- no a storage.objects.name; el profesor no veía los documentos de su clase.
-- Se conserva la lectura del alumnado únicamente para la carpeta propia.
ALTER POLICY "Equipo y profesor propietario consultan PDF"
 ON storage.objects
 USING (
   bucket_id='entregas'::text AND (
     (storage.foldername(objects.name))[1]=(public.my_team())::text
     OR EXISTS (
       SELECT 1 FROM public.teams t
       WHERE t.id::text=(storage.foldername(objects.name))[1]
         AND public.teacher_owns_team(t.id)
     )
   )
 );
-- Validación en Supabase real: SELECT con roles docente y alumno sobre
-- objetos temporales, todo revertido con ROLLBACK. Sin archivos persistidos.

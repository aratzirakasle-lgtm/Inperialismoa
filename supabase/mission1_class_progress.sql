-- Inperialismoa · Progreso público mínimo de aula, Misión 1 (2026-11-23)
-- Reproducción de la migración aplicada en Supabase:
--   mission1_same_class_exercise_progress
-- Esta función no debe devolver respuestas, intentos, datos personales ni equipos
-- ajenos a la clase. No se debe reemplazar por una SELECT global sin filtro.
-- SECURITY DEFINER es necesario porque el progreso ajeno está protegido por RLS.
-- auth.uid() y el rol de profiles delimitan el acceso; no hay parámetros de entrada.
CREATE OR REPLACE FUNCTION public.mission1_class_progress()
RETURNS TABLE (
  team_id uuid, class_id uuid, team_name text,
  exercise_1 boolean, exercise_2 boolean, exercise_3 boolean,
  exercise_4 boolean, exercise_5 boolean, mission_completed boolean
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  WITH viewer AS (
    SELECT p.id, p.role, p.team_id
    FROM public.profiles AS p
    WHERE p.id = (SELECT auth.uid()) AND p.role IN ('student','teacher')
  ),
  allowed_classes AS (
    SELECT t.class_id
    FROM viewer AS v
    JOIN public.teams AS t ON t.id = v.team_id
    WHERE v.role = 'student' AND t.class_id IS NOT NULL
    UNION
    SELECT c.id
    FROM viewer AS v
    JOIN public.classes AS c ON c.teacher_id = v.id
    WHERE v.role = 'teacher'
  )
  SELECT t.id, t.class_id, t.name,
         (g.completed_at IS NOT NULL) AS exercise_1,
         (b.completed_at IS NOT NULL) AS exercise_2,
         (c3.exercise IS NOT NULL) AS exercise_3,
         (d.completed_at IS NOT NULL) AS exercise_4,
         (c5.exercise IS NOT NULL) AS exercise_5,
         (c5.exercise IS NOT NULL) AS mission_completed
  FROM allowed_classes AS ac
  JOIN public.teams AS t ON t.class_id = ac.class_id
  LEFT JOIN public.gallery_team_state AS g ON g.team_id = t.id
  LEFT JOIN public.bi_sistema_team_state AS b ON b.team_id = t.id
  LEFT JOIN public.mission1_exercise_completions AS c3 ON c3.team_id = t.id AND c3.exercise = 3
  LEFT JOIN public.empire_dossier_team_state AS d ON d.team_id = t.id
  LEFT JOIN public.mission1_exercise_completions AS c5 ON c5.team_id = t.id AND c5.exercise = 5
  ORDER BY lower(t.name),t.id;
$function$;
REVOKE ALL ON FUNCTION public.mission1_class_progress() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mission1_class_progress() TO authenticated;
COMMENT ON FUNCTION public.mission1_class_progress() IS
 'Solo nombres de equipos de la misma clase, cinco ejercicios y fin de misión confirmados. Sin datos de respuestas.';

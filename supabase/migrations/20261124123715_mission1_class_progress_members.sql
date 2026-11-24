-- Same classroom scope as the established progress RPC. Only student display names,
-- never login identifiers, passwords, roster credentials, answers or other classes.
CREATE OR REPLACE FUNCTION public.mission1_class_progress_members()
RETURNS TABLE (
 team_id uuid,class_id uuid,team_name text,
 exercise_1 boolean,exercise_2 boolean,exercise_3 boolean,
 exercise_4 boolean,exercise_5 boolean,mission_completed boolean,member_names text[]
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $function$
 SELECT s.team_id,s.class_id,s.team_name,s.exercise_1,s.exercise_2,s.exercise_3,
 s.exercise_4,s.exercise_5,s.mission_completed,
 ARRAY(SELECT btrim(p.display_name) FROM public.profiles p
       WHERE p.team_id=s.team_id AND p.role='student' AND nullif(btrim(p.display_name),'') IS NOT NULL
       ORDER BY lower(btrim(p.display_name)),p.id)
 FROM public.mission1_class_progress() s
 WHERE (SELECT public.class_access_status())
 ORDER BY lower(s.team_name),s.team_id;
$function$;
REVOKE ALL ON FUNCTION public.mission1_class_progress_members() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.mission1_class_progress_members() TO authenticated;
COMMENT ON FUNCTION public.mission1_class_progress_members() IS 'Authorized same-class progress and registered student display names, without credentials or answers.';
NOTIFY pgrst,'reload schema';
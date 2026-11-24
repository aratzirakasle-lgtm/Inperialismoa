CREATE SCHEMA IF NOT EXISTS classroom_progress_internal;
REVOKE ALL ON SCHEMA classroom_progress_internal FROM PUBLIC,anon;
GRANT USAGE ON SCHEMA classroom_progress_internal TO authenticated;
CREATE OR REPLACE FUNCTION classroom_progress_internal.mission2_class_progress_members()
RETURNS TABLE(team_id uuid,class_id uuid,team_name text,exercise_1 boolean,exercise_2 boolean,exercise_3 boolean,exercise_4 boolean,exercise_5 boolean,mission_completed boolean,member_names text[])
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $function$
 SELECT s.team_id,s.class_id,s.team_name,
 coalesce(m.e1,false),coalesce(m.e2,false),coalesce(m.e3,false),coalesce(m.e4,false),coalesce(m.e5,false),
 coalesce(m.n=5,false),s.member_names
 FROM public.mission1_class_progress_members() s
 LEFT JOIN LATERAL (
   SELECT bool_or(c.exercise=1) e1,bool_or(c.exercise=2) e2,bool_or(c.exercise=3) e3,
          bool_or(c.exercise=4) e4,bool_or(c.exercise=5) e5,count(DISTINCT c.exercise) n
   FROM public.mission2_exercise_completions c
   WHERE c.team_id=s.team_id AND c.exercise BETWEEN 1 AND 5
 ) m ON true
 WHERE (SELECT auth.uid()) IS NOT NULL
 ORDER BY lower(s.team_name),s.team_id;
$function$;
REVOKE ALL ON FUNCTION classroom_progress_internal.mission2_class_progress_members() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION classroom_progress_internal.mission2_class_progress_members() TO authenticated;
CREATE OR REPLACE FUNCTION public.mission2_class_progress_members()
RETURNS TABLE(team_id uuid,class_id uuid,team_name text,exercise_1 boolean,exercise_2 boolean,exercise_3 boolean,exercise_4 boolean,exercise_5 boolean,mission_completed boolean,member_names text[])
LANGUAGE sql STABLE SECURITY INVOKER SET search_path=''
AS $function$
 SELECT * FROM classroom_progress_internal.mission2_class_progress_members();
$function$;
REVOKE ALL ON FUNCTION public.mission2_class_progress_members() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.mission2_class_progress_members() TO authenticated;
COMMENT ON FUNCTION public.mission2_class_progress_members() IS 'Same classroom access as mission1_class_progress_members; only names and confirmed exercise flags, no answers.';
NOTIFY pgrst,'reload schema';
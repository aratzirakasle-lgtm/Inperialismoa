ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS mission2_open boolean NOT NULL DEFAULT false;
CREATE OR REPLACE FUNCTION classroom_progress_internal.mission2_access_status()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $fn$
 SELECT coalesce((SELECT CASE WHEN p.role='teacher' THEN true WHEN p.role='student' THEN coalesce(c.access_open AND c.mission2_open,false) ELSE false END
 FROM public.profiles p LEFT JOIN public.teams t ON t.id=p.team_id LEFT JOIN public.classes c ON c.id=t.class_id
 WHERE p.id=(SELECT auth.uid())),false);
$fn$;
REVOKE ALL ON FUNCTION classroom_progress_internal.mission2_access_status() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION classroom_progress_internal.mission2_access_status() TO authenticated;
CREATE OR REPLACE FUNCTION public.mission2_access_status()
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path=''
AS $fn$ SELECT classroom_progress_internal.mission2_access_status(); $fn$;
REVOKE ALL ON FUNCTION public.mission2_access_status() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.mission2_access_status() TO authenticated;
CREATE OR REPLACE FUNCTION classroom_progress_internal.teacher_set_mission2_access(p_class_id uuid,p_open boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $fn$
BEGIN
 IF p_open IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=(SELECT auth.uid()) AND role='teacher') THEN
 RAISE EXCEPTION 'Irakaslearentzat soilik' USING ERRCODE='42501'; END IF;
 UPDATE public.classes SET mission2_open=p_open WHERE id=p_class_id AND teacher_id=(SELECT auth.uid());
 IF NOT FOUND THEN RAISE EXCEPTION 'Gela ez dago baimenduta' USING ERRCODE='42501'; END IF;
 RETURN p_open;
END;
$fn$;
REVOKE ALL ON FUNCTION classroom_progress_internal.teacher_set_mission2_access(uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION classroom_progress_internal.teacher_set_mission2_access(uuid,boolean) TO authenticated;
CREATE OR REPLACE FUNCTION public.teacher_set_mission2_access(p_class_id uuid,p_open boolean)
RETURNS boolean LANGUAGE sql SECURITY INVOKER SET search_path=''
AS $fn$ SELECT classroom_progress_internal.teacher_set_mission2_access(p_class_id,p_open); $fn$;
REVOKE ALL ON FUNCTION public.teacher_set_mission2_access(uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.teacher_set_mission2_access(uuid,boolean) TO authenticated;
CREATE OR REPLACE FUNCTION private.require_mission2_access()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE v_open boolean;
BEGIN
 SELECT c.access_open AND c.mission2_open INTO v_open FROM public.profiles p
 JOIN public.teams t ON t.id=p.team_id JOIN public.classes c ON c.id=t.class_id
 WHERE p.id=(SELECT auth.uid()) AND p.role='student' FOR SHARE OF c;
 IF v_open IS TRUE THEN RETURN; END IF;
 RAISE EXCEPTION 'Bigarren misioa irakasleak irekiko du.' USING ERRCODE='42501';
END;
$fn$;
REVOKE ALL ON FUNCTION private.require_mission2_access() FROM PUBLIC,anon,authenticated;
DO $migration$
DECLARE r record; d text; n int:=0;
BEGIN
 FOR r IN SELECT p.oid FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace ns ON ns.oid=p.pronamespace
 WHERE ns.nspname='public' AND p.proname IN ('save_mission2_team_draft','submit_mission2_exercise')
 LOOP
 d:=pg_catalog.pg_get_functiondef(r.oid);
 IF position('PERFORM private.require_class_access();' IN d)=0 THEN RAISE EXCEPTION 'Missing class guard'; END IF;
 IF position('PERFORM private.require_mission2_access();' IN d)=0 THEN
 EXECUTE replace(d,'PERFORM private.require_class_access();','PERFORM private.require_class_access(); PERFORM private.require_mission2_access();');
 END IF;
 n:=n+1;
 END LOOP;
 IF n<>2 THEN RAISE EXCEPTION 'Expected two mission functions, found %',n; END IF;
END;
$migration$;
NOTIFY pgrst,'reload schema';

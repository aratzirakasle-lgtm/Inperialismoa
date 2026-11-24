ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS access_open boolean NOT NULL DEFAULT true;
CREATE OR REPLACE FUNCTION public.class_access_status()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $fn$
 SELECT coalesce((SELECT CASE WHEN p.role='teacher' THEN true
 WHEN p.role='student' THEN coalesce(c.access_open,false) ELSE false END
 FROM public.profiles p LEFT JOIN public.teams t ON t.id=p.team_id
 LEFT JOIN public.classes c ON c.id=t.class_id WHERE p.id=(SELECT auth.uid())),false);
$fn$;
REVOKE ALL ON FUNCTION public.class_access_status() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.class_access_status() TO authenticated;
CREATE OR REPLACE FUNCTION public.teacher_set_class_access(p_class_id uuid,p_open boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $fn$
BEGIN
 IF p_open IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role='teacher') THEN
 RAISE EXCEPTION 'Irakaslearentzat soilik' USING ERRCODE='42501'; END IF;
 UPDATE public.classes SET access_open=p_open WHERE id=p_class_id AND teacher_id=auth.uid();
 IF NOT FOUND THEN RAISE EXCEPTION 'Gela ez dago baimenduta' USING ERRCODE='42501'; END IF;
 RETURN p_open;
END;
$fn$;
REVOKE ALL ON FUNCTION public.teacher_set_class_access(uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.teacher_set_class_access(uuid,boolean) TO authenticated;
CREATE OR REPLACE FUNCTION private.require_class_access()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE v_role text; v_open boolean;
BEGIN
 SELECT role INTO v_role FROM public.profiles WHERE id=auth.uid();
 IF v_role='teacher' THEN RETURN; END IF;
 IF v_role='student' THEN
 SELECT c.access_open INTO v_open FROM public.profiles p JOIN public.teams t ON t.id=p.team_id
 JOIN public.classes c ON c.id=t.class_id WHERE p.id=auth.uid() FOR SHARE OF c;
 IF v_open IS TRUE THEN RETURN; END IF;
 END IF;
 RAISE EXCEPTION 'Gela itxita dago. Irakasleak ireki arte itxaron.' USING ERRCODE='42501';
END;
$fn$;
REVOKE ALL ON FUNCTION private.require_class_access() FROM PUBLIC,anon,authenticated;
DO $migration$
DECLARE r record; v_definition text; v_new text; v_count int:=0;
BEGIN
 FOR r IN SELECT p.oid,p.proname FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname IN (
 'bi_sistema_draft_import','bi_sistema_draft_move','bi_sistema_draft_reset','bi_sistema_draft_submit',
 'check_empire_dossier','check_empire_dossier_with_reading','claim_territory',
 'gallery_draft_import','gallery_draft_move','gallery_draft_reset',
 'mission1_draft_move','mission1_draft_move_checked','mission1_draft_reset','mission1_draft_submit',
 'record_empire_dossier_clue','register_submission','save_mission2_team_draft',
 'submit_bi_sistema','submit_gallery_attempt','submit_mission','submit_mission1_exercise',
 'submit_mission2_exercise','submit_shared_gallery_attempt')
 LOOP
 v_count:=v_count+1;
 v_definition:=pg_catalog.pg_get_functiondef(r.oid);
 IF position('PERFORM private.require_class_access();' IN v_definition)>0 THEN CONTINUE; END IF;
 v_new:=regexp_replace(v_definition,chr(10)||'[[:blank:]]*begin[[:blank:]'||chr(13)||']*'||chr(10),
 chr(10)||'BEGIN'||chr(10)||'  PERFORM private.require_class_access();'||chr(10),'i');
 IF v_new=v_definition THEN RAISE EXCEPTION 'Could not guard %',r.proname; END IF;
 EXECUTE v_new;
 END LOOP;
 IF v_count<>23 THEN RAISE EXCEPTION 'Expected 23 guarded functions, found %',v_count; END IF;
END;
$migration$;
DROP POLICY IF EXISTS class_access_for_pdf_upload ON storage.objects;
CREATE POLICY class_access_for_pdf_upload ON storage.objects AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK (bucket_id <> 'entregas' OR (SELECT public.class_access_status()));
NOTIFY pgrst, 'reload schema';
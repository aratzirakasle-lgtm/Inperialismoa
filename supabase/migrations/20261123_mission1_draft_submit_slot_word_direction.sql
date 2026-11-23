-- Corrección de formato, sin modificar datos ni revelar claves.
-- Mantiene submit_mission1_exercise como corrector único y autorizado.
CREATE OR REPLACE FUNCTION public.mission1_draft_submit(
  p_exercise integer,p_revision bigint
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $fn$
DECLARE
 v_user uuid:=auth.uid();
 v_team uuid:=public.my_team();
 v_places jsonb;
 v_rev bigint;
 v_result jsonb;
 v_answers jsonb;
BEGIN
 IF NOT private.m1_draft_allowed(p_exercise,v_team,v_user)
 THEN RAISE EXCEPTION 'Taldearen ariketa hau ez dago eskuragarri'; END IF;
 PERFORM pg_advisory_xact_lock(pg_catalog.hashtext(v_team::text),31505);
 SELECT placements,revision INTO v_places,v_rev
 FROM public.mission1_team_drafts
 WHERE team_id=v_team AND exercise=p_exercise FOR UPDATE;
 IF EXISTS (SELECT 1 FROM public.mission1_exercise_completions c
            WHERE c.team_id=v_team AND c.exercise=p_exercise)
 THEN RETURN jsonb_build_object('status','completed','completed',true,
      'mission_completed',p_exercise=5,'revision',coalesce(v_rev,0));
 END IF;
 IF v_rev IS NULL THEN
   RETURN jsonb_build_object('status','incomplete','completed',false,'revision',0);
 END IF;
 IF v_rev IS DISTINCT FROM p_revision
 THEN RETURN jsonb_build_object('status','conflict','placements',v_places,'revision',v_rev);
 END IF;
 IF (SELECT count(*) FROM jsonb_object_keys(v_places))<>5
 THEN RETURN jsonb_build_object('status','incomplete','revision',v_rev);
 END IF;
 -- El ejercicio 3 guarda pieza->hueco y el 5 palabra->hueco.
 -- El corrector existente del quinto exige hueco->palabra.
 -- La inversión se hace exclusivamente en el servidor.
 IF p_exercise=5 THEN
   SELECT coalesce(jsonb_object_agg(j.value,j.key),'{}'::jsonb)
     INTO v_answers FROM jsonb_each_text(v_places) AS j;
 ELSE v_answers:=v_places; END IF;
 v_result:=public.submit_mission1_exercise(p_exercise,v_answers);
 RETURN jsonb_build_object('status','checked',
   'completed',coalesce((v_result->>'completed')::boolean,false),
   'mission_completed',coalesce((v_result->>'mission_completed')::boolean,false),
   'revision',v_rev);
END $fn$;

REVOKE ALL ON FUNCTION public.mission1_draft_submit(integer,bigint) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.mission1_draft_submit(integer,bigint) TO authenticated,service_role;

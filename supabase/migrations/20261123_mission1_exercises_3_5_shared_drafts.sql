-- Misión 1 · fiabilidad de los ejercicios 3 y 5 (2026-11-23).
-- No se alteran los equipos, las respuestas ni el historial de ejercicios.
-- Los borradores se comparten dentro del equipo; las soluciones permanecen en
-- submit_mission1_exercise, ya existente en Supabase.

CREATE TABLE IF NOT EXISTS public.mission1_team_drafts (
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  exercise smallint NOT NULL CHECK (exercise IN (3,5)),
  placements jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(placements)='object'),
  revision bigint NOT NULL DEFAULT 0 CHECK (revision>=0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id),
  PRIMARY KEY(team_id,exercise)
);
ALTER TABLE public.mission1_team_drafts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mission1_team_drafts FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.mission1_team_drafts TO authenticated;
GRANT ALL ON public.mission1_team_drafts TO service_role;
DROP POLICY IF EXISTS "M1: borradores del equipo y profesor responsable" ON public.mission1_team_drafts;
CREATE POLICY "M1: borradores del equipo y profesor responsable"
ON public.mission1_team_drafts FOR SELECT TO authenticated
USING (
  team_id=(SELECT public.my_team())
  OR (SELECT public.teacher_owns_team(team_id))
);
DO $publication$
BEGIN
 IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname='supabase_realtime')
    AND NOT EXISTS (SELECT 1 FROM pg_publication_tables
      WHERE pubname='supabase_realtime' AND schemaname='public'
        AND tablename='mission1_team_drafts')
 THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.mission1_team_drafts;
 END IF;
END $publication$;

-- Función auxiliar autorizadora, en esquema no expuesto. La función no concede
-- permisos por sí sola: cada RPC vuelve a comprobar auth.uid, rol y equipo.
CREATE SCHEMA IF NOT EXISTS private;
CREATE OR REPLACE FUNCTION private.m1_draft_allowed(p_exercise integer,p_team uuid,p_user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $fn$
 SELECT p_exercise IN (3,5)
 AND p_user IS NOT NULL AND p_team IS NOT NULL
 AND EXISTS (SELECT 1 FROM public.profiles p
   WHERE p.id=p_user AND p.team_id=p_team AND p.role='student')
 AND EXISTS (SELECT 1 FROM public.gallery_team_state g
   WHERE g.team_id=p_team AND g.completed_at IS NOT NULL)
 AND EXISTS (SELECT 1 FROM public.bi_sistema_team_state b
   WHERE b.team_id=p_team AND b.completed_at IS NOT NULL)
 AND (p_exercise<>5 OR (
   EXISTS (SELECT 1 FROM public.mission1_exercise_completions c
     WHERE c.team_id=p_team AND c.exercise=3)
   AND EXISTS (SELECT 1 FROM public.empire_dossier_team_state d
     WHERE d.team_id=p_team AND d.completed_at IS NOT NULL)
 ));
$fn$;
REVOKE ALL ON FUNCTION private.m1_draft_allowed(integer,uuid,uuid) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.mission1_draft_move(
  p_exercise integer,p_item text,p_to_slot text,p_expected_slot text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $fn$
DECLARE
 v_user uuid:=auth.uid();
 v_team uuid:=public.my_team();
 v_places jsonb;
 v_rev bigint;
 v_old text;
 v_current_item text;
 v_accepted_items text[];
 v_accepted_slots text[];
BEGIN
 IF NOT private.m1_draft_allowed(p_exercise,v_team,v_user)
 THEN RAISE EXCEPTION 'Taldearen ariketa hau ez dago eskuragarri'; END IF;
 IF p_exercise=3 THEN
   v_accepted_items:=ARRAY['capital','exploit','dominion','conqueror','conquered'];
   v_accepted_slots:=ARRAY['purpose','resources','outcome','metropole','colony'];
 ELSE
   v_accepted_items:=ARRAY['koloniak','kapitalismoa','nagusitasuna','inperialismoa',
       'ustiapena','metropoliak','merkataritza','dominazioa'];
   v_accepted_slots:=ARRAY['1','2','3','4','5'];
 END IF;
 IF p_item IS NULL OR NOT (p_item=ANY(v_accepted_items))
   OR (p_to_slot IS NOT NULL AND NOT (p_to_slot=ANY(v_accepted_slots)))
   OR (p_expected_slot IS NOT NULL AND NOT (p_expected_slot=ANY(v_accepted_slots)))
 THEN RAISE EXCEPTION 'Kartela edo hutsunea baliogabea'; END IF;
 PERFORM pg_advisory_xact_lock(pg_catalog.hashtext(v_team::text),31505);
 INSERT INTO public.mission1_team_drafts(team_id,exercise,updated_by)
 VALUES(v_team,p_exercise,v_user) ON CONFLICT DO NOTHING;
 SELECT placements,revision INTO v_places,v_rev
 FROM public.mission1_team_drafts
 WHERE team_id=v_team AND exercise=p_exercise FOR UPDATE;
 IF EXISTS (SELECT 1 FROM public.mission1_exercise_completions c
            WHERE c.team_id=v_team AND c.exercise=p_exercise)
 THEN RETURN jsonb_build_object('status','completed','placements',v_places,'revision',v_rev);
 END IF;
 v_old:=v_places->>p_item;
 IF v_old IS DISTINCT FROM p_expected_slot
 THEN RETURN jsonb_build_object('status','conflict','placements',v_places,'revision',v_rev);
 END IF;
 IF v_old IS NOT DISTINCT FROM p_to_slot
 THEN RETURN jsonb_build_object('status','saved','placements',v_places,'revision',v_rev);
 END IF;
 IF p_to_slot IS NOT NULL THEN
   -- Una casilla solo admite una pieza: mover una tarjeta libera el hueco.
   FOR v_current_item IN
     SELECT key FROM jsonb_each_text(v_places)
     WHERE value=p_to_slot AND key<>p_item
   LOOP v_places:=v_places-v_current_item; END LOOP;
 END IF;
 IF p_to_slot IS NULL THEN v_places:=v_places-p_item;
 ELSE v_places:=jsonb_set(v_places,ARRAY[p_item],to_jsonb(p_to_slot),true); END IF;
 UPDATE public.mission1_team_drafts
 SET placements=v_places,revision=revision+1,updated_at=now(),updated_by=v_user
 WHERE team_id=v_team AND exercise=p_exercise RETURNING revision INTO v_rev;
 RETURN jsonb_build_object('status','saved','placements',v_places,'revision',v_rev);
END $fn$;

CREATE OR REPLACE FUNCTION public.mission1_draft_reset(p_exercise integer,p_revision bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $fn$
DECLARE
 v_user uuid:=auth.uid();
 v_team uuid:=public.my_team();
 v_places jsonb;
 v_rev bigint;
BEGIN
 IF NOT private.m1_draft_allowed(p_exercise,v_team,v_user)
 THEN RAISE EXCEPTION 'Taldearen ariketa hau ez dago eskuragarri'; END IF;
 PERFORM pg_advisory_xact_lock(pg_catalog.hashtext(v_team::text),31505);
 INSERT INTO public.mission1_team_drafts(team_id,exercise,updated_by)
 VALUES(v_team,p_exercise,v_user) ON CONFLICT DO NOTHING;
 SELECT placements,revision INTO v_places,v_rev
 FROM public.mission1_team_drafts
 WHERE team_id=v_team AND exercise=p_exercise FOR UPDATE;
 IF EXISTS (SELECT 1 FROM public.mission1_exercise_completions c
            WHERE c.team_id=v_team AND c.exercise=p_exercise)
 THEN RETURN jsonb_build_object('status','completed','placements',v_places,'revision',v_rev);
 END IF;
 IF v_rev IS DISTINCT FROM p_revision
 THEN RETURN jsonb_build_object('status','conflict','placements',v_places,'revision',v_rev);
 END IF;
 IF v_places<>'{}'::jsonb THEN
   UPDATE public.mission1_team_drafts
   SET placements='{}'::jsonb,revision=revision+1,updated_at=now(),updated_by=v_user
   WHERE team_id=v_team AND exercise=p_exercise RETURNING revision INTO v_rev;
 END IF;
 RETURN jsonb_build_object('status','saved','placements','{}'::jsonb,'revision',v_rev);
END $fn$;

-- Solo se comprueba el borrador confirmado del equipo en una revisión concreta.
-- La función de corrección original sigue siendo la única fuente de respuestas.
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
 v_result:=public.submit_mission1_exercise(p_exercise,v_places);
 RETURN jsonb_build_object('status','checked',
   'completed',coalesce((v_result->>'completed')::boolean,false),
   'mission_completed',coalesce((v_result->>'mission_completed')::boolean,false),
   'revision',v_rev);
END $fn$;

REVOKE ALL ON FUNCTION public.mission1_draft_move(integer,text,text,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.mission1_draft_reset(integer,bigint) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.mission1_draft_submit(integer,bigint) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.mission1_draft_move(integer,text,text,text) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.mission1_draft_reset(integer,bigint) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.mission1_draft_submit(integer,bigint) TO authenticated,service_role;

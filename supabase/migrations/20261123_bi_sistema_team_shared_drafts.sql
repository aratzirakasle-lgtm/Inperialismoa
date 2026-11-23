-- Segundo ejercicio de la misión 1: borrador compartido del equipo.
-- Solo el equipo puede leerlo; el docente propietario puede consultarlo,
-- pero nadie puede modificarlo directamente desde el cliente.
-- No se modifican estados, intentos ni marcas existentes.

CREATE TABLE IF NOT EXISTS public.bi_sistema_team_drafts (
  team_id uuid PRIMARY KEY REFERENCES public.teams(id) ON DELETE CASCADE,
  placements jsonb NOT NULL DEFAULT '{}'::jsonb,
  cases jsonb NOT NULL DEFAULT '{}'::jsonb,
  revision bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  CONSTRAINT bi_sistema_draft_places_object CHECK (jsonb_typeof(placements)='object'),
  CONSTRAINT bi_sistema_draft_cases_object CHECK (jsonb_typeof(cases)='object')
);
ALTER TABLE public.bi_sistema_team_drafts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.bi_sistema_team_drafts FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.bi_sistema_team_drafts TO authenticated;
GRANT ALL ON public.bi_sistema_team_drafts TO service_role;
DROP POLICY IF EXISTS "Bi sistema: borrador de equipo o profesor responsable" ON public.bi_sistema_team_drafts;
CREATE POLICY "Bi sistema: borrador de equipo o profesor responsable"
ON public.bi_sistema_team_drafts FOR SELECT TO authenticated
USING (team_id=(SELECT public.my_team()) OR (SELECT public.teacher_owns_team(team_id)));
DO $publication$
BEGIN
 IF EXISTS(SELECT 1 FROM pg_publication WHERE pubname='supabase_realtime')
    AND NOT EXISTS(
      SELECT 1 FROM pg_publication_tables
      WHERE pubname='supabase_realtime' AND schemaname='public'
        AND tablename='bi_sistema_team_drafts'
    ) THEN
   ALTER PUBLICATION supabase_realtime ADD TABLE public.bi_sistema_team_drafts;
 END IF;
END
$publication$;

CREATE OR REPLACE FUNCTION public.bi_sistema_draft_move(
  p_card_id text, p_to_zone text, p_expected_zone text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $fn$
DECLARE
 v_user uuid:=auth.uid();v_team uuid:=public.my_team();v_type text;
 v_placements jsonb;v_cases jsonb;v_rev bigint;v_before text;
 v_locked jsonb;v_cases_locked jsonb;v_finished boolean;
 v_other_count int;v_limit int;
BEGIN
 IF v_user IS NULL OR v_team IS NULL OR NOT EXISTS(
   SELECT 1 FROM public.profiles WHERE id=v_user AND team_id=v_team AND role='student'
 ) THEN RAISE EXCEPTION 'Taldeko ikasle gisa saioa hasi behar duzu';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.gallery_team_state WHERE team_id=v_team AND completed_at IS NOT NULL)
 THEN RAISE EXCEPTION 'Lehen ariketa amaitu behar duzue';END IF;
 IF p_card_id=ANY(ARRAY['army','monarch','parliament','separation','rights','suffrage','socialist']) THEN
   v_type:='classify';
 ELSIF p_card_id=ANY(ARRAY['case_monarch','case_rights']) THEN
   v_type:='interpret';
 ELSE RAISE EXCEPTION 'Kartela ezezaguna';END IF;
 IF p_to_zone IS NOT NULL AND p_to_zone NOT IN ('auth','lib')
 THEN RAISE EXCEPTION 'Areto baliogabea';END IF;
 IF p_expected_zone IS NOT NULL AND p_expected_zone NOT IN ('auth','lib')
 THEN RAISE EXCEPTION 'Aurreko aretoa baliogabea';END IF;
 PERFORM pg_advisory_xact_lock(pg_catalog.hashtext(v_team::text),22202);
 INSERT INTO public.bi_sistema_team_drafts(team_id,updated_by) VALUES(v_team,v_user)
 ON CONFLICT (team_id) DO NOTHING;
 SELECT placements,cases,revision INTO v_placements,v_cases,v_rev
 FROM public.bi_sistema_team_drafts WHERE team_id=v_team FOR UPDATE;
 SELECT coalesce(locked_ids,'[]'::jsonb),coalesce(challenge_locked,'[]'::jsonb),
        completed_at IS NOT NULL
 INTO v_locked,v_cases_locked,v_finished
 FROM public.bi_sistema_team_state WHERE team_id=v_team;
 IF coalesce(v_finished,false) THEN
   RETURN jsonb_build_object('status','completed','revision',v_rev,
     'placements',v_placements,'cases',v_cases); END IF;
 IF v_type='classify' THEN
   IF v_locked ? p_card_id OR coalesce(jsonb_array_length(v_locked),0)=7
   THEN RETURN jsonb_build_object('status','locked','revision',v_rev,
       'placements',v_placements,'cases',v_cases); END IF;
   v_before:=v_placements->>p_card_id;
 ELSE
   IF coalesce(jsonb_array_length(v_locked),0)<>7
      OR v_cases_locked ? p_card_id THEN
     RETURN jsonb_build_object('status','locked','revision',v_rev,
       'placements',v_placements,'cases',v_cases); END IF;
   v_before:=v_cases->>p_card_id;
 END IF;
 IF v_before IS DISTINCT FROM p_expected_zone THEN
   RETURN jsonb_build_object('status','conflict','revision',v_rev,
     'placements',v_placements,'cases',v_cases);END IF;
 IF v_before IS NOT DISTINCT FROM p_to_zone THEN
   RETURN jsonb_build_object('status','saved','revision',v_rev,
     'placements',v_placements,'cases',v_cases); END IF;
 IF v_type='classify' AND p_to_zone IS NOT NULL THEN
   v_limit:=CASE WHEN p_to_zone='auth' THEN 3 ELSE 4 END;
   SELECT count(*) INTO v_other_count FROM jsonb_each_text(v_placements) e
   WHERE e.key<>p_card_id AND e.value=p_to_zone;
   IF v_other_count>=v_limit THEN
     RETURN jsonb_build_object('status','full','revision',v_rev,
       'placements',v_placements,'cases',v_cases);
   END IF;
 END IF;
 IF v_type='classify' THEN
   IF p_to_zone IS NULL THEN v_placements:=v_placements-p_card_id;
   ELSE v_placements:=jsonb_set(v_placements,ARRAY[p_card_id],to_jsonb(p_to_zone),true);END IF;
 ELSE
   IF p_to_zone IS NULL THEN v_cases:=v_cases-p_card_id;
   ELSE v_cases:=jsonb_set(v_cases,ARRAY[p_card_id],to_jsonb(p_to_zone),true);END IF;
 END IF;
 UPDATE public.bi_sistema_team_drafts
 SET placements=v_placements,cases=v_cases,revision=revision+1,
     updated_at=now(),updated_by=v_user WHERE team_id=v_team
 RETURNING revision INTO v_rev;
 RETURN jsonb_build_object('status','saved','revision',v_rev,
   'placements',v_placements,'cases',v_cases);
END
$fn$;

CREATE OR REPLACE FUNCTION public.bi_sistema_draft_import(
 p_placements jsonb,p_cases jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $fn$
DECLARE
 v_user uuid:=auth.uid();v_team uuid:=public.my_team();
 v_places jsonb:=coalesce(p_placements,'{}'::jsonb);
 v_cases jsonb:=coalesce(p_cases,'{}'::jsonb);
 v_row public.bi_sistema_team_drafts%rowtype;
 v_locked jsonb;v_cases_locked jsonb;
BEGIN
 IF v_user IS NULL OR v_team IS NULL OR NOT EXISTS(
    SELECT 1 FROM public.profiles WHERE id=v_user AND team_id=v_team AND role='student'
 ) THEN RAISE EXCEPTION 'Taldeko ikaslea izan behar duzu';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.gallery_team_state WHERE team_id=v_team AND completed_at IS NOT NULL)
 THEN RAISE EXCEPTION 'Lehen ariketa amaitu behar duzue';END IF;
 IF jsonb_typeof(v_places)<>'object' OR jsonb_typeof(v_cases)<>'object'
 THEN RAISE EXCEPTION 'Borrador-formatu baliogabea';END IF;
 IF EXISTS(SELECT 1 FROM jsonb_each(v_places) x
  WHERE x.key NOT IN ('army','monarch','parliament','separation','rights','suffrage','socialist')
  OR jsonb_typeof(x.value)<>'string' OR x.value#>>'{}' NOT IN ('auth','lib'))
 OR EXISTS(SELECT 1 FROM jsonb_each(v_cases) x
  WHERE x.key NOT IN ('case_monarch','case_rights')
  OR jsonb_typeof(x.value)<>'string' OR x.value#>>'{}' NOT IN ('auth','lib'))
 THEN RAISE EXCEPTION 'Borradorreko kartela baliogabea';END IF;
 IF (SELECT count(*) FROM jsonb_each_text(v_places) e WHERE e.value='auth')>3
 OR (SELECT count(*) FROM jsonb_each_text(v_places) e WHERE e.value='lib')>4
 THEN RAISE EXCEPTION 'Aretoa beteta dago';END IF;
 PERFORM pg_advisory_xact_lock(pg_catalog.hashtext(v_team::text),22202);
 SELECT coalesce(locked_ids,'[]'::jsonb),coalesce(challenge_locked,'[]'::jsonb)
 INTO v_locked,v_cases_locked FROM public.bi_sistema_team_state WHERE team_id=v_team;
 IF EXISTS(SELECT 1 FROM jsonb_object_keys(v_places) i WHERE v_locked ? i)
 THEN RAISE EXCEPTION 'Aurretik gordetako kartelak';END IF;
 IF EXISTS(SELECT 1 FROM jsonb_object_keys(v_cases) i WHERE v_cases_locked ? i)
 THEN RAISE EXCEPTION 'Aurretik egiaztatutako egoerak';END IF;
 IF (SELECT count(*) FROM jsonb_array_elements_text(coalesce(v_locked,'[]'::jsonb)))<>7
    AND v_cases<>'{}'::jsonb THEN
   -- No son válidos casos adelantados desde un borrador local.
   v_cases:='{}'::jsonb;
 END IF;
 INSERT INTO public.bi_sistema_team_drafts(team_id,placements,cases,revision,updated_by)
 VALUES(v_team,v_places,v_cases,1,v_user) ON CONFLICT(team_id) DO NOTHING;
 SELECT * INTO v_row FROM public.bi_sistema_team_drafts WHERE team_id=v_team;
 RETURN jsonb_build_object('status',CASE WHEN v_row.revision=1 AND v_row.updated_by=v_user
       AND v_row.placements=v_places AND v_row.cases=v_cases THEN 'imported' ELSE 'exists' END,
       'revision',v_row.revision,'placements',v_row.placements,'cases',v_row.cases);
END
$fn$;

CREATE OR REPLACE FUNCTION public.bi_sistema_draft_reset(p_revision bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $fn$
DECLARE
 v_user uuid:=auth.uid();v_team uuid:=public.my_team();v_places jsonb;
 v_cases jsonb;v_revision bigint;
BEGIN
 IF v_user IS NULL OR v_team IS NULL OR NOT EXISTS(
   SELECT 1 FROM public.profiles WHERE id=v_user AND team_id=v_team AND role='student'
 ) THEN RAISE EXCEPTION 'Taldeko ikaslea izan behar duzu';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.gallery_team_state WHERE team_id=v_team AND completed_at IS NOT NULL)
 THEN RAISE EXCEPTION 'Lehen ariketa amaitu behar duzue';END IF;
 PERFORM pg_advisory_xact_lock(pg_catalog.hashtext(v_team::text),22202);
 INSERT INTO public.bi_sistema_team_drafts(team_id,updated_by) VALUES(v_team,v_user)
 ON CONFLICT(team_id) DO NOTHING;
 SELECT placements,cases,revision INTO v_places,v_cases,v_revision
 FROM public.bi_sistema_team_drafts WHERE team_id=v_team FOR UPDATE;
 IF v_revision IS DISTINCT FROM p_revision THEN
   RETURN jsonb_build_object('status','conflict','revision',v_revision,
     'placements',v_places,'cases',v_cases);END IF;
 IF v_places='{}'::jsonb AND v_cases='{}'::jsonb THEN
   RETURN jsonb_build_object('status','saved','revision',v_revision,
     'placements',v_places,'cases',v_cases);END IF;
 UPDATE public.bi_sistema_team_drafts
 SET placements='{}'::jsonb,cases='{}'::jsonb,revision=revision+1,
   updated_at=now(),updated_by=v_user WHERE team_id=v_team
 RETURNING revision INTO v_revision;
 RETURN jsonb_build_object('status','saved','revision',v_revision,
   'placements','{}'::jsonb,'cases','{}'::jsonb);
END
$fn$;

CREATE OR REPLACE FUNCTION public.bi_sistema_draft_submit(p_phase text,p_revision bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $fn$
DECLARE
 v_user uuid:=auth.uid();v_team uuid:=public.my_team();
 v_placements jsonb;v_cases jsonb;v_revision bigint;
 v_answer jsonb;v_state jsonb;
 v_expected_count int;v_number int;
BEGIN
 IF v_user IS NULL OR v_team IS NULL OR NOT EXISTS(
   SELECT 1 FROM public.profiles WHERE id=v_user AND team_id=v_team AND role='student'
 ) THEN RAISE EXCEPTION 'Taldeko ikaslea izan behar duzu';END IF;
 IF p_phase NOT IN ('classify','interpret') THEN RAISE EXCEPTION 'Fase baliogabea';END IF;
 PERFORM pg_advisory_xact_lock(pg_catalog.hashtext(v_team::text),22202);
 SELECT placements,cases,revision INTO v_placements,v_cases,v_revision
 FROM public.bi_sistema_team_drafts WHERE team_id=v_team FOR UPDATE;
 IF NOT FOUND THEN
   RAISE EXCEPTION 'Osatu kartelak egiaztatu aurretik';END IF;
 IF v_revision IS DISTINCT FROM p_revision THEN
   RETURN jsonb_build_object('status','conflict','revision',v_revision,
     'placements',v_placements,'cases',v_cases);END IF;
 v_answer:=CASE WHEN p_phase='classify' THEN v_placements ELSE v_cases END;
 v_expected_count:=CASE WHEN p_phase='classify' THEN 7 ELSE 2 END;
 SELECT count(*) INTO v_number FROM jsonb_object_keys(v_answer);
 IF v_number<>v_expected_count THEN
   RAISE EXCEPTION 'Osatu faseko erantzun guztiak egiaztatu aurretik';END IF;
 v_state:=public.submit_bi_sistema(p_phase,v_answer);
 IF coalesce((v_state->>'phase_complete')::boolean,false) THEN
   IF p_phase='classify' THEN v_placements:='{}'::jsonb;
   ELSE v_cases:='{}'::jsonb;END IF;
   UPDATE public.bi_sistema_team_drafts
   SET placements=v_placements,cases=v_cases,revision=revision+1,
       updated_at=now(),updated_by=v_user WHERE team_id=v_team
   RETURNING revision INTO v_revision;
 END IF;
 RETURN jsonb_build_object('status','checked','revision',v_revision,
   'placements',v_placements,'cases',v_cases,
   'phase_complete',coalesce((v_state->>'phase_complete')::boolean,false),
   'completed',coalesce((v_state->>'completed')::boolean,false),
   'locked',coalesce(v_state->'locked','[]'::jsonb),
   'positions',coalesce(v_state->'positions','{}'::jsonb),
   'challenge_locked',coalesce(v_state->'challenge_locked','[]'::jsonb));
END
$fn$;

REVOKE ALL ON FUNCTION public.bi_sistema_draft_move(text,text,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.bi_sistema_draft_import(jsonb,jsonb) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.bi_sistema_draft_reset(bigint) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.bi_sistema_draft_submit(text,bigint) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.bi_sistema_draft_move(text,text,text) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.bi_sistema_draft_import(jsonb,jsonb) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.bi_sistema_draft_reset(bigint) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.bi_sistema_draft_submit(text,bigint) TO authenticated,service_role;

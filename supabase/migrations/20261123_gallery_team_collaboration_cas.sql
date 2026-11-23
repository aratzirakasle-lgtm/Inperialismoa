-- Idempotent source of the live migration gallery_team_collaboration_cas_20261123.
CREATE TABLE IF NOT EXISTS public.gallery_team_drafts (
  team_id uuid PRIMARY KEY REFERENCES public.teams(id) ON DELETE CASCADE,
  placements jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(placements)='object'),
  revision bigint NOT NULL DEFAULT 0 CHECK (revision>=0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);
ALTER TABLE public.gallery_team_drafts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.gallery_team_drafts FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.gallery_team_drafts TO authenticated;
DO $policy$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public'
 AND tablename='gallery_team_drafts' AND policyname='Galeria: borrador propio o docente responsable') THEN
  CREATE POLICY "Galeria: borrador propio o docente responsable" ON public.gallery_team_drafts FOR SELECT
    TO authenticated USING (team_id=(SELECT public.my_team()) OR (SELECT public.teacher_owns_team(team_id)));
 END IF;
END $policy$;
DO $publication$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_publication WHERE pubname='supabase_realtime') AND NOT EXISTS
   (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime'
      AND schemaname='public' AND tablename='gallery_team_drafts')
 THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.gallery_team_drafts; END IF;
END $publication$;

CREATE OR REPLACE FUNCTION public.gallery_draft_import(p_placements jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_team uuid := public.my_team();
  v_places jsonb;
  v_rev bigint;
  v_ids text[] := ARRAY['eu_auth_head','eu_army','eu_monarch','eu_parliament','eu_liberal_head','eu_separation','eu_rights','eu_vote','eu_social','ru_autocracy','ru_tsar','ru_serfs','ru_ethnic','us_power','us_west','us_north','us_south','jp_meiji','jp_industry','jp_trade'];
  v_zones text[] := ARRAY['eu_auth','eu_liberal','ru','us','jp'];
  v_inserted integer;
BEGIN
  IF v_uid IS NULL OR v_team IS NULL THEN RAISE EXCEPTION 'Taldeko ikaslea izan behar duzu'; END IF;
  IF p_placements IS NULL OR jsonb_typeof(p_placements)<>'object' THEN RAISE EXCEPTION 'Borrador okerra'; END IF;
  IF (SELECT count(*) FROM jsonb_object_keys(p_placements))>20
    OR EXISTS(
       SELECT 1 FROM jsonb_each(p_placements) AS x(key,value)
       WHERE NOT (x.key=ANY(v_ids))
         OR jsonb_typeof(x.value)<>'string'
         OR NOT (x.value#>>'{}'=ANY(v_zones))
    )
  THEN RAISE EXCEPTION 'Kartel edo eremu ezezaguna'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(v_team::text),21001);
  IF EXISTS(SELECT 1 FROM public.gallery_team_state WHERE team_id=v_team AND completed_at IS NOT NULL) THEN
    RETURN jsonb_build_object('status','completed','completed',true);
  END IF;
  INSERT INTO public.gallery_team_drafts(team_id,placements,revision,updated_by)
    VALUES(v_team,p_placements,CASE WHEN p_placements='{}'::jsonb THEN 0 ELSE 1 END,v_uid)
  ON CONFLICT(team_id) DO NOTHING;
  GET DIAGNOSTICS v_inserted=ROW_COUNT;
  SELECT placements,revision INTO v_places,v_rev FROM public.gallery_team_drafts WHERE team_id=v_team;
  RETURN jsonb_build_object('status',CASE WHEN v_inserted=1 THEN 'imported' ELSE 'exists' END,
    'placements',v_places,'revision',v_rev);
END;
$function$

CREATE OR REPLACE FUNCTION public.gallery_draft_move(p_card_id text, p_to_zone text, p_expected_zone text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_team uuid := public.my_team();
  v_places jsonb;
  v_rev bigint;
  v_current text;
  v_ids text[] := ARRAY['eu_auth_head','eu_army','eu_monarch','eu_parliament','eu_liberal_head','eu_separation','eu_rights','eu_vote','eu_social','ru_autocracy','ru_tsar','ru_serfs','ru_ethnic','us_power','us_west','us_north','us_south','jp_meiji','jp_industry','jp_trade'];
  v_zones text[] := ARRAY['eu_auth','eu_liberal','ru','us','jp'];
BEGIN
  IF v_uid IS NULL OR v_team IS NULL THEN RAISE EXCEPTION 'Taldeko ikaslea izan behar duzu'; END IF;
  IF p_card_id IS NULL OR NOT (p_card_id=ANY(v_ids))
    OR (p_to_zone IS NOT NULL AND NOT (p_to_zone=ANY(v_zones)))
    OR (p_expected_zone IS NOT NULL AND NOT (p_expected_zone=ANY(v_zones)))
  THEN RAISE EXCEPTION 'Kartel edo eremu ezezaguna'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(v_team::text),21001);
  IF EXISTS(SELECT 1 FROM public.gallery_team_state WHERE team_id=v_team AND completed_at IS NOT NULL) THEN
    RETURN jsonb_build_object('status','completed','completed',true);
  END IF;
  INSERT INTO public.gallery_team_drafts(team_id,updated_by) VALUES(v_team,v_uid)
  ON CONFLICT(team_id) DO NOTHING;
  SELECT placements,revision INTO v_places,v_rev
  FROM public.gallery_team_drafts WHERE team_id=v_team FOR UPDATE;
  v_current := v_places->>p_card_id;
  IF v_current IS NOT DISTINCT FROM p_to_zone THEN
    RETURN jsonb_build_object('status','saved','placements',v_places,'revision',v_rev);
  END IF;
  IF v_current IS DISTINCT FROM p_expected_zone THEN
    RETURN jsonb_build_object('status','conflict','placements',v_places,'revision',v_rev);
  END IF;
  IF p_to_zone IS NULL THEN
    v_places := v_places-p_card_id;
  ELSE
    v_places := jsonb_set(v_places,ARRAY[p_card_id],to_jsonb(p_to_zone),true);
  END IF;
  UPDATE public.gallery_team_drafts
  SET placements=v_places,revision=v_rev+1,updated_at=now(),updated_by=v_uid
  WHERE team_id=v_team;
  RETURN jsonb_build_object('status','saved','placements',v_places,'revision',v_rev+1);
END;
$function$

CREATE OR REPLACE FUNCTION public.gallery_draft_reset(p_expected_revision bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_team uuid := public.my_team();
  v_places jsonb;
  v_rev bigint;
BEGIN
  IF v_uid IS NULL OR v_team IS NULL THEN RAISE EXCEPTION 'Taldeko ikaslea izan behar duzu'; END IF;
  IF p_expected_revision IS NULL OR p_expected_revision<0 THEN RAISE EXCEPTION 'Berrikuspen okerra'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(v_team::text),21001);
  IF EXISTS(SELECT 1 FROM public.gallery_team_state WHERE team_id=v_team AND completed_at IS NOT NULL) THEN
    RETURN jsonb_build_object('status','completed','completed',true);
  END IF;
  INSERT INTO public.gallery_team_drafts(team_id,updated_by) VALUES(v_team,v_uid)
  ON CONFLICT(team_id) DO NOTHING;
  SELECT placements,revision INTO v_places,v_rev
  FROM public.gallery_team_drafts WHERE team_id=v_team FOR UPDATE;
  IF v_rev <> p_expected_revision THEN
    RETURN jsonb_build_object('status','conflict','placements',v_places,'revision',v_rev);
  END IF;
  IF v_places='{}'::jsonb THEN
    RETURN jsonb_build_object('status','saved','placements',v_places,'revision',v_rev);
  END IF;
  UPDATE public.gallery_team_drafts
  SET placements='{}'::jsonb,revision=v_rev+1,updated_at=now(),updated_by=v_uid
  WHERE team_id=v_team;
  RETURN jsonb_build_object('status','saved','placements','{}'::jsonb,'revision',v_rev+1);
END;
$function$

CREATE OR REPLACE FUNCTION public.submit_shared_gallery_attempt(p_expected_revision bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_team uuid := public.my_team();
  v_places jsonb;
  v_rev bigint;
  v_result jsonb;
BEGIN
  IF v_uid IS NULL OR v_team IS NULL THEN RAISE EXCEPTION 'Taldeko ikaslea izan behar duzu'; END IF;
  IF p_expected_revision IS NULL OR p_expected_revision<0 THEN RAISE EXCEPTION 'Berrikuspen okerra'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(v_team::text),21001);
  IF EXISTS(SELECT 1 FROM public.gallery_team_state WHERE team_id=v_team AND completed_at IS NOT NULL) THEN
    RETURN jsonb_build_object('status','completed','completed',true);
  END IF;
  SELECT placements,revision INTO v_places,v_rev
    FROM public.gallery_team_drafts WHERE team_id=v_team FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status','incomplete','completed',false,'placements','{}'::jsonb,'revision',0);
  END IF;
  IF v_rev <> p_expected_revision THEN
    RETURN jsonb_build_object('status','conflict','completed',false,'placements',v_places,'revision',v_rev);
  END IF;
  IF (SELECT count(*) FROM jsonb_object_keys(v_places))<>20 THEN
    RETURN jsonb_build_object('status','incomplete','completed',false,'placements',v_places,'revision',v_rev);
  END IF;
  v_result := public.submit_gallery_attempt(v_places);
  RETURN v_result || jsonb_build_object('status','checked','revision',v_rev);
END;
$function$

REVOKE ALL ON FUNCTION public.gallery_draft_import(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.gallery_draft_import(jsonb) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.gallery_draft_move(text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.gallery_draft_move(text,text,text) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.gallery_draft_reset(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.gallery_draft_reset(bigint) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.submit_shared_gallery_attempt(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_shared_gallery_attempt(bigint) TO authenticated, service_role;

-- MISIÓN 2: borradores colaborativos persistentes por equipo.
-- No se almacenan soluciones, sólo las elecciones provisionales del alumnado.
BEGIN;

CREATE TABLE IF NOT EXISTS public.mission2_team_drafts (
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  exercise integer NOT NULL CHECK (exercise BETWEEN 1 AND 5),
  answers jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(answers) = 'object'),
  revision bigint NOT NULL DEFAULT 0 CHECK (revision >= 0),
  updated_by uuid REFERENCES public.profiles(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id,exercise)
);

ALTER TABLE public.mission2_team_drafts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mission2_team_drafts FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.mission2_team_drafts TO authenticated;

DROP POLICY IF EXISTS "M2 borrador visible solo para el equipo y su docente" ON public.mission2_team_drafts;
CREATE POLICY "M2 borrador visible solo para el equipo y su docente"
ON public.mission2_team_drafts FOR SELECT TO authenticated
USING (
  team_id = (SELECT public.my_team())
  OR public.teacher_owns_team(team_id)
);

CREATE OR REPLACE FUNCTION public.save_mission2_team_draft(
  p_exercise integer, p_patch jsonb, p_reset boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_team uuid := (SELECT public.my_team());
  v_previous integer;
  v_old jsonb;
  v_new jsonb;
  v_revision bigint;
BEGIN
  IF v_uid IS NULL OR v_team IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id=v_uid AND team_id=v_team AND role='student'
  ) THEN RAISE EXCEPTION 'Taldeko ikasle gisa sartu behar duzu'; END IF;
  IF p_exercise IS NULL OR p_exercise NOT BETWEEN 1 AND 5 THEN
    RAISE EXCEPTION 'Ariketa baliogabea';
  END IF;
  IF p_patch IS NULL OR jsonb_typeof(p_patch) <> 'object'
     OR pg_catalog.octet_length(p_patch::text) > 12000 THEN
    RAISE EXCEPTION 'Borradorraren formatua baliogabea';
  END IF;
  IF (p_patch ? 'assignments' AND jsonb_typeof(p_patch->'assignments')<>'object')
     OR (p_patch ? 'multi' AND jsonb_typeof(p_patch->'multi')<>'object') THEN
    RAISE EXCEPTION 'Borradorraren eremuak baliogabeak dira';
  END IF;
  -- El propio servidor comprueba que el equipo ya alcanzó este ejercicio.
  IF p_exercise = 1 AND NOT EXISTS (
    SELECT 1 FROM public.mission1_exercise_completions
    WHERE team_id=v_team AND exercise=5
  ) THEN RAISE EXCEPTION 'Lehen misioa amaitu behar da'; END IF;
  v_previous := p_exercise - 1;
  IF v_previous > 0 AND NOT EXISTS (
    SELECT 1 FROM public.mission2_exercise_completions
    WHERE team_id=v_team AND exercise=v_previous
  ) THEN RAISE EXCEPTION 'Aurreko ariketa amaitu behar da'; END IF;

  -- La escritura serializada evita que los miembros del equipo se pisen
  -- cuando actualizan tarjetas o campos distintos al mismo tiempo.
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(v_team::text), 62000 + p_exercise);
  IF EXISTS (
    SELECT 1 FROM public.mission2_exercise_completions
    WHERE team_id=v_team AND exercise=p_exercise
  ) THEN
    RETURN pg_catalog.jsonb_build_object('status','completed');
  END IF;

  INSERT INTO public.mission2_team_drafts(team_id,exercise,answers,updated_by)
  VALUES (v_team,p_exercise,'{}'::jsonb,v_uid)
  ON CONFLICT (team_id,exercise) DO NOTHING;

  SELECT answers,revision INTO v_old,v_revision
  FROM public.mission2_team_drafts
  WHERE team_id=v_team AND exercise=p_exercise
  FOR UPDATE;

  IF p_reset THEN
    v_new := '{}'::jsonb;
  ELSE
    v_new := v_old || (p_patch - 'assignments' - 'multi');
    IF p_patch ? 'assignments' THEN
      v_new := pg_catalog.jsonb_set(
        v_new, '{assignments}',
        pg_catalog.jsonb_strip_nulls(
          COALESCE(v_old->'assignments','{}'::jsonb) || (p_patch->'assignments')
        )
      );
    END IF;
    IF p_patch ? 'multi' THEN
      v_new := pg_catalog.jsonb_set(
        v_new, '{multi}',
        pg_catalog.jsonb_strip_nulls(
          COALESCE(v_old->'multi','{}'::jsonb) || (p_patch->'multi')
        )
      );
    END IF;
  END IF;
  IF pg_catalog.octet_length(v_new::text)>16000 THEN
    RAISE EXCEPTION 'Borradorra handiegia da';
  END IF;
  UPDATE public.mission2_team_drafts SET
    answers=v_new, revision=revision+1, updated_by=v_uid, updated_at=now()
  WHERE team_id=v_team AND exercise=p_exercise
  RETURNING revision INTO v_revision;

  RETURN pg_catalog.jsonb_build_object(
    'status','saved','answers',v_new,'revision',v_revision
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.save_mission2_team_draft(integer,jsonb,boolean)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_mission2_team_draft(integer,jsonb,boolean)
TO authenticated;

COMMIT;

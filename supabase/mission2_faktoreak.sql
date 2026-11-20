-- MISIÓN 2 · INPERIALISMOAREN FAKTOREAK
-- Preparación para integrar DESPUÉS de aprobar el PR y sus pruebas.
-- NO ejecutar sobre producción hasta revisar el despliegue.
-- Los aciertos residen SOLO en la tabla privada mission2_answer_keys; esta migración NO los incluye.
-- La primera misión y su presentación no se modifican.
BEGIN;

CREATE TABLE IF NOT EXISTS public.mission2_exercise_completions (
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  exercise integer NOT NULL CHECK (exercise BETWEEN 1 AND 5),
  completed_by uuid NOT NULL REFERENCES public.profiles(id),
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(team_id, exercise)
);

ALTER TABLE public.mission2_exercise_completions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mission2_exercise_completions FROM anon, authenticated;
GRANT SELECT ON public.mission2_exercise_completions TO authenticated;

DROP POLICY IF EXISTS "2. misioa: ikasleen taldeko egoera eta irakaslea" ON public.mission2_exercise_completions;
CREATE POLICY "2. misioa: ikasleen taldeko egoera eta irakaslea"
ON public.mission2_exercise_completions
FOR SELECT TO authenticated
USING (
 team_id=(SELECT public.my_team()) OR
 public.teacher_owns_team(team_id)
);

-- Tabla PRIVADA: las claves se cargan por un administrador desde Supabase
-- y NUNCA se almacenan ni se publican en GitHub.
CREATE TABLE IF NOT EXISTS public.mission2_answer_keys (
  exercise integer PRIMARY KEY CHECK (exercise BETWEEN 1 AND 5),
  expected jsonb NOT NULL CHECK (jsonb_typeof(expected)='object')
);
ALTER TABLE public.mission2_answer_keys ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mission2_answer_keys FROM PUBLIC,anon,authenticated;
-- Intencionadamente sin políticas RLS de lectura.

CREATE OR REPLACE FUNCTION public.submit_mission2_exercise(p_exercise integer,p_answers jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
 v_uid uuid:=(SELECT auth.uid());
 v_team uuid:=(SELECT public.my_team());
 v_role text;
 v_expected jsonb;
 v_previous integer;
 v_finished boolean:=false;
BEGIN
 IF v_uid IS NULL OR v_team IS NULL THEN
   RAISE EXCEPTION 'Taldeko ikasle gisa saioa hasi behar duzu';
 END IF;
 SELECT role INTO v_role FROM public.profiles
 WHERE id=v_uid AND team_id=v_team;
 IF v_role IS DISTINCT FROM 'student' THEN
   RAISE EXCEPTION 'Soilik ikasleek bidal ditzakete erantzunak';
 END IF;
 IF p_exercise IS NULL OR p_exercise NOT BETWEEN 1 AND 5 THEN
   RAISE EXCEPTION 'Ariketa baliogabea';
 END IF;
 IF p_answers IS NULL OR jsonb_typeof(p_answers)<>'object' THEN
   RAISE EXCEPTION 'Erantzunen formatua baliogabea';
 END IF;

 -- Erantzun zuzenak zerbitzariko taula pribatuan bakarrik daude.
 SELECT expected INTO v_expected
 FROM public.mission2_answer_keys WHERE exercise=p_exercise;
 IF v_expected IS NULL THEN
   RAISE EXCEPTION 'Misioaren erantzunak ez daude oraindik aktibatuta';
 END IF;

 -- Respuestas exactas, válidas y sin claves extra.
 IF (SELECT count(*) FROM jsonb_object_keys(p_answers))<>(SELECT count(*) FROM jsonb_object_keys(v_expected))
    OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_answers) AS k WHERE NOT (v_expected ? k))
    OR EXISTS(SELECT 1 FROM jsonb_each(p_answers) AS x WHERE jsonb_typeof(x.value)<>'string')
 THEN
   RAISE EXCEPTION 'Erantzun guztiak osatu behar dituzu';
 END IF;

 -- Progreso por equipos, protegido ante envíos repetidos.
 PERFORM pg_advisory_xact_lock(pg_catalog.hashtext(v_team::text),31002);

 IF NOT EXISTS(
   SELECT 1 FROM public.mission_completions
   WHERE team_id=v_team AND mission_id=1
 ) THEN
   RAISE EXCEPTION 'Lehenengo misioa amaitu behar duzue';
 END IF;
 IF EXISTS(
   SELECT 1 FROM public.mission2_exercise_completions
   WHERE team_id=v_team AND exercise=p_exercise
 ) THEN
   RETURN jsonb_build_object(
     'completed',true,
     'already_completed',true,
     'mission_completed',EXISTS(SELECT 1 FROM public.mission_completions WHERE team_id=v_team AND mission_id=2),
     'next_mission_id',CASE WHEN p_exercise=5 THEN 3 ELSE null END
   );
 END IF;
 v_previous:=p_exercise-1;
 IF v_previous>0 AND NOT EXISTS(
   SELECT 1 FROM public.mission2_exercise_completions
   WHERE team_id=v_team AND exercise=v_previous
 ) THEN
   RAISE EXCEPTION 'Aurreko ariketa amaitu behar duzue';
 END IF;

 -- Sin pistas al fallar: no se devuelven IDs incorrectos, aciertos,
 -- posiciones válidas ni explicaciones.
 IF p_answers<>v_expected THEN
   RETURN jsonb_build_object('completed',false,'mission_completed',false);
 END IF;

 INSERT INTO public.mission2_exercise_completions(team_id,exercise,completed_by)
 VALUES (v_team,p_exercise,v_uid)
 ON CONFLICT DO NOTHING;

 IF p_exercise=5 THEN
   INSERT INTO public.mission_completions(team_id,mission_id,completed_by,attempt_count)
   VALUES(v_team,2,v_uid,1)
   ON CONFLICT DO NOTHING;
   v_finished:=EXISTS(
     SELECT 1 FROM public.mission_completions
     WHERE team_id=v_team AND mission_id=2
   );
 END IF;
 RETURN jsonb_build_object(
   'completed',true,
   'mission_completed',v_finished,
   'next_mission_id',CASE WHEN p_exercise=5 THEN 3 ELSE null END
 );
END;
$function$;

REVOKE ALL ON FUNCTION public.submit_mission2_exercise(integer,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.submit_mission2_exercise(integer,jsonb) TO authenticated;

-- Evitar que el examen genérico de la misión 2 se use para saltar
-- el nuevo recorrido de cinco ejercicios. Las misiones 3-5
-- mantienen íntegra su corrección preexistente.
CREATE OR REPLACE FUNCTION public.submit_mission(p_mission_id integer,p_answers jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
 v_team uuid;
 v_q record;
 v_correct jsonb:='[]'::jsonb;
 v_incorrect jsonb:='[]'::jsonb;
 v_total integer:=0;
 v_attempt integer;
 v_attempt_id bigint;
 v_completed boolean:=false;
 v_selected integer;
BEGIN
 v_team:=public.my_team();
 IF v_team IS NULL THEN RAISE EXCEPTION 'Solo equipos de alumnos'; END IF;
 IF p_mission_id IN (1,2) THEN
   RAISE EXCEPTION 'Lehenengo bi misioak ariketa interaktiboetan osatzen dira';
 END IF;
 IF p_mission_id NOT BETWEEN 1 AND 5 THEN
   RAISE EXCEPTION 'Misión no válida';
 END IF;
 IF NOT EXISTS(
   SELECT 1 FROM public.missions WHERE id=p_mission_id AND active
 ) THEN RAISE EXCEPTION 'Misión no disponible'; END IF;
 IF p_mission_id>1 AND NOT EXISTS(
   SELECT 1 FROM public.mission_completions
   WHERE team_id=v_team AND mission_id=p_mission_id-1
 ) THEN RAISE EXCEPTION 'Misión anterior no superada'; END IF;

 PERFORM pg_advisory_xact_lock(pg_catalog.hashtext(v_team::text),p_mission_id);
 IF EXISTS(
   SELECT 1 FROM public.mission_completions WHERE team_id=v_team AND mission_id=p_mission_id
 ) THEN
   RETURN jsonb_build_object('completed',true,'correct','[]'::jsonb,'incorrect','[]'::jsonb,'attempt_count',0);
 END IF;
 IF jsonb_typeof(p_answers)<>'object' THEN RAISE EXCEPTION 'Respuestas incorrectas'; END IF;
 FOR v_q IN
  SELECT q.id,a.correct_option FROM public.questions q
  JOIN public.answer_keys a ON a.question_id=q.id
  WHERE q.mission_id=p_mission_id ORDER BY q.sort_order
 LOOP
  v_total:=v_total+1;
  IF (p_answers ? v_q.id) AND jsonb_typeof(p_answers->v_q.id)='number'
  THEN v_selected:=(p_answers->>v_q.id)::integer;
  ELSE v_selected:=null; END IF;
  IF v_selected=v_q.correct_option
  THEN v_correct:=v_correct||to_jsonb(v_q.id);
  ELSE v_incorrect:=v_incorrect||to_jsonb(v_q.id);
  END IF;
 END LOOP;
 IF v_total=0 THEN RAISE EXCEPTION 'Misión sin ejercicios'; END IF;
 INSERT INTO public.mission_attempts(team_id,mission_id,submitted_by,correct_count,question_count)
 VALUES(v_team,p_mission_id,auth.uid(),jsonb_array_length(v_correct),v_total)
 RETURNING id INTO v_attempt_id;
 INSERT INTO public.attempt_answers(attempt_id,question_id,selected_option,is_correct)
 SELECT v_attempt_id,q.id,
 CASE WHEN (p_answers ? q.id) AND jsonb_typeof(p_answers->q.id)='number'
      THEN (p_answers->>q.id)::integer ELSE null END,
 (p_answers ? q.id) AND jsonb_typeof(p_answers->q.id)='number'
 AND (p_answers->>q.id)::integer=a.correct_option
 FROM public.questions q JOIN public.answer_keys a ON a.question_id=q.id
 WHERE q.mission_id=p_mission_id;
 SELECT count(*) INTO v_attempt
 FROM public.mission_attempts WHERE team_id=v_team AND mission_id=p_mission_id;
 v_completed:=jsonb_array_length(v_correct)=v_total;
 IF v_completed THEN
  INSERT INTO public.mission_completions(team_id,mission_id,completed_by,attempt_count)
  VALUES(v_team,p_mission_id,auth.uid(),v_attempt)
  ON CONFLICT DO NOTHING;
 END IF;
 RETURN jsonb_build_object('completed',v_completed,'correct',v_correct,
                           'incorrect',v_incorrect,'attempt_count',v_attempt);
END;
$function$;

UPDATE public.missions
 SET title='Inperialismoaren faktoreak',
     subtitle='Zergatik hedatu zen inperialismoa?',
     intro='Bost ariketa interaktibotan arrazoi ekonomikoak, demografikoak, erlijiosoak, politikoak eta ideologikoak ikertuko dituzue.'
 WHERE id=2;
COMMIT;

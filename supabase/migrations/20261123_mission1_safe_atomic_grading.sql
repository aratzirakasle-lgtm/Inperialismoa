-- Fase 1: puntuación global, sin pistas por cartela. Conserva todos los datos existentes.
-- Clasificación: 7 cartelas simultáneas; interpretación: 2 situaciones simultáneas.
-- No se pierden avances previamente bloqueados por el modelo anterior.
CREATE OR REPLACE FUNCTION public.submit_bi_sistema(p_phase text,p_answers jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $m1safe$
DECLARE
 v_uid uuid := (SELECT auth.uid());
 v_team uuid := public.my_team();
 v_keys jsonb;
 v_locked jsonb;
 v_positions jsonb;
 v_challenge jsonb;
 v_completed timestamptz;
 v_wrong jsonb := '[]'::jsonb;
 v_id text; v_expected text;
 v_remaining integer; v_attempt_no integer;
 v_phase_complete boolean;
BEGIN
 IF v_uid IS NULL OR v_team IS NULL OR NOT EXISTS (
   SELECT 1 FROM public.profiles p
   WHERE p.id=v_uid AND p.team_id=v_team AND p.role='student'
 ) THEN RAISE EXCEPTION 'Taldeko ikaslea izan behar duzu'; END IF;

 IF NOT EXISTS(SELECT 1 FROM public.gallery_team_state g
               WHERE g.team_id=v_team AND g.completed_at IS NOT NULL)
    AND NOT EXISTS(SELECT 1 FROM public.mission_completions c
                   WHERE c.team_id=v_team AND c.mission_id=1)
 THEN RAISE EXCEPTION 'Lehenengo ariketa amaitu behar duzue'; END IF;
 IF p_phase IS NULL OR p_phase NOT IN ('classify','interpret') THEN
   RAISE EXCEPTION 'Fase baliogabea';
 END IF;
 IF p_answers IS NULL OR jsonb_typeof(p_answers)<>'object' THEN
   RAISE EXCEPTION 'Erantzun-formatu baliogabea';
 END IF;

 IF p_phase='classify' THEN
  v_keys:='{"army":"auth","monarch":"auth","parliament":"auth","separation":"lib","rights":"lib","suffrage":"lib","socialist":"lib"}'::jsonb;
 ELSE
  v_keys:='{"case_monarch":"auth","case_rights":"lib"}'::jsonb;
 END IF;

 PERFORM pg_advisory_xact_lock(hashtext(v_team::text),21102);
 INSERT INTO public.bi_sistema_team_state(team_id) VALUES (v_team)
 ON CONFLICT DO NOTHING;
 SELECT coalesce(locked_ids,'[]'::jsonb),coalesce(locked_positions,'{}'::jsonb),
        coalesce(challenge_locked,'[]'::jsonb),completed_at
 INTO v_locked,v_positions,v_challenge,v_completed
 FROM public.bi_sistema_team_state WHERE team_id=v_team FOR UPDATE;

 IF v_completed IS NOT NULL THEN
  RETURN jsonb_build_object('status','completed','completed',true,
    'phase_complete',true,'locked',v_locked,'positions',v_positions,
    'challenge_locked',v_challenge,'correct','[]'::jsonb,'incorrect','[]'::jsonb,
    'attempt_count',0);
 END IF;
 IF p_phase='interpret' AND jsonb_array_length(v_locked)<>7 THEN
   RAISE EXCEPTION 'Lehenik zazpi kontzeptuak sailkatu behar dituzue';
 END IF;

 v_remaining := CASE WHEN p_phase='classify'
   THEN 7-jsonb_array_length(v_locked)
   ELSE 2-jsonb_array_length(v_challenge) END;
 -- No aceptar intentos parciales: impedir deducir respuestas una a una.
 IF v_remaining<1 OR (SELECT count(*) FROM jsonb_object_keys(p_answers))<>v_remaining THEN
   RAISE EXCEPTION 'Osatu fase honetako erantzun guztiak egiaztatu aurretik';
 END IF;
 IF EXISTS(SELECT 1 FROM jsonb_each(p_answers) sent(key,value)
   WHERE NOT(v_keys ? sent.key)
     OR (p_phase='classify' AND v_locked ? sent.key)
     OR (p_phase='interpret' AND v_challenge ? sent.key)
     OR jsonb_typeof(sent.value)<>'string'
     OR sent.value#>>'{}' NOT IN ('auth','lib'))
 THEN RAISE EXCEPTION 'Erantzun ezezaguna edo baliogabea'; END IF;

 FOR v_id,v_expected IN SELECT key,value FROM jsonb_each_text(v_keys) LOOP
   IF (p_phase='classify' AND v_locked ? v_id)
      OR (p_phase='interpret' AND v_challenge ? v_id)
   THEN CONTINUE; END IF;
   IF p_answers->>v_id IS DISTINCT FROM v_expected THEN
     v_wrong := v_wrong || to_jsonb(v_id);
   END IF;
 END LOOP;
 v_phase_complete := jsonb_array_length(v_wrong)=0;

 IF v_phase_complete THEN
   IF p_phase='classify' THEN
      SELECT coalesce(jsonb_agg(k.id ORDER BY k.id),'[]'::jsonb)
      INTO v_locked FROM jsonb_object_keys(v_keys) AS k(id);
      v_positions := v_keys;
   ELSE
      v_challenge := '["case_monarch","case_rights"]'::jsonb;
      v_completed := now();
   END IF;
   UPDATE public.bi_sistema_team_state
   SET locked_ids=v_locked,locked_positions=v_positions,
       challenge_locked=v_challenge,completed_at=v_completed,updated_at=now()
   WHERE team_id=v_team;
 END IF;

 -- El profesorado conserva el historial detallado; el alumnado solo ve resultado global.
 INSERT INTO public.bi_sistema_attempts(team_id,submitted_by,phase,submitted_answers,wrong_ids,correct_count)
 VALUES(v_team,v_uid,p_phase,p_answers,v_wrong,jsonb_array_length(v_locked));
 SELECT count(*) INTO v_attempt_no FROM public.bi_sistema_attempts
 WHERE team_id=v_team AND phase=p_phase;

 RETURN jsonb_build_object(
   'status','checked','phase_complete',v_phase_complete,
   'completed',v_completed IS NOT NULL,'locked',v_locked,
   'positions',v_positions,'challenge_locked',v_challenge,
   'correct','[]'::jsonb,'incorrect','[]'::jsonb,
   'attempt_count',v_attempt_no,
   'classified_count',jsonb_array_length(v_locked));
END
$m1safe$;

-- Los ejercicios 3 y 5 dejan de exponer los identificadores fallados por RPC.
CREATE OR REPLACE FUNCTION public.submit_mission1_exercise(p_exercise integer, p_answers jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_student uuid := (select auth.uid());
  v_team uuid := public.my_team();
  v_role text;
  v_expected jsonb;
  v_wrong jsonb := '[]'::jsonb;
  v_key text;
  v_val text;
  v_completed boolean;
  v_already boolean;
begin
  if v_student is null or v_team is null then
    raise exception 'Taldeko ikasle gisa saioa hasi behar duzu';
  end if;
  select role into v_role from public.profiles where id=v_student and team_id=v_team;
  if v_role is distinct from 'student' then
    raise exception 'Soilik taldeko ikasleek gorde dezakete';
  end if;
  if p_exercise not in (3,5) or p_exercise is null then
    raise exception 'Ariketa baliogabea';
  end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    raise exception 'Erantzunen formatua baliogabea';
  end if;
  if p_exercise=3 then
    v_expected:='{"capital":"purpose","exploit":"resources","dominion":"outcome","conqueror":"metropole","conquered":"colony"}'::jsonb;
  else
    v_expected:='{"1":"inperialismoa","2":"koloniak","3":"metropoliak","4":"ustiapena","5":"nagusitasuna"}'::jsonb;
  end if;
  if (select count(*) from jsonb_object_keys(p_answers)) <> 5
     or exists(select 1 from jsonb_object_keys(p_answers) x where not(v_expected ? x))
     or exists(select 1 from jsonb_each(p_answers) x where jsonb_typeof(x.value) <> 'string')
  then raise exception 'Bost erantzun zuzenen formatua erabili behar duzu'; end if;
  perform pg_advisory_xact_lock(pg_catalog.hashtext(v_team::text), 31505);
  v_already:=exists(select 1 from public.mission1_exercise_completions
                    where team_id=v_team and exercise=p_exercise);
  if v_already then
    return jsonb_build_object('completed',true,'already_completed',true,
      'mission_completed',exists(select 1 from public.mission_completions
                    where team_id=v_team and mission_id=1),
      'next_mission_id',case when p_exercise=5 then 2 else null end);
  end if;
  if not exists(select 1 from public.gallery_team_state
         where team_id=v_team and completed_at is not null)
     or not exists(select 1 from public.bi_sistema_team_state
         where team_id=v_team and completed_at is not null)
  then raise exception 'Lehenengo bi ariketak amaitu behar dituzue'; end if;

  if p_exercise=5 then
    if not exists(select 1 from public.mission1_exercise_completions
          where team_id=v_team and exercise=3)
      or not exists(select 1 from public.empire_dossier_team_state
          where team_id=v_team and completed_at is not null)
    then raise exception 'Hirugarren eta laugarren ariketak amaitu behar dituzue'; end if;
  end if;
  for v_key,v_val in select key,value from jsonb_each_text(v_expected) loop
    if p_answers->>v_key is distinct from v_val then
      v_wrong:=v_wrong||to_jsonb(v_key);
    end if;
  end loop;
  v_completed:=jsonb_array_length(v_wrong)=0;
  if not v_completed then
    return jsonb_build_object('completed',false,'incorrect','[]'::jsonb,'mission_completed',false);
  end if;
  insert into public.mission1_exercise_completions(team_id,exercise,completed_by)
  values(v_team,p_exercise,v_student) on conflict do nothing;
  if p_exercise=5 then
    insert into public.mission_completions(team_id,mission_id,completed_by,attempt_count)
    values(v_team,1,v_student,1) on conflict do nothing;
  end if;
  return jsonb_build_object('completed',true,'incorrect','[]'::jsonb,
    'mission_completed',p_exercise=5 and exists(
       select 1 from public.mission_completions where team_id=v_team and mission_id=1),
    'next_mission_id',case when p_exercise=5 then 2 else null end);
end $function$


REVOKE ALL ON FUNCTION public.submit_bi_sistema(text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.submit_bi_sistema(text,jsonb) TO authenticated,service_role;
REVOKE ALL ON FUNCTION public.submit_mission1_exercise(integer,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.submit_mission1_exercise(integer,jsonb) TO authenticated,service_role;

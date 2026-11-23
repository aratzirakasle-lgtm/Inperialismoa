-- Validación con los dos alumnos ficticios, 2026-11-23.
-- Se elimina solo la ruta que permitía saltar ejercicios usando una
-- finalización administrativa heredada y anterior a los cinco ejercicios.
-- Se conserva la excepción para equipos que completaron el 5.º ejercicio:
-- ese registro es la prueba real y visible al alumno de que acabó la misión.
-- No se borran equipos, resultados, marcas históricas ni intentos.
-- Las funciones continúan autenticando con auth.uid() / my_team(),
-- y las tablas privadas mantienen exactamente sus políticas RLS.

-- check_empire_dossier
CREATE OR REPLACE FUNCTION public.check_empire_dossier(p_phase text, p_case_id text, p_answer text, p_preview boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 v_uid uuid:=auth.uid();
 v_role text;
 v_team uuid;
 v_expected text;
 v_detail text;
 v_solved jsonb;
 v_finished timestamptz;
 v_correct boolean;
 v_test boolean:=coalesce(p_preview,false);
begin
 if v_uid is null then raise exception 'Saioa hasi behar duzu'; end if;
 select p.role,p.team_id into v_role,v_team from public.profiles p where p.id=v_uid;
 if v_test then
   if v_role is distinct from 'teacher' then raise exception 'Irakaslearentzat soilik'; end if;
 else
   if v_role is distinct from 'student' or v_team is null or public.my_team() is distinct from v_team
   then raise exception 'Taldeko ikaslea izan behar duzu'; end if;
   if not exists(select 1 from public.bi_sistema_team_state b where b.team_id=v_team and b.completed_at is not null)
      and not exists(select 1 from public.mission1_exercise_completions m where m.team_id=v_team and m.exercise=5)
   then raise exception 'Bigarren ariketa amaitu behar duzue'; end if;
   if not exists(select 1 from public.mission1_exercise_completions e where e.team_id=v_team and e.exercise=3)
      and not exists(select 1 from public.mission1_exercise_completions c where c.team_id=v_team and c.exercise=5)
   then raise exception 'Hirugarren ariketa amaitu behar duzue'; end if;
 end if;
 if p_phase='case' then
   case p_case_id
    when 'india' then
       if p_answer not in ('uk','fr','pt') then raise exception 'Aukera baliogabea'; end if;
       v_expected:='uk';
       v_detail:='1858tik aurrera Britainiar Koroak Indiako lurralde handi baten gaineko agintea ezarri zuen. Gaur egungo mugak ez ziren berdinak.';
    when 'aljeria' then
       if p_answer not in ('uk','fr','nl') then raise exception 'Aukera baliogabea'; end if;
       v_expected:='fr';
       v_detail:='Frantziak 1830ean Aljer konkistatu zuen; kolonizazioa pixkanaka zabaldu zen eta desjabetzeak eta erresistentziak gertatu ziren.';
    when 'indonesia' then
       if p_answer not in ('nl','pt','fr') then raise exception 'Aukera baliogabea'; end if;
       v_expected:='nl';
       v_detail:='Herbehereek Javako laborantza-sistema koloniala eta esportazio ekonomikoa kontrolatu zituzten; uharteen gaineko agintea mailaka hedatu zen.';
    when 'angola' then
       if p_answer not in ('pt','uk','nl') then raise exception 'Aukera baliogabea'; end if;
       v_expected:='pt';
       v_detail:='Portugalek Angola kostaldean presentzia luzea izan zuen, eta XIX. mendearen amaieran barnealderako hedapena bultzatu zuen.';
    else raise exception 'Espediente ezezaguna';
   end case;
 elsif p_phase='reflection' then
   if p_case_id is distinct from 'final' or p_answer not in ('a','b','c')
      then raise exception 'Azken erantzun baliogabea'; end if;
   v_expected:='b';
   v_detail:='Metropoliek kontrol politikoa ezarri eta baliabideak, merkatuak eta irabaziak ustiatu zituzten. Kapitalismoaren garapenarekin lotuta dago.';
 else
   raise exception 'Ariketa mota ezezaguna';
 end if;
 v_correct:=(p_answer=v_expected);
 if v_test then
   return jsonb_build_object('correct',v_correct,'preview',true,
     'explanation',case when v_correct then v_detail else null end);
 end if;

 perform pg_advisory_xact_lock(pg_catalog.hashtext(v_team::text),31103);
 insert into public.empire_dossier_team_state(team_id) values(v_team) on conflict do nothing;
 select solved_ids,completed_at into v_solved,v_finished
 from public.empire_dossier_team_state where team_id=v_team for update;

 if p_phase='case' and v_solved ? p_case_id then
   return jsonb_build_object('correct',true,'already_solved',true,
      'solved_ids',v_solved,'completed',v_finished is not null,'explanation',v_detail);
 end if;
 if p_phase='reflection' then
   if pg_catalog.jsonb_array_length(v_solved)<>4 then
      raise exception 'Lau espedienteak lehenik osatu behar dira'; end if;
   if v_finished is not null then
      return jsonb_build_object('correct',true,'already_solved',true,'solved_ids',v_solved,
        'completed',true,'explanation',v_detail); end if;
 end if;
 insert into public.empire_dossier_attempts(team_id,submitted_by,case_id,selected_option,is_correct)
 values(v_team,v_uid,p_case_id,p_answer,v_correct);
 if v_correct then
   if p_phase='case' then
      v_solved:=v_solved||pg_catalog.to_jsonb(p_case_id);
   else
      v_finished:=now();
   end if;
   update public.empire_dossier_team_state set solved_ids=v_solved,
     completed_at=v_finished,updated_at=now() where team_id=v_team;
 end if;
 return jsonb_build_object('correct',v_correct,'solved_ids',v_solved,
   'completed',v_finished is not null,'explanation',
   case when v_correct then v_detail else null end);
end $function$;

-- record_empire_dossier_clue
CREATE OR REPLACE FUNCTION public.record_empire_dossier_clue(p_case_id text, p_clue_no integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_uid uuid:=auth.uid();v_team uuid;v_role text;v_count integer;
begin
 if p_case_id not in ('india','aljeria','indonesia','angola') or p_case_id is null or p_clue_no not between 1 and 3
 then raise exception 'Agiri baliogabea'; end if;
 if v_uid is null then raise exception 'Saioa hasi behar duzu';end if;
 select p.team_id,p.role into v_team,v_role from public.profiles p where p.id=v_uid;
 if v_role is distinct from 'student' or v_team is null or public.my_team() is distinct from v_team
 then raise exception 'Taldeko ikaslea izan behar duzu';end if;
 if not exists(select 1 from public.bi_sistema_team_state b where b.team_id=v_team and b.completed_at is not null)
 and not exists(select 1 from public.mission1_exercise_completions m where m.team_id=v_team and m.exercise=5)
 then raise exception 'Bigarren ariketa amaitu behar duzue';end if;
 if not exists(select 1 from public.mission1_exercise_completions e where e.team_id=v_team and e.exercise=3)
    and not exists(select 1 from public.mission1_exercise_completions c where c.team_id=v_team and c.exercise=5)
 then raise exception 'Hirugarren ariketa amaitu behar duzue'; end if;
 insert into public.empire_dossier_clue_reads(team_id,student_id,case_id,clue_no)
 values(v_team,v_uid,p_case_id,p_clue_no) on conflict do nothing;
 select count(*) into v_count from public.empire_dossier_clue_reads r
 where r.student_id=v_uid and r.team_id=v_team and r.case_id=p_case_id;
 return v_count;
end $function$;

-- submit_bi_sistema
CREATE OR REPLACE FUNCTION public.submit_bi_sistema(p_phase text, p_answers jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
    AND NOT EXISTS(SELECT 1 FROM public.mission1_exercise_completions c
                   WHERE c.team_id=v_team AND c.exercise=5)
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
$function$;

-- submit_mission2_exercise
CREATE OR REPLACE FUNCTION public.submit_mission2_exercise(p_exercise integer, p_answers jsonb)
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
   SELECT 1 FROM public.mission1_exercise_completions
   WHERE team_id=v_team AND exercise=5
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

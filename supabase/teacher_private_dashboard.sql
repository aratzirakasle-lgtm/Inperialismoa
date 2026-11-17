-- INPERIALISMOA / ampliación privada del seguimiento docente
-- Compatible con los equipos, alumnos y misiones ya existentes. No elimina resultados.
create table if not exists public.classes (
 id uuid primary key default gen_random_uuid(),
 name text not null check (length(name) between 2 and 100),
 school_year text not null default '2026-2027',
 teacher_id uuid not null references public.profiles(id),
 created_at timestamptz not null default now(),
 unique (teacher_id,name,school_year)
);
alter table public.classes enable row level security;
alter table public.teams add column if not exists class_id uuid references public.classes(id);
insert into public.classes(name,school_year,teacher_id)
select 'Clase de pruebas','2026-2027',p.id from public.profiles p where p.role='teacher'
on conflict (teacher_id,name,school_year) do nothing;
update public.teams t set class_id=(
 select c.id from public.classes c where c.name='Clase de pruebas' order by c.created_at limit 1
) where t.class_id is null;
-- Una clase es obligatoria para los nuevos equipos.
alter table public.teams alter column class_id set not null;
create index if not exists ix_teams_class on public.teams(class_id);

create or replace function public.teacher_owns_class(p_class uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select (select auth.uid()) is not null and exists (
 select 1 from public.classes c join public.profiles p on p.id=c.teacher_id
 where c.id=p_class and c.teacher_id=(select auth.uid()) and p.role='teacher')
$$;
create or replace function public.teacher_owns_team(p_team uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select (select auth.uid()) is not null and exists (
 select 1 from public.teams t join public.classes c on c.id=t.class_id
 join public.profiles p on p.id=c.teacher_id
 where t.id=p_team and c.teacher_id=(select auth.uid()) and p.role='teacher')
$$;
create or replace function public.same_class_team(p_team uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select (select auth.uid()) is not null and exists (
 select 1 from public.teams a join public.teams b on b.class_id=a.class_id
 where a.id=(select public.my_team()) and b.id=p_team)
$$;
revoke all on function public.teacher_owns_class(uuid),public.teacher_owns_team(uuid),public.same_class_team(uuid) from public,anon;
grant execute on function public.teacher_owns_class(uuid),public.teacher_owns_team(uuid),public.same_class_team(uuid) to authenticated;

drop policy if exists "Docente ve sus clases" on public.classes;
create policy "Docente ve sus clases" on public.classes for select to authenticated
using(public.teacher_owns_class(id));
drop policy if exists "Equipos visibles a los autenticados" on public.teams;
create policy "Equipos de tu clase" on public.teams for select to authenticated
using(public.same_class_team(id) or public.teacher_owns_class(class_id));
drop policy if exists "Perfil propio, compañeros de equipo y docente" on public.profiles;
create policy "Perfiles de alumnos limitados" on public.profiles for select to authenticated
using(id=(select auth.uid()) or (team_id is not null and team_id=public.my_team()) or (team_id is not null and public.teacher_owns_team(team_id)));
drop policy if exists "Intentos por equipo y docente" on public.mission_attempts;
create policy "Intentos solo profesor" on public.mission_attempts for select to authenticated
using(public.teacher_owns_team(team_id));
drop policy if exists "Tics de misiones compartidos entre equipos" on public.mission_completions;
create policy "Finalizaciones detalladas privadas" on public.mission_completions for select to authenticated
using(team_id=public.my_team() or public.teacher_owns_team(team_id));
drop policy if exists "Territorios compartidos" on public.territory_claims;
create policy "Territorios de tu clase" on public.territory_claims for select to authenticated
using(public.same_class_team(team_id) or public.teacher_owns_team(team_id));
drop policy if exists "Entregas propias y docente" on public.submissions;
create policy "Entregas de tu equipo o clase docente" on public.submissions for select to authenticated
using(team_id=public.my_team() or public.teacher_owns_team(team_id));

-- Tics anónimos por equipo. Nunca contienen hora, intentos, nombres personales o calificaciones.
create table if not exists public.mission_badges (
 team_id uuid not null references public.teams(id) on delete cascade,
 mission_id int not null references public.missions(id),
 primary key(team_id,mission_id)
);
alter table public.mission_badges enable row level security;
create policy "Tics de equipos de la misma clase" on public.mission_badges for select to authenticated
using(public.same_class_team(team_id) or public.teacher_owns_team(team_id));
grant select on public.mission_badges to authenticated;
revoke insert,update,delete on public.mission_badges from anon,authenticated;
insert into public.mission_badges(team_id,mission_id) select team_id,mission_id from public.mission_completions
on conflict do nothing;
create or replace function public.sync_mission_badge()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.mission_badges(team_id,mission_id) values(new.team_id,new.mission_id) on conflict do nothing;
 return new;
end $$;
drop trigger if exists mission_badge_after_completion on public.mission_completions;
create trigger mission_badge_after_completion after insert on public.mission_completions
for each row execute function public.sync_mission_badge();

-- Individualización del análisis por pregunta: solo docente; se registra únicamente la respuesta de cada envío.
create table if not exists public.attempt_answers (
 attempt_id bigint not null references public.mission_attempts(id) on delete cascade,
 question_id text not null references public.questions(id),
 selected_option int,
 is_correct boolean not null,
 primary key(attempt_id,question_id)
);
alter table public.attempt_answers enable row level security;
create policy "Respuestas detalladas solo profesor" on public.attempt_answers for select to authenticated
using(exists (select 1 from public.mission_attempts a where a.id=attempt_id and public.teacher_owns_team(a.team_id)));
grant select on public.attempt_answers to authenticated;
revoke insert,update,delete on public.attempt_answers from anon,authenticated;

-- Rúbricas: nunca se envían al alumnado, ni siquiera si pertenece al equipo evaluado.
create table if not exists public.submission_assessments (
 submission_id uuid primary key references public.submissions(id) on delete cascade,
 reviewed_by uuid not null references public.profiles(id),
 scores jsonb not null,
 score_total numeric(4,2) not null check(score_total between 0 and 10),
 teacher_comment text not null default '',
 reviewed_at timestamptz not null default now()
);
alter table public.submission_assessments enable row level security;
create policy "Rúbricas solo profesor responsable" on public.submission_assessments for select to authenticated
using(exists (
 select 1 from public.submissions s where s.id=submission_id and public.teacher_owns_team(s.team_id)));
grant select on public.submission_assessments to authenticated;
revoke insert,update,delete on public.submission_assessments from anon,authenticated;

create or replace function public.teacher_save_assessment(
 p_submission_id uuid,p_scores jsonb,p_comment text default '')
returns void language plpgsql security definer set search_path='' as $$
declare v_team uuid;v_total numeric:=0;v_key text;v_max int;v_value numeric;
begin
 select team_id into v_team from public.submissions where id=p_submission_id;
 if v_team is null or not public.teacher_owns_team(v_team) then raise exception 'No autorizado'; end if;
 if jsonb_typeof(p_scores)<>'object' or p_comment is null or length(p_comment)>2000 then raise exception 'Rúbrica incorrecta'; end if;
 if (select count(*) from jsonb_object_keys(p_scores))<>5 then raise exception 'La rúbrica requiere cinco criterios'; end if;
 for v_key,v_max in select * from (values ('rigor',3),('causas',2),('fuentes',2),('critica',2),('presentacion',1)) as limits(clave,maximo)
 loop
  if jsonb_typeof(p_scores->v_key)<>'number' then raise exception 'Puntuación inválida'; end if;
  v_value:=(p_scores->>v_key)::numeric;
  if v_value<0 or v_value>v_max or v_value<>trunc(v_value) then raise exception 'Puntuación fuera de rango'; end if;
  v_total:=v_total+v_value;
 end loop;
 insert into public.submission_assessments(submission_id,reviewed_by,scores,score_total,teacher_comment)
 values(p_submission_id,auth.uid(),p_scores,v_total,coalesce(p_comment,''))
 on conflict(submission_id) do update set
 reviewed_by=excluded.reviewed_by,scores=excluded.scores,score_total=excluded.score_total,
 teacher_comment=excluded.teacher_comment,reviewed_at=now();
end $$;
revoke all on function public.teacher_save_assessment(uuid,jsonb,text) from public,anon;
grant execute on function public.teacher_save_assessment(uuid,jsonb,text) to authenticated;

-- Clases y equipos creados únicamente por el docente propietario.
create or replace function public.teacher_create_class(p_name text,p_school_year text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if not public.is_teacher() then raise exception 'No autorizado'; end if;
 if length(trim(p_name)) not between 2 and 100 or length(trim(p_school_year)) not between 4 and 25 then
  raise exception 'Nombre o curso inválidos'; end if;
 insert into public.classes(name,school_year,teacher_id)
 values(trim(p_name),trim(p_school_year),auth.uid()) returning id into v_id;
 return v_id;
end $$;
revoke all on function public.teacher_create_class(text,text) from public,anon;
grant execute on function public.teacher_create_class(text,text) to authenticated;
create or replace function public.teacher_create_team(p_class_id uuid,p_name text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if not public.teacher_owns_class(p_class_id) then raise exception 'No autorizado'; end if;
 if length(trim(p_name)) not between 2 and 80 then raise exception 'Nombre de equipo inválido'; end if;
 insert into public.teams(name,class_id) values(trim(p_name),p_class_id) returning id into v_id;
 return v_id;
end $$;
revoke all on function public.teacher_create_team(uuid,text) from public,anon;
grant execute on function public.teacher_create_team(uuid,text) to authenticated;

-- Cambiamos el límite territorial: un país solo se puede reclamar una vez POR CLASE.
alter table public.territory_claims add column if not exists class_id uuid references public.classes(id);
update public.territory_claims c set class_id=(select t.class_id from public.teams t where t.id=c.team_id)
where c.class_id is null;
alter table public.territory_claims alter column class_id set not null;
alter table public.territory_claims drop constraint if exists territory_claims_pkey;
alter table public.territory_claims add primary key (class_id,country_code);

-- Conserva la regla de un territorio por equipo.
create or replace function public.claim_territory(p_country_code text)
returns void language plpgsql security definer set search_path='' as $$
declare v_team uuid;v_class uuid;v_allowed text[]:=array[
'DZ','AO','BJ','BW','BF','BI','CM','CV','CF','TD','KM','CD','CG','CI','DJ','EG','GQ','ER','SZ','ET','GA','GM','GH','GN','GW','KE','LS','LR','LY','MG','MW','ML','MR','MU','MA','MZ','NA','NE','NG','RW','ST','SN','SC','SL','SO','ZA','SS','SD','TZ','TG','TN','UG','ZM','ZW',
'AF','SA','AM','AZ','BH','BD','BT','BN','KH','CN','CY','GE','IN','ID','IR','IQ','IL','JP','JO','KZ','KW','KG','LA','LB','MY','MV','MN','MM','NP','KP','KR','OM','PK','PS','PH','QA','RU','SG','LK','SY','TW','TJ','TH','TL','TR','TM','AE','UZ','VN','YE'];
begin
 v_team:=public.my_team();
 select class_id into v_class from public.teams where id=v_team;
 if v_team is null or v_class is null then raise exception 'Usuario sin equipo'; end if;
 if not exists(select 1 from public.mission_completions where team_id=v_team and mission_id=5) then
  raise exception 'Supera las misiones 1 a 5'; end if;
 if not (p_country_code=any(v_allowed)) then raise exception 'País no autorizado'; end if;
 insert into public.territory_claims(country_code,team_id,class_id,claimed_by)
 values(p_country_code,v_team,v_class,auth.uid());
 exception when unique_violation then raise exception 'País ya reclamado o equipo con país asignado';
end $$;
revoke all on function public.claim_territory(text) from public,anon;
grant execute on function public.claim_territory(text) to authenticated;
create or replace function public.teacher_release_territory(p_country_code text)
returns void language plpgsql security definer set search_path='' as $$
begin
 delete from public.territory_claims
 where country_code=p_country_code and public.teacher_owns_class(class_id);
 if not found then raise exception 'Territorio no encontrado en tu clase'; end if;
end $$;
revoke all on function public.teacher_release_territory(text) from public,anon;
grant execute on function public.teacher_release_territory(text) to authenticated;

-- Registro privado de cada respuesta. Mantiene el 100 % obligatorio.
create or replace function public.submit_mission(p_mission_id int,p_answers jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_team uuid;v_q record;v_correct jsonb:='[]'::jsonb;v_incorrect jsonb:='[]'::jsonb;
 v_total int:=0;v_attempt int;v_attempt_id bigint;v_completed boolean:=false;v_selected int;
begin
 v_team:=public.my_team();
 if v_team is null then raise exception 'Solo equipos de alumnos'; end if;
 if p_mission_id not between 1 and 5 then raise exception 'Misión no válida'; end if;
 if not exists(select 1 from public.missions where id=p_mission_id and active) then raise exception 'Misión no disponible'; end if;
 if p_mission_id>1 and not exists(select 1 from public.mission_completions where team_id=v_team and mission_id=p_mission_id-1) then raise exception 'Misión anterior no superada'; end if;
 perform pg_advisory_xact_lock(hashtext(v_team::text),p_mission_id);
 if exists(select 1 from public.mission_completions where team_id=v_team and mission_id=p_mission_id) then
   return jsonb_build_object('completed',true,'correct','[]'::jsonb,'incorrect','[]'::jsonb,'attempt_count',0);
 end if;
 if jsonb_typeof(p_answers)<>'object' then raise exception 'Respuestas incorrectas'; end if;
 for v_q in select q.id,a.correct_option from public.questions q
 join public.answer_keys a on a.question_id=q.id where q.mission_id=p_mission_id order by q.sort_order
 loop
  v_total:=v_total+1;
  if (p_answers ? v_q.id) and jsonb_typeof(p_answers->v_q.id)='number' then
   v_selected:=(p_answers->>v_q.id)::int;
  else v_selected:=null; end if;
  if v_selected=v_q.correct_option then v_correct:=v_correct||to_jsonb(v_q.id);
  else v_incorrect:=v_incorrect||to_jsonb(v_q.id); end if;
 end loop;
 if v_total=0 then raise exception 'Misión sin ejercicios'; end if;
 insert into public.mission_attempts(team_id,mission_id,submitted_by,correct_count,question_count)
 values(v_team,p_mission_id,auth.uid(),jsonb_array_length(v_correct),v_total)
 returning id into v_attempt_id;
 insert into public.attempt_answers(attempt_id,question_id,selected_option,is_correct)
 select v_attempt_id,q.id,
 case when (p_answers ? q.id) and jsonb_typeof(p_answers->q.id)='number' then (p_answers->>q.id)::int else null end,
 (p_answers ? q.id) and jsonb_typeof(p_answers->q.id)='number' and
 (p_answers->>q.id)::int=a.correct_option
 from public.questions q join public.answer_keys a on a.question_id=q.id
 where q.mission_id=p_mission_id;
 select count(*) into v_attempt from public.mission_attempts where team_id=v_team and mission_id=p_mission_id;
 v_completed:=jsonb_array_length(v_correct)=v_total;
 if v_completed then
  insert into public.mission_completions(team_id,mission_id,completed_by,attempt_count)
  values(v_team,p_mission_id,auth.uid(),v_attempt) on conflict do nothing;
 end if;
 return jsonb_build_object('completed',v_completed,'correct',v_correct,'incorrect',v_incorrect,'attempt_count',v_attempt);
end $$;
revoke all on function public.submit_mission(int,jsonb) from public,anon;
grant execute on function public.submit_mission(int,jsonb) to authenticated;

-- El profesor puede consultar PDF de SUS clases, no de otras.
drop policy if exists "Equipo y docente consultan sus PDFs" on storage.objects;
create policy "Equipo y profesor propietario consultan PDF" on storage.objects for select to authenticated
using(bucket_id='entregas' and (
  (storage.foldername(name))[1]=public.my_team()::text
  or exists(select 1 from public.teams t where t.id::text=(storage.foldername(name))[1] and public.teacher_owns_team(t.id))
));

-- Evento en tiempo real: los alumnos ven badges, sin metadatos privados.
do $$ begin
 alter publication supabase_realtime add table public.mission_badges;
exception when duplicate_object then null;end $$;

-- Endurecimiento posterior: los alumnos solo reciben ticks, no registros completos.
drop policy if exists "Finalizaciones detalladas privadas" on public.mission_completions;
drop policy if exists "Solo docente consulta finalizaciones" on public.mission_completions;
create policy "Solo docente consulta finalizaciones" on public.mission_completions for select to authenticated
using(public.teacher_owns_team(team_id));
-- Las funciones trigger no son endpoints públicos.
revoke all on function public.finish_final_on_claim() from public,anon,authenticated;
revoke all on function public.sync_mission_badge() from public,anon,authenticated;
revoke all on function public.is_teacher() from public,anon;
revoke all on function public.my_team() from public,anon;
grant execute on function public.is_teacher(),public.my_team() to authenticated;
revoke all on function public.register_submission(text,text,bigint) from public,anon;
grant execute on function public.register_submission(text,text,bigint) to authenticated;

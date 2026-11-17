-- INPERIALISMOA · Esquema inicial Supabase (PostgreSQL)
-- EJECUTAR EN: Supabase > SQL Editor > New query
-- ¡Primero probar con usuarios ficticios! Nunca publicar datos personales en GitHub.
create extension if not exists pgcrypto;
create table if not exists public.teams(
  id uuid primary key default gen_random_uuid(),
  name text not null unique check(length(name) between 2 and 80),
  created_at timestamptz not null default now()
);
create table if not exists public.profiles(
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check(length(display_name) between 1 and 80),
  role text not null default 'student' check(role in ('student','teacher')),
  team_id uuid references public.teams(id),
  created_at timestamptz not null default now(),
  constraint students_need_team check (role='teacher' or team_id is not null)
);
create table if not exists public.missions(
  id int primary key check(id between 1 and 100),
  title text not null,
  subtitle text not null default '',
  intro text not null default '',
  active boolean not null default true
);
create table if not exists public.questions(
  id text primary key,
  mission_id int not null references public.missions(id) on delete cascade,
  text text not null,
  options jsonb not null check(jsonb_typeof(options)='array'),
  sort_order int not null default 0,
  unique(mission_id,sort_order)
);
-- Respuestas separadas de las preguntas públicas; lectura exclusiva del backend.
create table if not exists public.answer_keys(
  question_id text primary key references public.questions(id) on delete cascade,
  correct_option int not null check(correct_option >= 0),
  explanation text not null default ''
);
create table if not exists public.mission_attempts(
  id bigint generated always as identity primary key,
  team_id uuid not null references public.teams(id),
  mission_id int not null references public.missions(id),
  submitted_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  correct_count int not null,
  question_count int not null
);
create table if not exists public.mission_completions(
  team_id uuid not null references public.teams(id),
  mission_id int not null references public.missions(id),
  completed_by uuid not null references public.profiles(id),
  completed_at timestamptz not null default now(),
  attempt_count int not null default 1,
  primary key(team_id,mission_id)
);
create table if not exists public.territory_claims(
  country_code text primary key check(country_code ~ '^[A-Z]{2}$'),
  team_id uuid not null unique references public.teams(id),
  claimed_by uuid not null references public.profiles(id),
  claimed_at timestamptz not null default now()
);
create table if not exists public.submissions(
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id),
  submitted_by uuid not null references public.profiles(id),
  file_path text not null unique,
  filename text not null,
  file_size bigint not null check(file_size between 1 and 20971520),
  created_at timestamptz not null default now(),
  status text not null default 'Pendiente de revisión',
  feedback text
);
create index if not exists idx_progress_mission on public.mission_completions(mission_id);
create index if not exists idx_attempts_team on public.mission_attempts(team_id,mission_id,created_at);
create index if not exists idx_submissions_team on public.submissions(team_id,created_at);

-- Vistas públicas para los alumnos autenticados: ¡no contienen claves de respuestas!
create or replace view public.public_questions with (security_invoker=true) as
select id,mission_id,text,options,sort_order from public.questions;

create or replace function public.is_teacher()
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.profiles where id=(select auth.uid()) and role='teacher')
$$;
create or replace function public.my_team()
returns uuid language sql stable security definer set search_path='' as $$
  select team_id from public.profiles where id=(select auth.uid()) and role='student'
$$;
revoke all on function public.is_teacher() from public;
revoke all on function public.my_team() from public;
grant execute on function public.is_teacher() to authenticated;
grant execute on function public.my_team() to authenticated;

alter table public.teams enable row level security;
alter table public.profiles enable row level security;
alter table public.missions enable row level security;
alter table public.questions enable row level security;
alter table public.answer_keys enable row level security;
alter table public.mission_attempts enable row level security;
alter table public.mission_completions enable row level security;
alter table public.territory_claims enable row level security;
alter table public.submissions enable row level security;

create policy "Equipos visibles a los autenticados" on public.teams for select to authenticated using(true);
create policy "Perfil propio, compañeros de equipo y docente" on public.profiles for select to authenticated
  using(id=(select auth.uid()) or public.is_teacher() or (team_id is not null and team_id=public.my_team()));
create policy "Misiones visibles" on public.missions for select to authenticated using(active or public.is_teacher());
create policy "Preguntas sin claves visibles" on public.questions for select to authenticated using(
  exists(select 1 from public.missions m where m.id=mission_id and m.active)
);
-- No crear políticas de lectura sobre answer_keys: solo las funciones SECURITY DEFINER las leen.
create policy "Intentos por equipo y docente" on public.mission_attempts for select to authenticated
  using(team_id=public.my_team() or public.is_teacher());
create policy "Tics de misiones compartidos entre equipos" on public.mission_completions for select to authenticated using(true);
create policy "Territorios compartidos" on public.territory_claims for select to authenticated using(true);
create policy "Entregas propias y docente" on public.submissions for select to authenticated
  using(team_id=public.my_team() or public.is_teacher());

-- Nunca permitir escrituras directas del cliente a tablas sensibles.
revoke all on public.answer_keys from anon,authenticated;
grant select on public.teams,public.profiles,public.missions,public.questions,public.public_questions,
public.mission_attempts,public.mission_completions,public.territory_claims,public.submissions to authenticated;
revoke insert,update,delete on public.teams,public.profiles,public.missions,public.questions,
public.mission_attempts,public.mission_completions,public.territory_claims,public.submissions from anon,authenticated;

-- Corrección exclusivamente en servidor; conserva los aciertos aunque se reenvíe una respuesta fallida.
create or replace function public.submit_mission(p_mission_id int,p_answers jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  v_team uuid;
  v_q record;
  v_correct jsonb:='[]'::jsonb;
  v_incorrect jsonb:='[]'::jsonb;
  v_total int:=0;
  v_attempt int;
  v_completed boolean:=false;
begin
  v_team:=public.my_team();
  if v_team is null then raise exception 'Solo pueden participar alumnos de equipos'; end if;
  if p_mission_id not between 1 and 5 then raise exception 'Misión no válida'; end if;
  if not exists(select 1 from public.missions where id=p_mission_id and active) then raise exception 'Misión no disponible'; end if;
  if p_mission_id>1 and not exists(select 1 from public.mission_completions where team_id=v_team and mission_id=p_mission_id-1) then raise exception 'Misión anterior no superada'; end if;
  if exists(select 1 from public.mission_completions where team_id=v_team and mission_id=p_mission_id) then
    return jsonb_build_object('completed',true,'correct','[]'::jsonb,'incorrect','[]'::jsonb,'attempt_count',0);
  end if;
  for v_q in
    select q.id,a.correct_option from public.questions q
    join public.answer_keys a on a.question_id=q.id
    where q.mission_id=p_mission_id order by q.sort_order
  loop
    v_total:=v_total+1;
    if p_answers ? v_q.id and jsonb_typeof(p_answers->v_q.id)='number' and (p_answers->>v_q.id)::int=v_q.correct_option then
      v_correct:=v_correct||to_jsonb(v_q.id);
    else
      v_incorrect:=v_incorrect||to_jsonb(v_q.id);
    end if;
  end loop;
  if v_total=0 then raise exception 'La misión no contiene ejercicios'; end if;
  -- Bloqueo por equipo y misión: evita carreras y registra un orden coherente.
  perform pg_advisory_xact_lock(hashtext(v_team::text),p_mission_id);
  insert into public.mission_attempts(team_id,mission_id,submitted_by,correct_count,question_count)
  values(v_team,p_mission_id,auth.uid(),jsonb_array_length(v_correct),v_total);
  select count(*) into v_attempt from public.mission_attempts where team_id=v_team and mission_id=p_mission_id;
  v_completed:=jsonb_array_length(v_correct)=v_total;
  if v_completed then
    insert into public.mission_completions(team_id,mission_id,completed_by,attempt_count)
    values(v_team,p_mission_id,auth.uid(),v_attempt)
    on conflict (team_id,mission_id) do nothing;
  end if;
  return jsonb_build_object('completed',v_completed,'correct',v_correct,'incorrect',v_incorrect,'attempt_count',v_attempt);
end
$$;
revoke all on function public.submit_mission(int,jsonb) from public;
grant execute on function public.submit_mission(int,jsonb) to authenticated;

-- Primera versión: UN territorio por equipo. Único por país Y por equipo, atómico.
create or replace function public.claim_territory(p_country_code text)
returns void language plpgsql security definer set search_path='' as $$
declare
 v_team uuid;
 v_allowed text[]:=array['DZ','AO','BJ','BW','BF','BI','CM','CV','CF','TD','KM','CD','CG','CI','DJ','EG','GQ','ER','SZ','ET','GA','GM','GH','GN','GW','KE','LS','LR','LY','MG','MW','ML','MR','MU','MA','MZ','NA','NE','NG','RW','ST','SN','SC','SL','SO','ZA','SS','SD','TZ','TG','TN','UG','ZM','ZW','AF','SA','AM','AZ','BH','BD','BT','BN','KH','CN','CY','GE','IN','ID','IR','IQ','IL','JP','JO','KZ','KW','KG','LA','LB','MY','MV','MN','MM','NP','KP','KR','OM','PK','PS','PH','QA','RU','SG','LK','SY','TW','TJ','TH','TL','TR','TM','AE','UZ','VN','YE'];
begin
 v_team:=public.my_team();
 if v_team is null then raise exception 'Usuario sin equipo'; end if;
 if not exists(select 1 from public.mission_completions where team_id=v_team and mission_id=5) then raise exception 'Supera las misiones 1 a 5 antes de elegir'; end if;
 if not(p_country_code=any(v_allowed)) then raise exception 'País no autorizado'; end if;
 insert into public.territory_claims(country_code,team_id,claimed_by) values(p_country_code,v_team,auth.uid());
 exception when unique_violation then raise exception 'País ya reclamado o equipo con país asignado';
end
$$;
revoke all on function public.claim_territory(text) from public;
grant execute on function public.claim_territory(text) to authenticated;

create or replace function public.teacher_release_territory(p_country_code text)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.is_teacher() then raise exception 'Solo el profesorado puede liberar territorios'; end if;
 delete from public.territory_claims where country_code=p_country_code;
end
$$;
revoke all on function public.teacher_release_territory(text) from public;
grant execute on function public.teacher_release_territory(text) to authenticated;

-- Los archivos permanecen privados. Solo el equipo propietario puede subir; docente/propietarios leen.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('entregas','entregas',false,20971520,array['application/pdf'])
on conflict(id) do update set public=false,file_size_limit=20971520,allowed_mime_types=array['application/pdf'];
create policy "Equipo sube PDF a su carpeta" on storage.objects for insert to authenticated
 with check(bucket_id='entregas' and (storage.foldername(name))[1]=public.my_team()::text);
create policy "Equipo y docente consultan sus PDFs" on storage.objects for select to authenticated
 using(bucket_id='entregas' and ((storage.foldername(name))[1]=public.my_team()::text or public.is_teacher()));
create or replace function public.register_submission(p_path text,p_filename text,p_size bigint)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_team uuid;v_id uuid;
begin
 v_team:=public.my_team();
 if v_team is null then raise exception 'Usuario sin equipo'; end if;
 if not exists(select 1 from public.mission_completions where team_id=v_team and mission_id=5) then raise exception 'Desafío final bloqueado'; end if;
 if p_size<1 or p_size>20971520 or p_filename !~* '\.pdf$' or p_path not like v_team::text||'/%' then raise exception 'PDF inválido'; end if;
 if not exists(select 1 from storage.objects where bucket_id='entregas' and name=p_path) then raise exception 'Archivo no encontrado'; end if;
 insert into public.submissions(team_id,submitted_by,file_path,filename,file_size)
 values(v_team,auth.uid(),p_path,p_filename,p_size) returning id into v_id;
 -- La sexta misión se completa cuando se han cumplido las dos condiciones.
 if exists(select 1 from public.territory_claims where team_id=v_team) then
   insert into public.mission_completions(team_id,mission_id,completed_by,attempt_count)
   values(v_team,6,auth.uid(),1) on conflict do nothing;
 end if;
 return v_id;
end
$$;
revoke all on function public.register_submission(text,text,bigint) from public;
grant execute on function public.register_submission(text,text,bigint) to authenticated;

-- Si se entrega antes de reclamar país, la reclamación completa automáticamente la misión 6.
create or replace function public.finish_final_on_claim()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from public.submissions where team_id=new.team_id) then
  insert into public.mission_completions(team_id,mission_id,completed_by,attempt_count)
  values(new.team_id,6,new.claimed_by,1) on conflict do nothing;
 end if;
 return new;
end
$$;
drop trigger if exists finish_final_on_claim on public.territory_claims;
create trigger finish_final_on_claim after insert on public.territory_claims for each row execute function public.finish_final_on_claim();

-- Realtime: los clientes autenticados escuchan cambios, protegidos por RLS.
do $$begin
  alter publication supabase_realtime add table public.mission_completions;
exception when duplicate_object then null; end$$;
do $$begin
  alter publication supabase_realtime add table public.territory_claims;
exception when duplicate_object then null; end$$;
do $$begin
  alter publication supabase_realtime add table public.submissions;
exception when duplicate_object then null; end$$;

-- Contenido inicial: cinco misiones evaluables + una final.
insert into public.missions(id,title,subtitle,intro) values
(1,'¿Por qué expandirse?','Las causas del imperialismo','Investiga las razones económicas, políticas y culturales que impulsaron la expansión imperial europea.'),
(2,'El reparto de África','La Conferencia de Berlín','Analiza cómo las potencias europeas establecieron reglas para expandir su dominio sin participación de los pueblos africanos.'),
(3,'Los imperios coloniales','Potencias y territorios','Reconoce la distribución desigual de poder entre distintos imperios y territorios dominados.'),
(4,'Voces de las colonias','Fuentes e impactos','Examina cómo la colonización transformó vidas, recursos, trabajo y culturas, considerando perspectivas colonizadas.'),
(5,'Resistencias y consecuencias','Conflictos y legados','Descubre las respuestas de las poblaciones colonizadas y reflexiona sobre los legados del imperialismo.'),
(6,'El desafío final','Mapas, elección y presentación','Una simulación crítica para debatir el reparto colonial. Reclamad un país disponible y entregad una presentación en PDF.')
on conflict(id) do update set title=excluded.title,subtitle=excluded.subtitle,intro=excluded.intro;

insert into public.questions(id,mission_id,text,options,sort_order) values
('a1',1,'¿Qué buscaban obtener las potencias industriales en las colonias?','["Materias primas y nuevos mercados","El cierre de sus fábricas","El fin del comercio exterior"]',1),
('a2',1,'¿Qué motivación política favoreció la expansión colonial?','["La desaparición del nacionalismo","El prestigio y la rivalidad entre potencias","La abolición de los Estados europeos"]',2),
('a3',1,'¿Qué idea se utilizó para justificar ideológicamente la dominación?','["La igualdad efectiva de todos los pueblos","La superioridad racial y la supuesta misión civilizadora","La autodeterminación colonial"]',3),
('b1',2,'¿En qué años se celebró la Conferencia de Berlín?','["1789–1791","1884–1885","1919–1920"]',1),
('b2',2,'¿Participaron representantes de las sociedades africanas en las decisiones?','["Sí, con el mismo poder que Europa","No, fueron excluidos de las negociaciones","Sí, como únicos participantes"]',2),
('b3',2,'¿Qué principio favoreció el reconocimiento de nuevas posesiones costeras?','["Ocupación efectiva","Sufragio universal","Neutralidad permanente"]',3),
('c1',3,'¿Qué país gobernaba la India en el cambio del siglo XIX al XX?','["Francia","Reino Unido","Portugal"]',1),
('c2',3,'¿Qué país controló el Estado Libre del Congo hasta 1908 como posesión personal de su rey?','["Bélgica, mediante Leopoldo II","Alemania, mediante Bismarck","España, mediante Alfonso XIII"]',2),
('c3',3,'¿Qué territorio estuvo bajo dominio colonial francés?','["Argelia","Canadá","Australia"]',3),
('d1',4,'¿Cuál fue una consecuencia frecuente del dominio colonial?','["La desaparición de toda desigualdad","La explotación de recursos y del trabajo","La independencia inmediata"]',1),
('d2',4,'Al analizar una fuente colonial, ¿qué conviene preguntarse?','["Quién la creó, para quién y con qué propósito","Solo si es antigua","Si contiene muchas imágenes"]',2),
('d3',4,'¿Por qué una frontera colonial podía causar conflictos?','["Porque siempre seguía las comunidades locales","Porque podía ignorar poblaciones, relaciones y realidades previas","Porque eliminaba cualquier rivalidad"]',3),
('e1',5,'¿Qué describe mejor la respuesta de las poblaciones colonizadas?','["No hubo oposición","Hubo distintas formas de resistencia y negociación","Todos apoyaron el control europeo"]',1),
('e2',5,'¿Qué levantamiento se desarrolló en China alrededor de 1900 contra la influencia extranjera?','["La rebelión de los bóxers","La Revolución de los Claveles","La Comuna de París"]',2),
('e3',5,'¿Cuál es una forma rigurosa de estudiar el legado del imperialismo?','["Escuchar solo a los colonizadores","Comparar fuentes y estudiar efectos a largo plazo","Ignorar los hechos de violencia"]',3)
on conflict(id) do update set text=excluded.text,options=excluded.options,sort_order=excluded.sort_order;

insert into public.answer_keys(question_id,correct_option) values
('a1',0),('a2',1),('a3',1),('b1',1),('b2',1),('b3',0),('c1',1),('c2',0),('c3',0),('d1',1),('d2',0),('d3',1),('e1',1),('e2',0),('e3',1)
on conflict(question_id) do update set correct_option=excluded.correct_option;

-- PASOS DE ALTA DE USUARIOS (MANUAL, SOLO PROFESOR):
-- 1) Authentication > Users > Add user: crea cada cuenta con correo y contraseña inicial individual.
-- 2) En SQL Editor crea un equipo:
--    insert into public.teams(name) values('Equipo Atlas') returning id;
-- 3) Inserta un perfil para cada usuario usando el UUID de Authentication:
--    insert into public.profiles(id,display_name,role,team_id)
--    values('UUID_DEL_USUARIO','Apodo individual','student','UUID_DEL_EQUIPO');
-- 4) Crea tu perfil docente asignando role='teacher' y team_id=null.
-- NO compartas UUIDs ni correos de alumnos en GitHub ni en la conversación.
-- NO uses la clave service_role en el frontend. No desactives RLS.
-- Las migraciones futuras deben revisarse y probarse antes de uso con datos reales.

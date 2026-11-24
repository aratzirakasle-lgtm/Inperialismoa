-- Inperialismoa · Registro docente privado previo al alta de cuentas.
-- No introducir nombres ni contraseñas de estudiantes en este archivo público.
-- La migración aplicada es: private_teacher_roster_for_4b_enrollment
CREATE TABLE IF NOT EXISTS public.class_student_roster (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE RESTRICT,
 slot smallint NOT NULL CHECK (slot BETWEEN 1 AND 2),
 display_name text NOT NULL CHECK (char_length(btrim(display_name)) BETWEEN 1 AND 100),
 auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (team_id,slot)
);
ALTER TABLE public.class_student_roster ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.class_student_roster FROM PUBLIC, anon;
GRANT SELECT ON TABLE public.class_student_roster TO authenticated;
DROP POLICY IF EXISTS teacher_roster_read_only ON public.class_student_roster;
CREATE POLICY teacher_roster_read_only
 ON public.class_student_roster FOR SELECT TO authenticated
 USING (EXISTS (
   SELECT 1 FROM public.teams t
   JOIN public.classes c ON c.id=t.class_id
   JOIN public.profiles p ON p.id=(SELECT auth.uid())
   WHERE t.id=class_student_roster.team_id
     AND c.teacher_id=p.id AND p.role='teacher'
 ));
COMMENT ON TABLE public.class_student_roster IS
 'Private teacher-only planned students, with optional Auth account reference. Never store passwords.';

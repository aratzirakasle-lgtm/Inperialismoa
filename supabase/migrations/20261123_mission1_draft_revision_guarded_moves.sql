-- Movimiento CAS mejorado de los borradores M1/3 y M1/5.
-- Evita sobrescribir una casilla recién modificada por otro alumno.
-- Mantiene la RPC antigua para las pestañas abiertas antes del despliegue;
-- la web nueva utiliza la variante con revisión comprobada.
-- No cambia datos existentes ni respuestas.
CREATE OR REPLACE FUNCTION public.mission1_draft_move_checked(
  p_exercise integer,p_item text,p_to_slot text,
  p_expected_slot text,p_expected_revision bigint
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $fn$
DECLARE
 v_user uuid:=auth.uid();
 v_team uuid:=public.my_team();
 v_revision bigint;
 v_places jsonb;
BEGIN
 IF NOT private.m1_draft_allowed(p_exercise,v_team,v_user)
 THEN RAISE EXCEPTION 'Taldearen ariketa hau ez dago eskuragarri'; END IF;
 IF p_expected_revision IS NULL OR p_expected_revision<0
 THEN RAISE EXCEPTION 'Berrikuspen baliogabea'; END IF;

 -- Tanto el comprobador como el movimiento antiguo usan este mismo cerrojo:
 -- la comprobación de revisión y el cambio son atómicos.
 PERFORM pg_advisory_xact_lock(pg_catalog.hashtext(v_team::text),31505);
 SELECT revision,placements INTO v_revision,v_places
   FROM public.mission1_team_drafts
   WHERE team_id=v_team AND exercise=p_exercise FOR UPDATE;
 v_revision:=coalesce(v_revision,0);
 v_places:=coalesce(v_places,'{}'::jsonb);
 IF v_revision IS DISTINCT FROM p_expected_revision THEN
   RETURN jsonb_build_object('status','conflict','placements',v_places,
      'revision',v_revision);
 END IF;

 RETURN public.mission1_draft_move(p_exercise,p_item,p_to_slot,p_expected_slot);
END
$fn$;
REVOKE ALL ON FUNCTION public.mission1_draft_move_checked(integer,text,text,text,bigint)
  FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.mission1_draft_move_checked(integer,text,text,text,bigint)
  TO authenticated,service_role;

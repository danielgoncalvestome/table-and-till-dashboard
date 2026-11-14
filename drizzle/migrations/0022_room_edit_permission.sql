CREATE OR REPLACE FUNCTION public.can_edit_room(_restaurant_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.restaurant_members WHERE restaurant_id=_restaurant_id AND user_id=auth.uid() AND (role='owner' OR permissions->'room_edit'='true'::jsonb))
$$;
REVOKE ALL ON FUNCTION public.can_edit_room(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_edit_room(uuid) TO authenticated, service_role;
CREATE OR REPLACE FUNCTION public.guard_room_edit() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.role()='service_role' THEN
   IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
 END IF;
 IF TG_OP <> 'INSERT' AND NOT public.can_edit_room(OLD.restaurant_id) THEN RAISE EXCEPTION 'Sem permissão para editar a sala' USING ERRCODE='42501'; END IF;
 IF TG_OP <> 'DELETE' AND NOT public.can_edit_room(NEW.restaurant_id) THEN RAISE EXCEPTION 'Sem permissão para editar a sala' USING ERRCODE='42501'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END $$;
CREATE TRIGGER guard_room_edit BEFORE INSERT OR UPDATE OR DELETE ON public.zones FOR EACH ROW EXECUTE FUNCTION public.guard_room_edit();
CREATE TRIGGER guard_room_edit BEFORE INSERT OR UPDATE OR DELETE ON public.dining_tables FOR EACH ROW EXECUTE FUNCTION public.guard_room_edit();
CREATE OR REPLACE FUNCTION public.guard_room_mode() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.res_mode IS DISTINCT FROM OLD.res_mode AND auth.role() IS DISTINCT FROM 'service_role' AND NOT public.can_edit_room(OLD.id) THEN RAISE EXCEPTION 'Sem permissão para editar a sala' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_room_mode BEFORE UPDATE ON public.restaurants FOR EACH ROW EXECUTE FUNCTION public.guard_room_mode();
CREATE OR REPLACE FUNCTION public.set_room_mode(_restaurant_id uuid, _mode text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT public.can_edit_room(_restaurant_id) THEN RAISE EXCEPTION 'Sem permissão para editar a sala' USING ERRCODE='42501'; END IF;
 IF _mode NOT IN ('simple','advanced') THEN RAISE EXCEPTION 'Modo inválido'; END IF;
 UPDATE public.restaurants SET res_mode=_mode WHERE id=_restaurant_id;
END $$;
REVOKE ALL ON FUNCTION public.set_room_mode(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_room_mode(uuid,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.submit_floor_plan(_restaurant_id uuid) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE n int; rn text;
BEGIN
 IF NOT public.can_edit_room(_restaurant_id) THEN RAISE EXCEPTION 'Sem permissão para editar a sala' USING ERRCODE='42501'; END IF;
 SELECT count(*) INTO n FROM public.dining_tables WHERE restaurant_id=_restaurant_id AND active;
 SELECT name INTO rn FROM public.restaurants WHERE id=_restaurant_id;
 INSERT INTO public.restaurant_devices(restaurant_id, submitted_tables, submitted_at) VALUES (_restaurant_id, n, now()) ON CONFLICT (restaurant_id) DO UPDATE SET submitted_tables=n, submitted_at=now(), updated_at=now();
 INSERT INTO public.contact_submissions(name,email,message) VALUES(rn,'planta@menutap.pt','Planta submetida para contabilização de dispositivos: ' || n || ' mesas ativas.');
 RETURN n;
END $$;
ALTER TABLE public.restaurants ADD COLUMN orders_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.restaurants ADD COLUMN order_options jsonb NOT NULL DEFAULT '{"statuses":true,"sound":true,"notes":true,"bill":true}'::jsonb;

CREATE TABLE public.table_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_id uuid REFERENCES public.dining_tables(id) ON DELETE SET NULL,
  token text NOT NULL UNIQUE DEFAULT substr(replace(gen_random_uuid()::text,'-',''),1,20),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.table_links TO authenticated;
GRANT ALL ON public.table_links TO service_role;
ALTER TABLE public.table_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage links" ON public.table_links FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.restaurant_devices (
  restaurant_id uuid PRIMARY KEY REFERENCES public.restaurants(id) ON DELETE CASCADE,
  devices_count integer NOT NULL DEFAULT 0,
  all_working boolean NOT NULL DEFAULT false,
  submitted_tables integer,
  submitted_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurant_devices TO authenticated;
GRANT ALL ON public.restaurant_devices TO service_role;
ALTER TABLE public.restaurant_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage devices" ON public.restaurant_devices FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "admin read tables" ON public.dining_tables FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.table_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_id uuid REFERENCES public.dining_tables(id) ON DELETE SET NULL,
  table_label text NOT NULL DEFAULT '',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'new',
  cleared boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX table_orders_open_idx ON public.table_orders(restaurant_id, cleared, created_at);
GRANT SELECT, UPDATE, DELETE ON public.table_orders TO authenticated;
GRANT ALL ON public.table_orders TO service_role;
ALTER TABLE public.table_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read orders" ON public.table_orders FOR SELECT TO authenticated USING (public.is_member(restaurant_id));
CREATE POLICY "members update orders" ON public.table_orders FOR UPDATE TO authenticated USING (public.is_member(restaurant_id)) WITH CHECK (public.is_member(restaurant_id));
CREATE POLICY "members delete orders" ON public.table_orders FOR DELETE TO authenticated USING (public.is_member(restaurant_id));
ALTER PUBLICATION supabase_realtime ADD TABLE public.table_orders;

CREATE FUNCTION public.has_orders_plan(_restaurant_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM public.restaurants r WHERE r.id=_restaurant_id AND (r.is_demo OR EXISTS(
    SELECT 1 FROM public.account_subscriptions s WHERE s.user_id=r.created_by AND s.price_id='menutap_reservas_monthly'
      AND s.environment='live' AND s.status IN ('active','trialing','past_due') AND (s.current_period_end IS NULL OR s.current_period_end>now()))))
$$;
GRANT EXECUTE ON FUNCTION public.has_orders_plan(uuid) TO anon, authenticated, service_role;

CREATE FUNCTION public.public_table_info(_token text) RETURNS TABLE(restaurant_id uuid, table_label text, orders_on boolean, options jsonb) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT r.id, t.label, (r.orders_enabled AND public.has_orders_plan(r.id) AND public.is_public_restaurant(r.id)), r.order_options
  FROM public.table_links l JOIN public.dining_tables t ON t.id=l.table_id JOIN public.restaurants r ON r.id=l.restaurant_id
  WHERE l.token=_token AND t.active
$$;
GRANT EXECUTE ON FUNCTION public.public_table_info(text) TO anon, authenticated;

CREATE FUNCTION public.public_place_order(_token text, _items jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE l record; it jsonb; d record; q int; note text; out_items jsonb := '[]'::jsonb; tot numeric := 0; new_id uuid; notes_on boolean;
BEGIN
  SELECT l2.restaurant_id, t.id AS table_id, t.label, r.order_options INTO l
    FROM public.table_links l2 JOIN public.dining_tables t ON t.id=l2.table_id JOIN public.restaurants r ON r.id=l2.restaurant_id
    WHERE l2.token=_token AND t.active AND r.orders_enabled AND public.has_orders_plan(r.id) AND public.is_public_restaurant(r.id);
  IF NOT FOUND THEN RAISE EXCEPTION 'Pedidos indisponíveis'; END IF;
  IF jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items)=0 OR jsonb_array_length(_items)>40 THEN RAISE EXCEPTION 'Pedido inválido'; END IF;
  IF (SELECT count(*) FROM public.table_orders WHERE table_id=l.table_id AND NOT cleared) >= 30 THEN RAISE EXCEPTION 'Demasiados pedidos'; END IF;
  notes_on := COALESCE((l.order_options->>'notes')::boolean, true);
  FOR it IN SELECT * FROM jsonb_array_elements(_items) LOOP
    q := LEAST(GREATEST(COALESCE((it->>'qty')::int,1),1),50);
    SELECT id, name, COALESCE(promo_price, price) AS p INTO d FROM public.dishes
      WHERE id=(it->>'dish_id')::uuid AND restaurant_id=l.restaurant_id AND available AND NOT archived;
    IF NOT FOUND THEN RAISE EXCEPTION 'Prato indisponível'; END IF;
    note := CASE WHEN notes_on THEN left(btrim(COALESCE(it->>'note','')),200) ELSE '' END;
    out_items := out_items || jsonb_build_object('dish_id',d.id,'name',d.name,'price',d.p,'qty',q,'note',note);
    tot := tot + d.p*q;
  END LOOP;
  INSERT INTO public.table_orders(restaurant_id, table_id, table_label, items, total) VALUES (l.restaurant_id, l.table_id, l.label, out_items, tot) RETURNING id INTO new_id;
  RETURN new_id;
END $$;
GRANT EXECUTE ON FUNCTION public.public_place_order(text, jsonb) TO anon, authenticated;

CREATE FUNCTION public.public_table_orders(_token text) RETURNS TABLE(id uuid, items jsonb, total numeric, status text, created_at timestamptz) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT o.id, o.items, o.total, o.status, o.created_at FROM public.table_orders o
  JOIN public.table_links l ON l.table_id=o.table_id WHERE l.token=_token AND NOT o.cleared ORDER BY o.created_at
$$;
GRANT EXECUTE ON FUNCTION public.public_table_orders(text) TO anon, authenticated;

CREATE FUNCTION public.clear_orders_on_release() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF OLD.status='seated' AND NEW.status<>'seated' AND OLD.table_id IS NOT NULL THEN
    UPDATE public.table_orders SET cleared=true, updated_at=now() WHERE table_id=OLD.table_id AND NOT cleared;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER clear_orders_on_release AFTER UPDATE OF status ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.clear_orders_on_release();

CREATE FUNCTION public.submit_floor_plan(_restaurant_id uuid) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE n int; rn text;
BEGIN
  IF NOT public.is_member(_restaurant_id) THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT count(*) INTO n FROM public.dining_tables WHERE restaurant_id=_restaurant_id AND active;
  SELECT name INTO rn FROM public.restaurants WHERE id=_restaurant_id;
  INSERT INTO public.restaurant_devices(restaurant_id, submitted_tables, submitted_at) VALUES (_restaurant_id, n, now())
    ON CONFLICT (restaurant_id) DO UPDATE SET submitted_tables=n, submitted_at=now(), updated_at=now();
  INSERT INTO public.contact_submissions(name, email, message) VALUES (rn, 'planta@menutap.pt', 'Planta submetida para contabilização de dispositivos: ' || n || ' mesas ativas.');
  RETURN n;
END $$;
GRANT EXECUTE ON FUNCTION public.submit_floor_plan(uuid) TO authenticated;
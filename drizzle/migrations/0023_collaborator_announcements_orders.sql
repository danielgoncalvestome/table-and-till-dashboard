CREATE OR REPLACE FUNCTION public.staff_place_order(_table_id uuid, _items jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE t record; it jsonb; d record; q int; out_items jsonb := '[]'::jsonb; tot numeric := 0; new_id uuid;
BEGIN
  SELECT id, restaurant_id, label INTO t FROM public.dining_tables WHERE id=_table_id;
  IF NOT FOUND OR NOT public.is_member(t.restaurant_id) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items)=0 OR jsonb_array_length(_items)>60 THEN RAISE EXCEPTION 'Pedido inválido'; END IF;
  FOR it IN SELECT * FROM jsonb_array_elements(_items) LOOP
    q := LEAST(GREATEST(COALESCE((it->>'qty')::int,1),1),99);
    SELECT id, name, COALESCE(promo_price, price) AS p INTO d FROM public.dishes
      WHERE id=(it->>'dish_id')::uuid AND restaurant_id=t.restaurant_id AND NOT archived;
    IF NOT FOUND THEN RAISE EXCEPTION 'Prato indisponível'; END IF;
    out_items := out_items || jsonb_build_object('dish_id',d.id,'name',d.name,'price',d.p,'qty',q,'note',left(btrim(COALESCE(it->>'note','')),200));
    tot := tot + d.p*q;
  END LOOP;
  INSERT INTO public.table_orders(restaurant_id, table_id, table_label, items, total) VALUES (t.restaurant_id, t.id, t.label, out_items, tot) RETURNING id INTO new_id;
  RETURN new_id;
END $$;
REVOKE ALL ON FUNCTION public.staff_place_order(uuid, jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.staff_place_order(uuid, jsonb) TO authenticated;

ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS overview_layout jsonb;
CREATE OR REPLACE FUNCTION public.default_overview_layout() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT overview_layout FROM public.platform_settings WHERE id=1 $$;
REVOKE ALL ON FUNCTION public.default_overview_layout() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.default_overview_layout() TO authenticated;

CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  body text,
  target_all boolean NOT NULL DEFAULT true,
  restaurant_ids uuid[] NOT NULL DEFAULT '{}',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage announcements" ON public.announcements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "members read targeted announcements" ON public.announcements FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.restaurant_members m WHERE m.user_id = auth.uid() AND (target_all OR m.restaurant_id = ANY(restaurant_ids))));

CREATE TABLE IF NOT EXISTS public.announcement_reads (
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (announcement_id, user_id)
);
GRANT SELECT, INSERT ON public.announcement_reads TO authenticated;
GRANT ALL ON public.announcement_reads TO service_role;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reads select" ON public.announcement_reads FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own reads insert" ON public.announcement_reads FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
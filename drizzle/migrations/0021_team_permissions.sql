ALTER TABLE public.restaurant_members ADD COLUMN IF NOT EXISTS permissions jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.is_true_owner(_restaurant_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.restaurant_members WHERE restaurant_id=_restaurant_id AND user_id=auth.uid() AND role='owner')
$$;
CREATE OR REPLACE FUNCTION public.has_perm(_restaurant_id uuid, _perm text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.restaurant_members WHERE restaurant_id=_restaurant_id AND user_id=auth.uid()
    AND (role IN ('owner','manager') OR coalesce((permissions->>_perm)::boolean,false)))
$$;

DROP POLICY "owners manage members" ON public.restaurant_members;
CREATE POLICY "owners manage members" ON public.restaurant_members FOR ALL TO authenticated USING (public.is_true_owner(restaurant_id)) WITH CHECK (public.is_true_owner(restaurant_id));

DROP POLICY "members update" ON public.restaurants;
CREATE POLICY "members update" ON public.restaurants FOR UPDATE TO authenticated USING (public.has_perm(id,'design') OR public.has_perm(id,'settings'));

DROP POLICY "members write menus" ON public.menus;
CREATE POLICY "members write menus" ON public.menus FOR ALL TO authenticated USING (public.has_perm(restaurant_id,'menus')) WITH CHECK (public.has_perm(restaurant_id,'menus'));
DROP POLICY "members write categories" ON public.categories;
CREATE POLICY "members write categories" ON public.categories FOR ALL TO authenticated USING (public.has_perm(restaurant_id,'menus')) WITH CHECK (public.has_perm(restaurant_id,'menus'));
DROP POLICY "members write dishes" ON public.dishes;
CREATE POLICY "members write dishes" ON public.dishes FOR ALL TO authenticated USING (public.has_perm(restaurant_id,'menus')) WITH CHECK (public.has_perm(restaurant_id,'menus'));
DROP POLICY "members write recs" ON public.recommendations;
CREATE POLICY "members write recs" ON public.recommendations FOR ALL TO authenticated USING (public.has_perm(restaurant_id,'menus')) WITH CHECK (public.has_perm(restaurant_id,'menus'));
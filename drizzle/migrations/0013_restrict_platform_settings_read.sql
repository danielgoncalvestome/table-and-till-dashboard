DROP POLICY IF EXISTS "settings public read" ON public.platform_settings;
REVOKE SELECT ON public.platform_settings FROM anon;
CREATE POLICY "settings admin read" ON public.platform_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
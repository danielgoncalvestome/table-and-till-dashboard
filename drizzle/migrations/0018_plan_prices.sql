CREATE TABLE public.plan_prices (
  price_id text PRIMARY KEY,
  cents integer NOT NULL CHECK (cents >= 100 AND cents <= 100000),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.plan_prices TO anon, authenticated;
GRANT INSERT, UPDATE ON public.plan_prices TO authenticated;
GRANT ALL ON public.plan_prices TO service_role;
ALTER TABLE public.plan_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads plan prices" ON public.plan_prices FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert plan prices" ON public.plan_prices FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update plan prices" ON public.plan_prices FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.plan_prices (price_id, cents) VALUES ('menutap_monthly', 990), ('menutap_reservas_monthly', 1990);
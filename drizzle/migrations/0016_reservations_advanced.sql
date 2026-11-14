ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS res_mode text NOT NULL DEFAULT 'simple';
ALTER TABLE public.zones ADD COLUMN IF NOT EXISTS decor jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  party integer NOT NULL DEFAULT 2,
  notes text,
  status text NOT NULL DEFAULT 'waiting',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waitlist TO authenticated;
GRANT ALL ON public.waitlist TO service_role;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members manage waitlist" ON public.waitlist FOR ALL TO authenticated USING (public.is_member(restaurant_id)) WITH CHECK (public.is_member(restaurant_id));
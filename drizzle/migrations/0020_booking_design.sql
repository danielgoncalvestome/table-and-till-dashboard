ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS booking_design jsonb NOT NULL DEFAULT '{}'::jsonb;
DROP FUNCTION IF EXISTS public.public_booking_info(text);
CREATE FUNCTION public.public_booking_info(_slug text)
 RETURNS TABLE(name text, logo_url text, primary_color text, background_color text, max_days_ahead integer, closed_days integer[], timezone text, booking_design jsonb)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT name, logo_url, primary_color, background_color, max_days_ahead, closed_days, timezone, booking_design FROM public.restaurants WHERE slug = _slug AND published AND booking_enabled
$$;
GRANT EXECUTE ON FUNCTION public.public_booking_info(text) TO anon, authenticated;
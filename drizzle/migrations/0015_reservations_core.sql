ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS booking_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Europe/Lisbon',
  ADD COLUMN IF NOT EXISTS booking_open time NOT NULL DEFAULT '12:00',
  ADD COLUMN IF NOT EXISTS booking_close time NOT NULL DEFAULT '22:00',
  ADD COLUMN IF NOT EXISTS meal_minutes integer NOT NULL DEFAULT 90,
  ADD COLUMN IF NOT EXISTS buffer_minutes integer NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS min_notice_minutes integer NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS max_days_ahead integer NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS late_tolerance_minutes integer NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS closed_days integer[] NOT NULL DEFAULT '{}';

CREATE TABLE public.zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  online boolean NOT NULL DEFAULT true,
  active boolean NOT NULL DEFAULT true,
  position integer NOT NULL DEFAULT 0,
  width integer NOT NULL DEFAULT 1000,
  height integer NOT NULL DEFAULT 700,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.zones TO authenticated;
GRANT ALL ON public.zones TO service_role;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members manage zones" ON public.zones FOR ALL TO authenticated USING (public.is_member(restaurant_id)) WITH CHECK (public.is_member(restaurant_id));

CREATE TABLE public.dining_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  zone_id uuid REFERENCES public.zones(id) ON DELETE SET NULL,
  label text NOT NULL,
  min_seats integer NOT NULL DEFAULT 1,
  seats integer NOT NULL DEFAULT 4,
  max_seats integer NOT NULL DEFAULT 4,
  shape text NOT NULL DEFAULT 'square',
  x integer NOT NULL DEFAULT 40,
  y integer NOT NULL DEFAULT 40,
  w integer NOT NULL DEFAULT 80,
  h integer NOT NULL DEFAULT 80,
  rotation integer NOT NULL DEFAULT 0,
  color text,
  active boolean NOT NULL DEFAULT true,
  online boolean NOT NULL DEFAULT true,
  combinable boolean NOT NULL DEFAULT false,
  live_status text NOT NULL DEFAULT 'free',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dining_tables TO authenticated;
GRANT ALL ON public.dining_tables TO service_role;
ALTER TABLE public.dining_tables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members manage tables" ON public.dining_tables FOR ALL TO authenticated USING (public.is_member(restaurant_id)) WITH CHECK (public.is_member(restaurant_id));

CREATE TABLE public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_id uuid REFERENCES public.dining_tables(id) ON DELETE SET NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  party integer NOT NULL,
  name text NOT NULL,
  phone text,
  email text,
  notes text,
  source text NOT NULL DEFAULT 'staff',
  status text NOT NULL DEFAULT 'confirmed',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX reservations_rest_time ON public.reservations (restaurant_id, starts_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservations TO authenticated;
GRANT ALL ON public.reservations TO service_role;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members manage reservations" ON public.reservations FOR ALL TO authenticated USING (public.is_member(restaurant_id)) WITH CHECK (public.is_member(restaurant_id));

-- Free table finder (blocking statuses only)
CREATE OR REPLACE FUNCTION public.find_free_table(_restaurant_id uuid, _start timestamptz, _end timestamptz, _party integer, _online_only boolean, _exclude uuid DEFAULT NULL)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.id FROM public.dining_tables t
  LEFT JOIN public.zones z ON z.id = t.zone_id
  WHERE t.restaurant_id = _restaurant_id AND t.active AND t.max_seats >= _party AND t.min_seats <= _party
    AND (z.id IS NULL OR z.active) AND (NOT _online_only OR (t.online AND (z.id IS NULL OR z.online)))
    AND NOT EXISTS (
      SELECT 1 FROM public.reservations r, public.restaurants re
      WHERE re.id = _restaurant_id AND r.table_id = t.id AND r.status IN ('pending','confirmed','seated')
        AND (_exclude IS NULL OR r.id <> _exclude)
        AND r.starts_at < _end + make_interval(mins => re.buffer_minutes)
        AND r.ends_at + make_interval(mins => re.buffer_minutes) > _start)
  ORDER BY t.seats - _party, t.max_seats, t.position LIMIT 1
$$;
REVOKE EXECUTE ON FUNCTION public.find_free_table(uuid, timestamptz, timestamptz, integer, boolean, uuid) FROM PUBLIC, anon, authenticated;

-- Staff booking (atomic, members only)
CREATE OR REPLACE FUNCTION public.staff_book(_restaurant_id uuid, _start timestamptz, _party integer, _name text, _phone text, _email text, _notes text, _table_id uuid DEFAULT NULL, _source text DEFAULT 'staff')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE re public.restaurants; _end timestamptz; _t uuid; _id uuid;
BEGIN
  IF NOT public.is_member(_restaurant_id) THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO re FROM public.restaurants WHERE id = _restaurant_id FOR UPDATE;
  _end := _start + make_interval(mins => re.meal_minutes);
  IF _table_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.reservations r WHERE r.table_id = _table_id AND r.status IN ('pending','confirmed','seated')
      AND r.starts_at < _end + make_interval(mins => re.buffer_minutes) AND r.ends_at + make_interval(mins => re.buffer_minutes) > _start) THEN
      RAISE EXCEPTION 'table_busy';
    END IF;
    _t := _table_id;
  ELSE
    _t := public.find_free_table(_restaurant_id, _start, _end, _party, false);
  END IF;
  INSERT INTO public.reservations (restaurant_id, table_id, starts_at, ends_at, party, name, phone, email, notes, source)
  VALUES (_restaurant_id, _t, _start, _end, _party, _name, _phone, _email, _notes, coalesce(_source,'staff')) RETURNING id INTO _id;
  RETURN _id;
END $$;
GRANT EXECUTE ON FUNCTION public.staff_book(uuid, timestamptz, integer, text, text, text, text, uuid, text) TO authenticated;

-- Public: available start times for a date
CREATE OR REPLACE FUNCTION public.public_slots(_slug text, _date date, _party integer)
RETURNS TABLE(slot text) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE re public.restaurants; s time; st timestamptz;
BEGIN
  SELECT * INTO re FROM public.restaurants WHERE slug = _slug AND published AND booking_enabled;
  IF re.id IS NULL OR _party < 1 OR _party > 30 THEN RETURN; END IF;
  IF extract(dow FROM _date)::int = ANY(re.closed_days) THEN RETURN; END IF;
  s := re.booking_open;
  WHILE s <= re.booking_close LOOP
    st := (_date + s) AT TIME ZONE re.timezone;
    IF st >= now() + make_interval(mins => re.min_notice_minutes) AND st <= now() + make_interval(days => re.max_days_ahead)
       AND public.find_free_table(re.id, st, st + make_interval(mins => re.meal_minutes), _party, true) IS NOT NULL THEN
      slot := to_char(s, 'HH24:MI'); RETURN NEXT;
    END IF;
    s := s + interval '30 minutes';
    EXIT WHEN s = '00:00'::time;
  END LOOP;
END $$;
GRANT EXECUTE ON FUNCTION public.public_slots(text, date, integer) TO anon, authenticated;

-- Public booking (atomic)
CREATE OR REPLACE FUNCTION public.public_book(_slug text, _date date, _time text, _party integer, _name text, _phone text, _email text, _notes text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE re public.restaurants; st timestamptz; _t uuid; _id uuid;
BEGIN
  IF length(trim(coalesce(_name,''))) < 2 OR length(_name) > 100 OR length(coalesce(_phone,'')) > 30 OR length(coalesce(_email,'')) > 200 OR length(coalesce(_notes,'')) > 500 THEN RAISE EXCEPTION 'invalid'; END IF;
  IF coalesce(_phone,'') = '' AND coalesce(_email,'') = '' THEN RAISE EXCEPTION 'contact_required'; END IF;
  SELECT * INTO re FROM public.restaurants WHERE slug = _slug AND published AND booking_enabled FOR UPDATE;
  IF re.id IS NULL OR _party < 1 OR _party > 30 THEN RAISE EXCEPTION 'unavailable'; END IF;
  IF extract(dow FROM _date)::int = ANY(re.closed_days) THEN RAISE EXCEPTION 'unavailable'; END IF;
  IF _time::time < re.booking_open OR _time::time > re.booking_close THEN RAISE EXCEPTION 'unavailable'; END IF;
  st := (_date + _time::time) AT TIME ZONE re.timezone;
  IF st < now() + make_interval(mins => re.min_notice_minutes) OR st > now() + make_interval(days => re.max_days_ahead) THEN RAISE EXCEPTION 'unavailable'; END IF;
  _t := public.find_free_table(re.id, st, st + make_interval(mins => re.meal_minutes), _party, true);
  IF _t IS NULL THEN RAISE EXCEPTION 'unavailable'; END IF;
  INSERT INTO public.reservations (restaurant_id, table_id, starts_at, ends_at, party, name, phone, email, notes, source, status)
  VALUES (re.id, _t, st, st + make_interval(mins => re.meal_minutes), _party, trim(_name), _phone, _email, _notes, 'online', 'confirmed') RETURNING id INTO _id;
  RETURN _id;
END $$;
GRANT EXECUTE ON FUNCTION public.public_book(text, date, text, integer, text, text, text, text) TO anon, authenticated;

-- Public info about booking (whether enabled)
CREATE OR REPLACE FUNCTION public.public_booking_info(_slug text)
RETURNS TABLE(name text, logo_url text, primary_color text, background_color text, max_days_ahead integer, closed_days integer[], timezone text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT name, logo_url, primary_color, background_color, max_days_ahead, closed_days, timezone FROM public.restaurants WHERE slug = _slug AND published AND booking_enabled
$$;
GRANT EXECUTE ON FUNCTION public.public_booking_info(text) TO anon, authenticated;
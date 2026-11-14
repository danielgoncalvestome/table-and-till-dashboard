CREATE OR REPLACE FUNCTION public.move_reservation(_id uuid, _table_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE x public.reservations; re public.restaurants;
BEGIN
  SELECT * INTO x FROM public.reservations WHERE id = _id;
  IF x.id IS NULL OR NOT public.is_member(x.restaurant_id) THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO re FROM public.restaurants WHERE id = x.restaurant_id FOR UPDATE;
  IF NOT EXISTS (SELECT 1 FROM public.dining_tables WHERE id = _table_id AND restaurant_id = x.restaurant_id) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF EXISTS (SELECT 1 FROM public.reservations r WHERE r.table_id = _table_id AND r.id <> _id AND r.status IN ('pending','confirmed','seated')
    AND r.starts_at < x.ends_at + make_interval(mins => re.buffer_minutes) AND r.ends_at + make_interval(mins => re.buffer_minutes) > x.starts_at) THEN
    RAISE EXCEPTION 'table_busy';
  END IF;
  UPDATE public.reservations SET table_id = _table_id, updated_at = now() WHERE id = _id;
END $$;
GRANT EXECUTE ON FUNCTION public.move_reservation(uuid, uuid) TO authenticated;
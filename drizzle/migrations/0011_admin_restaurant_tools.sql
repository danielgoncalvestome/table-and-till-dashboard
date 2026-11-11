CREATE OR REPLACE FUNCTION public.admin_set_trial_end(_restaurant_id uuid, _ends timestamptz)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  ALTER TABLE public.restaurants DISABLE TRIGGER USER;
  UPDATE public.restaurants SET trial_ends_at = _ends, trial_started_at = COALESCE(trial_started_at, now()), updated_at = now() WHERE id = _restaurant_id;
  ALTER TABLE public.restaurants ENABLE TRIGGER USER;
END $$;
REVOKE ALL ON FUNCTION public.admin_set_trial_end(uuid, timestamptz) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_trial_end(uuid, timestamptz) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_owner_info(_user_id uuid)
RETURNS TABLE(username text, email text, created_at timestamptz, last_sign_in_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY SELECT p.username, u.email::text, u.created_at, u.last_sign_in_at
    FROM auth.users u LEFT JOIN public.profiles p ON p.id = u.id WHERE u.id = _user_id;
END $$;
REVOKE ALL ON FUNCTION public.admin_owner_info(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_owner_info(uuid) TO authenticated;
ALTER TABLE public.profiles ADD COLUMN username text;
CREATE UNIQUE INDEX profiles_username_unique ON public.profiles (lower(username)) WHERE username IS NOT NULL;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_format CHECK (username IS NULL OR (username = lower(username) AND username ~ '^[a-z0-9_]{3,30}$'));
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE chosen_username text;
BEGIN
 chosen_username := nullif(lower(trim(new.raw_user_meta_data->>'username')), '');
 INSERT INTO public.profiles (id, display_name, username) VALUES (new.id, coalesce(new.raw_user_meta_data->>'display_name', chosen_username, split_part(new.email,'@',1)), chosen_username) ON CONFLICT (id) DO NOTHING;
 RETURN new;
END;
$$;
CREATE OR REPLACE FUNCTION public.protect_account_username() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF OLD.username IS NOT NULL AND NEW.username IS DISTINCT FROM OLD.username THEN RAISE EXCEPTION 'Username cannot be changed'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER protect_account_username BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_account_username();
CREATE OR REPLACE FUNCTION public.account_login_email(_username text) RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT u.email::text FROM public.profiles p JOIN auth.users u ON u.id=p.id WHERE p.username=lower(trim(_username));
$$;
REVOKE ALL ON FUNCTION public.account_login_email(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.account_login_email(text) TO service_role;
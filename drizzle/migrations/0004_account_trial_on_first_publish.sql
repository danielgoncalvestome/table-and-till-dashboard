CREATE OR REPLACE FUNCTION public.handle_restaurant_publish() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE d int; first_start timestamptz; first_end timestamptz;
BEGIN
 NEW.updated_at:=now();
 IF NEW.published AND NOT OLD.published AND NEW.trial_started_at IS NULL AND NOT NEW.is_demo THEN
   PERFORM pg_advisory_xact_lock(hashtextextended(NEW.created_by::text,0));
   SELECT trial_started_at,trial_ends_at INTO first_start,first_end FROM public.restaurants WHERE created_by=NEW.created_by AND id<>NEW.id AND NOT is_demo AND trial_started_at IS NOT NULL ORDER BY trial_started_at LIMIT 1;
   IF first_start IS NULL THEN
     SELECT trial_days INTO d FROM public.platform_settings WHERE id=1;
     first_start:=now(); first_end:=now()+make_interval(days=>d);
   END IF;
   NEW.trial_started_at:=first_start; NEW.trial_ends_at:=first_end;
   IF NEW.status='draft' THEN NEW.status:='trial'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE FUNCTION public.protect_initial_billing_fields() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF auth.role()='authenticated' AND (NEW.is_demo OR NEW.trial_started_at IS NOT NULL OR NEW.trial_ends_at IS NOT NULL OR NEW.published OR NEW.created_by IS DISTINCT FROM auth.uid()) THEN
   RAISE EXCEPTION 'Billing fields cannot be set directly';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER a_protect_initial_billing BEFORE INSERT ON public.restaurants FOR EACH ROW EXECUTE FUNCTION public.protect_initial_billing_fields();
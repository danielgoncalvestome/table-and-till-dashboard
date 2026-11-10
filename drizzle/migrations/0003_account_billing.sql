CREATE TABLE public.account_subscriptions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
 stripe_subscription_id text NOT NULL, stripe_customer_id text NOT NULL,
 price_id text NOT NULL, status text NOT NULL, current_period_end timestamptz,
 cancel_at_period_end boolean NOT NULL DEFAULT false,
 environment text NOT NULL CHECK (environment IN ('sandbox','live')),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(environment,stripe_subscription_id)
);
GRANT SELECT ON public.account_subscriptions TO authenticated;
GRANT ALL ON public.account_subscriptions TO service_role;
ALTER TABLE public.account_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own account billing" ON public.account_subscriptions FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE INDEX account_subscriptions_user ON public.account_subscriptions(user_id,environment);
CREATE TABLE public.billing_accounts (
 user_id uuid NOT NULL, environment text NOT NULL CHECK(environment IN ('sandbox','live')),
 stripe_customer_id text, checkout_session_id text, checkout_expires_at timestamptz,
 trial_ends_at timestamptz, PRIMARY KEY(user_id,environment)
);
GRANT SELECT ON public.billing_accounts TO authenticated;
GRANT ALL ON public.billing_accounts TO service_role;
ALTER TABLE public.billing_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own billing account" ON public.billing_accounts FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE FUNCTION public.has_account_access(_user_id uuid, _environment text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM public.account_subscriptions WHERE user_id=_user_id AND environment=_environment AND status IN ('active','trialing','past_due','canceled') AND (current_period_end>now() OR (current_period_end IS NULL AND status IN ('active','trialing','past_due'))))
$$;
GRANT EXECUTE ON FUNCTION public.has_account_access(uuid,text) TO anon,authenticated,service_role;
CREATE FUNCTION public.restaurant_billing_access(_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM public.restaurants r WHERE r.id=_id AND (r.is_demo OR public.has_account_access(r.created_by,'live') OR (NOT EXISTS(SELECT 1 FROM public.account_subscriptions s WHERE s.user_id=r.created_by AND s.environment='live') AND r.trial_ends_at>now())))
$$;
GRANT EXECUTE ON FUNCTION public.restaurant_billing_access(uuid) TO anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.is_public_restaurant(_restaurant_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM public.restaurants WHERE id=_restaurant_id AND published AND public.restaurant_billing_access(id))
$$;
DROP POLICY "public read published" ON public.restaurants;
CREATE POLICY "public read published" ON public.restaurants FOR SELECT TO anon,authenticated USING(public.is_public_restaurant(id) OR created_by=auth.uid() OR public.is_member(id));
CREATE FUNCTION public.protect_trial_fields() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
 BEGIN
 IF auth.role()='authenticated' AND (NEW.trial_started_at IS DISTINCT FROM OLD.trial_started_at OR NEW.trial_ends_at IS DISTINCT FROM OLD.trial_ends_at OR NEW.is_demo IS DISTINCT FROM OLD.is_demo OR NEW.created_by IS DISTINCT FROM OLD.created_by) THEN
 RAISE EXCEPTION 'Billing fields cannot be changed directly';
 END IF;
 RETURN NEW;
 END $$;
CREATE TRIGGER a_protect_trial_fields BEFORE UPDATE ON public.restaurants FOR EACH ROW EXECUTE FUNCTION public.protect_trial_fields();
COMMENT ON TABLE public.subscriptions IS 'DEPRECATED: account-wide Stripe billing is stored in account_subscriptions';
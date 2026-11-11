ALTER TABLE public.account_subscriptions ADD COLUMN paddle_subscription_id text, ADD COLUMN paddle_customer_id text, ADD COLUMN product_id text;
ALTER TABLE public.account_subscriptions ALTER COLUMN stripe_subscription_id DROP NOT NULL, ALTER COLUMN stripe_customer_id DROP NOT NULL;
CREATE UNIQUE INDEX account_subscriptions_paddle_unique ON public.account_subscriptions(paddle_subscription_id);
COMMENT ON COLUMN public.account_subscriptions.stripe_subscription_id IS 'DEPRECATED: billing moved to Paddle (paddle_subscription_id)';
COMMENT ON COLUMN public.account_subscriptions.stripe_customer_id IS 'DEPRECATED: billing moved to Paddle (paddle_customer_id)';
COMMENT ON TABLE public.billing_accounts IS 'DEPRECATED: Stripe checkout state, no longer used';
COMMENT ON TABLE public.shop_products IS 'DEPRECATED: paid card shop removed; identifiers are included in plans';
COMMENT ON TABLE public.shop_orders IS 'DEPRECATED: paid card shop removed; identifiers are included in plans';
CREATE POLICY "Admins read account billing" ON public.account_subscriptions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
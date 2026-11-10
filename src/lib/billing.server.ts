import type Stripe from 'stripe';
import { createStripeClient, type StripeEnv } from './stripe.server';
import { supabaseAdmin } from '@/integrations/supabase/client.server';
export async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) throw new Error('Invalid userId');
  if (options.userId) {
    const found = await stripe.customers.search({ query: `metadata['userId']:'${options.userId}'`, limit: 1 });
    if (found.data.length) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) {
      const customer = existing.data[0];
      if (options.userId && customer.metadata?.userId !== options.userId) {
        await stripe.customers.update(customer.id, { metadata: { ...customer.metadata, userId: options.userId } });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }), ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}
export async function syncSubscription(subscription: Stripe.Subscription, environment: StripeEnv) {
  const userId = subscription.metadata.userId;
  if (!userId) throw new Error('Missing subscription owner');
  const item = subscription.items.data[0];
  if (!item) throw new Error('Missing subscription item');
  const { error } = await supabaseAdmin.from('account_subscriptions').upsert({
    user_id: userId, environment, stripe_subscription_id: subscription.id,
    stripe_customer_id: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
    price_id: subscription.metadata.priceId ?? item.price.lookup_key ?? item.price.metadata.lovable_external_id ?? item.price.id,
    status: subscription.status,
    current_period_end: item.current_period_end ? new Date(item.current_period_end * 1000).toISOString() : null,
    cancel_at_period_end: subscription.cancel_at_period_end, updated_at: new Date().toISOString(),
  }, { onConflict: 'environment,stripe_subscription_id' });
  if (error) throw error;
}
export async function verifyPaymentEvent(request: Request, environment: StripeEnv) {
  const secret = process.env[environment === 'sandbox' ? 'PAYMENTS_SANDBOX_WEBHOOK_SECRET' : 'PAYMENTS_LIVE_WEBHOOK_SECRET'];
  if (!secret) throw new Error('Webhook is not configured');
  const signature = request.headers.get('stripe-signature');
  if (!signature) throw new Error('Missing webhook signature');
  return createStripeClient(environment).webhooks.constructEventAsync(await request.text(), signature, secret);
}
export async function markShopOrder(session: Stripe.Checkout.Session, environment: StripeEnv) {
  if (session.payment_status === 'unpaid') return;
  const { error } = await supabaseAdmin.from('shop_orders').update({
    status: 'paid', updated_at: new Date().toISOString(),
  }).eq('id', session.metadata!.orderId).eq('stripe_session_id', session.id).eq('environment', environment).eq('status', 'pending');
  if (error) throw error;
}
export async function markShopOrderFailed(session: Stripe.Checkout.Session, environment: StripeEnv) {
  if (!session.metadata?.orderId) return;
  const { error } = await supabaseAdmin.from('shop_orders').update({ status: 'failed', updated_at: new Date().toISOString() })
    .eq('id', session.metadata.orderId).eq('stripe_session_id', session.id).eq('environment', environment).eq('status', 'pending');
  if (error) throw error;
}

import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

function safeOrigin(origin: string) {
  const url = new URL(origin);
  const host = url.hostname;
  if (!['https:', 'http:'].includes(url.protocol) || !(host === 'localhost' || host === 'menutap.pt' || host === 'www.menutap.pt' || host.endsWith('.lovable.app'))) throw new Error('Invalid return origin');
  return url.origin;
}

export const createShopCheckout = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    environment: z.enum(['sandbox', 'live']), origin: z.string().url(), lang: z.enum(['pt', 'en']),
    productId: z.string().uuid(), restaurantId: z.string().uuid(), quantity: z.number().int().min(1).max(100),
  }))
  .handler(async ({ data, context }) => {
    const { createStripeClient, getStripeErrorMessage } = await import('@/lib/stripe.server');
    try {
      const { supabase, userId } = context;
      const { data: { user } } = await supabase.auth.getUser();
      const { data: member } = await supabase.from('restaurant_members').select('id').eq('restaurant_id', data.restaurantId).eq('user_id', userId).maybeSingle();
      if (!member) throw new Error('Not a member of this restaurant');
      const { data: product, error } = await supabase.from('shop_products').select('*').eq('id', data.productId).eq('active', true).single();
      if (error || !product) throw new Error('Product not available');
      if (product.price_cents < 50) throw new Error('Product price too low');
      const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
      const { data: order, error: oErr } = await supabaseAdmin.from('shop_orders').insert({
        user_id: userId, restaurant_id: data.restaurantId, product_id: product.id, product_name: product.name,
        quantity: data.quantity, amount_cents: product.price_cents * data.quantity, environment: data.environment,
      }).select('id').single();
      if (oErr) throw oErr;
      const stripe = createStripeClient(data.environment);
      const { resolveOrCreateCustomer } = await import('@/lib/billing.server');
      const customer = await resolveOrCreateCustomer(stripe, { userId, email: user?.email });
      const session = await stripe.checkout.sessions.create({
        mode: 'payment', ui_mode: 'embedded_page', locale: data.lang, customer,
        line_items: [{ quantity: data.quantity, price_data: { currency: 'eur', unit_amount: product.price_cents, tax_behavior: 'inclusive',
          product_data: { name: product.name, ...(product.description && { description: product.description.slice(0, 500) }), ...(product.image_url && { images: [product.image_url] }) } } }],
        shipping_address_collection: { allowed_countries: ['PT', 'ES'] },
        payment_intent_data: { description: product.name },
        metadata: { userId, orderId: order.id },
        return_url: `${safeOrigin(data.origin)}/dashboard/cards?session_id={CHECKOUT_SESSION_ID}`,
      });
      await supabaseAdmin.from('shop_orders').update({ stripe_session_id: session.id }).eq('id', order.id);
      if (!session.client_secret) throw new Error('Checkout did not return a payment form');
      return { clientSecret: session.client_secret };
    } catch (error) { return { error: getStripeErrorMessage(error) }; }
  });

export const confirmShopCheckout = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ environment: z.enum(['sandbox', 'live']), sessionId: z.string().regex(/^cs_[a-zA-Z0-9_]+$/) }))
  .handler(async ({ data, context }) => {
    const { createStripeClient, getStripeErrorMessage } = await import('@/lib/stripe.server');
    try {
      const session = await createStripeClient(data.environment).checkout.sessions.retrieve(data.sessionId);
      if (session.metadata?.userId !== context.userId) throw new Error('Checkout does not belong to this account');
      if (session.metadata?.orderId) {
        const { markShopOrder, markShopOrderFailed } = await import('@/lib/billing.server');
        const { shopOrderOutcome } = await import('@/lib/billing-rules');
        const outcome = shopOrderOutcome(session.status, session.payment_status);
        if (outcome === 'failed') await markShopOrderFailed(session, data.environment); else if (outcome === 'paid') await markShopOrder(session, data.environment);
      }
      return { paid: session.payment_status !== 'unpaid' };
    } catch (error) { return { error: getStripeErrorMessage(error) }; }
  });

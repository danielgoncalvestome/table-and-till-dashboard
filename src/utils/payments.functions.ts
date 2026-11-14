import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { PLANS } from '@/lib/billing-rules';
const env = z.enum(['sandbox', 'live']);
export const resolvePaddlePrice = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ priceId: z.string().refine(id => PLANS.some(p => p.priceId === id)), environment: env }))
  .handler(async ({ data }) => {
    const { gatewayFetch } = await import('@/lib/paddle.server');
    const res = await gatewayFetch(data.environment, `/prices?external_id=${encodeURIComponent(data.priceId)}`);
    const json = await res.json();
    if (!json.data?.length) throw new Error('Price not found');
    return json.data[0].id as string;
  });
export const createPortalSession = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ environment: env }))
  .handler(async ({ data, context }) => {
    const { data: sub, error } = await context.supabase.from('account_subscriptions').select('paddle_customer_id,paddle_subscription_id')
      .eq('user_id', context.userId).eq('environment', data.environment).not('paddle_customer_id', 'is', null)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (error || !sub?.paddle_customer_id) return { error: 'No subscription' };
    const { getPaddleClient } = await import('@/lib/paddle.server');
    const portal = await getPaddleClient(data.environment).customerPortalSessions.create(sub.paddle_customer_id, sub.paddle_subscription_id ? [sub.paddle_subscription_id] : []);
    return { url: portal.urls.general.overview };
  });
export const updatePlanPrice = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ priceId: z.string().refine(id => PLANS.some(p => p.priceId === id)), cents: z.number().int().min(100).max(100000) }))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    if (!isAdmin) throw new Error('Forbidden');
    const { gatewayFetch } = await import('@/lib/paddle.server');
    const results: Record<string, string> = {};
    for (const environment of ['sandbox', 'live'] as const) {
      try {
        const res = await gatewayFetch(environment, `/prices?external_id=${encodeURIComponent(data.priceId)}`);
        const price = (await res.json()).data?.[0];
        if (!price) { results[environment] = 'not_found'; continue; }
        const up = await gatewayFetch(environment, `/prices/${price.id}`, { method: 'PATCH', body: JSON.stringify({ unit_price: { amount: String(data.cents), currency_code: price.unit_price.currency_code } }) });
        results[environment] = up.ok ? 'ok' : `error_${up.status}`;
      } catch { results[environment] = 'unavailable'; }
    }
    if (results.sandbox !== 'ok' && results.live !== 'ok') throw new Error('Não foi possível atualizar o preço no sistema de pagamentos');
    const { error } = await context.supabase.from('plan_prices').upsert({ price_id: data.priceId, cents: data.cents, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return results;
  });

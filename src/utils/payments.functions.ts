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

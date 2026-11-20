import { createFileRoute } from '@tanstack/react-router';
import type { PaddleEnv } from '@/lib/paddle.server';
import { shouldEnableOnlineBooking } from '@/lib/billing-rules';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function upsert(data: any, env: PaddleEnv) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const item = data.items?.[0];
  const priceId = item?.price?.importMeta?.externalId;
  const productId = item?.product?.importMeta?.externalId;
  const row = { status: data.status, current_period_end: data.currentBillingPeriod?.endsAt ?? null,
    cancel_at_period_end: data.scheduledChange?.action === 'cancel', updated_at: new Date().toISOString(),
    ...(priceId && { price_id: priceId }), ...(productId && { product_id: productId }) };
  const { data: existing } = await supabaseAdmin.from('account_subscriptions').select('id,user_id').eq('paddle_subscription_id', data.id).maybeSingle();
  if (existing) { const { error } = await supabaseAdmin.from('account_subscriptions').update(row).eq('id', existing.id).eq('environment', env); if (error) throw error; await enableOnlineBooking(supabaseAdmin, existing.user_id, priceId, data.status); return; }
  const userId = data.customData?.userId;
  if (!userId || !priceId) { console.warn('Skipping subscription without userId/externalId'); return; }
  const { error } = await supabaseAdmin.from('account_subscriptions').insert({ ...row, price_id: priceId, user_id: userId, environment: env,
    paddle_subscription_id: data.id, paddle_customer_id: data.customerId });
  if (error) throw error;
  await enableOnlineBooking(supabaseAdmin, userId, priceId, data.status);
  await notifyOwner(supabaseAdmin, data, userId, priceId, env);
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function notifyOwner(supabaseAdmin: any, data: any, userId: string, priceId: string, env: PaddleEnv) {
  try {
    const { PLANS } = await import('@/lib/billing-rules');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const plan = (Object.values(PLANS as any) as any[]).find((p) => p?.priceId === priceId || p?.id === priceId)?.name ?? priceId;
    const { data: u } = await supabaseAdmin.auth.admin.getUserById(userId);
    const email = u?.user?.email && !String(u.user.email).endsWith('.invalid') ? u.user.email : (u?.user?.user_metadata?.username ?? userId);
    const { sendTemplateEmail } = await import('@/lib/email-templates/send-email');
    await sendTemplateEmail('owner-subscription-alert', 'danielgoncalvestome@gmail.com', { templateData: { plan, email, status: data.status, environment: env }, idempotencyKey: `owner-sub-${data.id}` });
  } catch (e) { console.error('subscription alert failed', e instanceof Error ? e.message : e); }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function enableOnlineBooking(supabaseAdmin: any, userId: string, priceId: string | undefined, status: string) {
  if (!shouldEnableOnlineBooking(priceId, status)) return;
  const { error } = await supabaseAdmin.from('restaurants').update({ booking_enabled: true }).eq('created_by', userId).eq('is_demo', false);
  if (error) console.error('Failed to enable online booking', error.message);
}
export const Route = createFileRoute('/api/public/payments/webhook')({ server: { handlers: { POST: async ({ request }) => {
  const env = new URL(request.url).searchParams.get('env');
  if (env !== 'sandbox' && env !== 'live') return new Response('Invalid environment', { status: 400 });
  const { verifyWebhook, EventName } = await import('@/lib/paddle.server');
  let event;
  try { event = await verifyWebhook(request, env); } catch { return new Response('Invalid signature', { status: 400 }); }
  try {
    if ([EventName.SubscriptionCreated, EventName.SubscriptionUpdated, EventName.SubscriptionCanceled].includes(event.eventType as never)) await upsert(event.data, env);
    return Response.json({ received: true });
  } catch (e) { console.error('Webhook error', e instanceof Error ? e.message : e); return new Response('Webhook error', { status: 500 }); }
} } } });

import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import type Stripe from 'stripe';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { BILLING_QUANTITY, MONTHLY_PRICE_ID, hasPaidAccess, remainingTrialEnd } from '@/lib/billing-rules';
const input = z.object({ environment: z.enum(['sandbox', 'live']), origin: z.string().url(), lang: z.enum(['pt','en']) });
function returnUrl(origin: string) {
  const url = new URL(origin);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid origin');
  // Only use public app origins or local preview; do not allow arbitrary return destinations.
  const host = url.hostname;
  if (!(host === 'localhost' || host === 'menutap.pt' || host === 'www.menutap.pt' || host.endsWith('.lovable.app'))) throw new Error('Invalid return origin');
  return `${url.origin}/dashboard/subscription`;
}
export const createCheckoutSession = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth]).inputValidator(input).handler(async ({ data, context }) => {
    const { createStripeClient, getStripeErrorMessage } = await import('@/lib/stripe.server');
    try {
      const { userId, supabase } = context;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication required');
      const { data: restaurants, error: rError } = await supabase.from('restaurants').select('trial_started_at,trial_ends_at,created_by').eq('created_by',userId).eq('is_demo',false);
      if (rError) throw rError;
      if (!restaurants?.some(r=>r.trial_started_at)) throw new Error('Create and publish your restaurant first');
      const { data: rows, error } = await supabase.from('account_subscriptions').select('*').eq('user_id',userId).eq('environment',data.environment);
      if (error) throw error;
      if (rows?.some(s => hasPaidAccess(s.status,s.current_period_end))) throw new Error('An account subscription already exists');
      const stripe = createStripeClient(data.environment);
      const { resolveOrCreateCustomer } = await import('@/lib/billing.server');
      const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
      const { error: accountError } = await supabaseAdmin.from('billing_accounts').upsert({ user_id:userId,environment:data.environment }, { onConflict:'user_id,environment',ignoreDuplicates:true });
      if (accountError) throw accountError;
      const { data: account, error: aError } = await supabaseAdmin.from('billing_accounts').select('*').eq('user_id',userId).eq('environment',data.environment).single();
      if (aError) throw aError;
      if (account.checkout_session_id) {
        const previous = await stripe.checkout.sessions.retrieve(account.checkout_session_id);
        if (previous.status === 'open' && previous.client_secret) return { clientSecret:previous.client_secret };
      }
      const customerId = account.stripe_customer_id ?? await resolveOrCreateCustomer(stripe,{userId,email:user.email});
      const existing = await stripe.subscriptions.list({customer:customerId,status:'all',limit:100});
      if (existing.data.some(s=> ['active','trialing','past_due','unpaid','paused','incomplete'].includes(s.status))) throw new Error('An account subscription already exists');
      const prices = await stripe.prices.list({lookup_keys:[MONTHLY_PRICE_ID],active:true});
      const price = prices.data[0];
      if (!price) throw new Error('Monthly price not found');
      const { data: settings, error: settingsError } = await supabase.from('platform_settings').select('monthly_price_cents').eq('id',1).single();
      if (settingsError) throw settingsError;
      // Dynamic admin price is honored without replacing the catalog's permanent lookup key.
      const product = typeof price.product === 'string' ? price.product : price.product.id;
      const trialEnd = rows?.length ? undefined : remainingTrialEnd([account.trial_ends_at, ...restaurants.map(r=>r.trial_ends_at)]);
      const session = await stripe.checkout.sessions.create({
        line_items:[{price_data:{product,currency:'eur',unit_amount:settings.monthly_price_cents,recurring:{interval:'month'},tax_behavior:'inclusive'},quantity:BILLING_QUANTITY}],
        mode:'subscription',ui_mode:'embedded_page',locale:data.lang,
        customer:customerId,return_url:`${returnUrl(data.origin)}?session_id={CHECKOUT_SESSION_ID}`,
        managed_payments:{enabled:true},metadata:{userId,managed_payments:'true'},
        subscription_data:{metadata:{userId,priceId:MONTHLY_PRICE_ID},...(trialEnd && {trial_end:trialEnd})},
      } as Stripe.Checkout.SessionCreateParams, { idempotencyKey:`menutap-${data.environment}-${userId}-${account.checkout_session_id ?? 'first'}` });
      if (!session.client_secret) throw new Error('Checkout did not return a payment form');
      const { error: saveError } = await supabaseAdmin.from('billing_accounts').update({stripe_customer_id:customerId,checkout_session_id:session.id,checkout_expires_at:new Date(session.expires_at*1000).toISOString(),...(trialEnd && {trial_ends_at:new Date(trialEnd*1000).toISOString()})}).eq('user_id',userId).eq('environment',data.environment);
      if(saveError) throw saveError;
      return {clientSecret:session.client_secret};
    } catch (error) { return {error:getStripeErrorMessage(error)}; }
  });
export const getCheckoutResult = createServerFn({method:'POST'}).middleware([requireSupabaseAuth])
  .inputValidator(z.object({environment:z.enum(['sandbox','live']),sessionId:z.string().regex(/^cs_[a-zA-Z0-9_]+$/)}))
  .handler(async ({data,context})=> {
    const {createStripeClient,getStripeErrorMessage}=await import('@/lib/stripe.server');
    try {
      const stripe=createStripeClient(data.environment);
      const session=await stripe.checkout.sessions.retrieve(data.sessionId);
      if(session.metadata?.userId!==context.userId) throw new Error('Checkout does not belong to this account');
      if(session.status==='complete' && session.payment_status!=='unpaid' && session.subscription) {
        const sub=await stripe.subscriptions.retrieve(typeof session.subscription==='string'?session.subscription:session.subscription.id);
        const {syncSubscription}=await import('@/lib/billing.server');
        await syncSubscription(sub,data.environment);
      }
      return {status:session.status,paymentStatus:session.payment_status};
    } catch(error) {return {error:getStripeErrorMessage(error)};}
  });
export const createPortalSession = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(input)
 .handler(async ({data,context})=> {
  const {createStripeClient,getStripeErrorMessage}=await import('@/lib/stripe.server');
  try {
    const {data:account,error}=await context.supabase.from('billing_accounts').select('stripe_customer_id').eq('user_id',context.userId).eq('environment',data.environment).single();
    if(error || !account.stripe_customer_id) throw new Error('No billing account');
    const stripe=createStripeClient(data.environment);
    const configuration=await stripe.billingPortal.configurations.create({
      business_profile:{headline:'MenuTap'},
      features:{customer_update:{enabled:true,allowed_updates:['address','name']},invoice_history:{enabled:true},payment_method_update:{enabled:true},subscription_cancel:{enabled:true,mode:'at_period_end'},subscription_update:{enabled:false}},
    });
    const portal=await stripe.billingPortal.sessions.create({customer:account.stripe_customer_id,configuration:configuration.id,return_url:returnUrl(data.origin),locale:data.lang});
    return {url:portal.url};
  }catch(error){return {error:getStripeErrorMessage(error)};}
 });

export type Plan = { priceId: string; productId: string; cents: number; name: string };
/** Monthly plans, distinguished only by tier name. */
export const PLANS: Plan[] = [
  { priceId: 'menutap_monthly', productId: 'menutap_base', cents: 990, name: 'Base' },
  { priceId: 'menutap_6_monthly', productId: 'menutap_6', cents: 1790, name: 'Pro' },
  { priceId: 'menutap_9_monthly', productId: 'menutap_9', cents: 2490, name: 'Business' },
  { priceId: 'menutap_16_monthly', productId: 'menutap_16', cents: 3990, name: 'Enterprise' },
];
export const MONTHLY_PRICE_ID = PLANS[0].priceId;
export const BILLING_QUANTITY = 1;
export function planByPrice(priceId: string | null | undefined) { return PLANS.find(p => p.priceId === priceId); }
export function hasPaidAccess(status: string, end: string | null, now = Date.now()) {
  return ['active', 'trialing', 'past_due', 'canceled'].includes(status) && (end ? Date.parse(end) > now : status !== 'canceled');
}
export function paymentEnvironment(token: string | undefined): 'sandbox' | 'live' | null {
  if (token?.startsWith('test_')) return 'sandbox';
  if (token?.startsWith('live_')) return 'live';
  return null;
}

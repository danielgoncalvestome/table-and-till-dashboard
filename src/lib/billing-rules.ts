export type Plan = { priceId: string; productId: string; cents: number; name: string; devices: number | 'per_table'; reservations: boolean };
/** Current monthly digital licences. Default cents are overridden by admin-edited plan_prices rows. */
export const PLANS: Plan[] = [
  { priceId: 'menutap_monthly', productId: 'menutap_base', cents: 990, name: 'Menu Digital', devices: 4, reservations: false },
  { priceId: 'menutap_reservas_monthly', productId: 'menutap_reservas', cents: 1990, name: 'Gestão e Reservas', devices: 'per_table', reservations: true },
];
/** Retired tiers kept only so existing subscriptions still show a plan name. */
const LEGACY_PLANS: Plan[] = [
  { priceId: 'menutap_6_monthly', productId: 'menutap_6', cents: 1790, name: 'Pro', devices: 6, reservations: false },
  { priceId: 'menutap_9_monthly', productId: 'menutap_9', cents: 2490, name: 'Business', devices: 9, reservations: false },
  { priceId: 'menutap_16_monthly', productId: 'menutap_16', cents: 3990, name: 'Enterprise', devices: 16, reservations: false },
];
export const MONTHLY_PRICE_ID = PLANS[0].priceId;
export const BILLING_QUANTITY = 1;
export const MIN_PLAN_CENTS = 100;
export const MAX_PLAN_CENTS = 100000;
export function planByPrice(priceId: string | null | undefined) { return [...PLANS, ...LEGACY_PLANS].find(p => p.priceId === priceId); }
export function withPrices(overrides: { price_id: string; cents: number }[] | null | undefined): Plan[] {
  return PLANS.map(p => ({ ...p, cents: overrides?.find(o => o.price_id === p.priceId)?.cents ?? p.cents }));
}
export function validPlanCents(cents: number) { return Number.isInteger(cents) && cents >= MIN_PLAN_CENTS && cents <= MAX_PLAN_CENTS; }
export function hasPaidAccess(status: string, end: string | null, now = Date.now()) {
  return ['active', 'trialing', 'past_due', 'canceled'].includes(status) && (end ? Date.parse(end) > now : status !== 'canceled');
}
export function paymentEnvironment(token: string | undefined): 'sandbox' | 'live' | null {
  if (token?.startsWith('test_')) return 'sandbox';
  if (token?.startsWith('live_')) return 'live';
  return null;
}

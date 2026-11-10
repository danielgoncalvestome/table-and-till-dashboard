export const MONTHLY_PRICE_ID = 'menutap_monthly';
export const BILLING_QUANTITY = 1;
export function hasPaidAccess(status: string, end: string | null, now = Date.now()) {
  return ['active', 'trialing', 'past_due', 'canceled'].includes(status) && (end ? Date.parse(end) > now : status !== 'canceled');
}
export function remainingTrialEnd(ends: (string | null)[], now = Date.now()) {
  const dates = ends.filter((x): x is string => !!x).map(Date.parse).filter(Number.isFinite);
  const earliest = dates.length ? Math.min(...dates) : 0;
  return earliest > now ? Math.floor(earliest / 1000) : undefined;
}
export function paymentEnvironment(token: string | undefined): 'sandbox' | 'live' | null {
  if (token?.startsWith('pk_test_')) return 'sandbox';
  if (token?.startsWith('pk_live_')) return 'live';
  return null;
}
/** Shop order outcome from a Checkout Session: paid, failed (expired/declined) or still waiting. */
export function shopOrderOutcome(sessionStatus: string | null, paymentStatus: string, asyncFailed = false): 'paid' | 'failed' | null {
  if (asyncFailed || sessionStatus === 'expired') return 'failed';
  if (sessionStatus === 'complete' && paymentStatus !== 'unpaid') return 'paid';
  return null;
}

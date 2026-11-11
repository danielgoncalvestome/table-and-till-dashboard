import { resolvePaddlePrice } from '@/utils/payments.functions';
import { paymentEnvironment } from './billing-rules';
const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN;
declare global { interface Window { Paddle: any } } // eslint-disable-line @typescript-eslint/no-explicit-any
export function getPaddleEnvironment() { return paymentEnvironment(clientToken); }
let ready: Promise<void> | null = null;
export function initializePaddle() {
  ready ??= new Promise<void>((resolve, reject) => {
    if (!clientToken) return reject(new Error('Payments are not configured'));
    const s = document.createElement('script');
    s.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    s.onload = () => { window.Paddle.Environment.set(getPaddleEnvironment() === 'sandbox' ? 'sandbox' : 'production'); window.Paddle.Initialize({ token: clientToken }); resolve(); };
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return ready;
}
export async function openPlanCheckout(o: { priceId: string; userId: string; email?: string; lang: string }) {
  const environment = getPaddleEnvironment();
  if (!environment) throw new Error('Payments are not configured');
  await initializePaddle();
  const id = await resolvePaddlePrice({ data: { priceId: o.priceId, environment } });
  window.Paddle.Checkout.open({ items: [{ priceId: id, quantity: 1 }], customer: o.email ? { email: o.email } : undefined,
    customData: { userId: o.userId }, settings: { displayMode: 'overlay', locale: o.lang, allowLogout: false, variant: 'one-page',
      successUrl: `${window.location.origin}/dashboard/subscription?checkout=success` } });
}

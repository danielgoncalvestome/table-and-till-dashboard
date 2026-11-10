import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { paymentEnvironment } from './billing-rules';
const token = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN;
let promise: Promise<Stripe | null> | null = null;
export function getStripeEnvironment() { return paymentEnvironment(token); }
export function getStripe() {
  if (!token || !getStripeEnvironment()) throw new Error('Payments are not configured');
  promise ??= loadStripe(token);
  return promise;
}

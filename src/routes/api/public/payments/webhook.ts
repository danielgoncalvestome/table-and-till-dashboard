import { createFileRoute } from '@tanstack/react-router';
export const Route = createFileRoute('/api/public/payments/webhook')({server:{handlers:{POST:async({request})=>{
  const environment=new URL(request.url).searchParams.get('env');
  if(environment!=='sandbox' && environment!=='live') return new Response('Invalid environment',{status:400});
  const {verifyPaymentEvent,syncSubscription}=await import('@/lib/billing.server');
  let event;
  try {event=await verifyPaymentEvent(request,environment);} catch {return new Response('Invalid webhook signature',{status:400});}
  try {
    const {createStripeClient}=await import('@/lib/stripe.server');
    const stripe=createStripeClient(environment);
    if(event.type.startsWith('customer.subscription.')) {
      const object=event.data.object;
      if('id' in object && typeof object.id==='string') await syncSubscription(await stripe.subscriptions.retrieve(object.id),environment);
    } else if(event.type==='checkout.session.completed' || event.type==='checkout.session.async_payment_succeeded') {
      const session=event.data.object;
      if(session.payment_status!=='unpaid' && session.subscription) await syncSubscription(await stripe.subscriptions.retrieve(typeof session.subscription==='string'?session.subscription:session.subscription.id),environment);
    } else if(event.type==='invoice.paid' || event.type==='invoice.payment_failed') {
      const sub=event.data.object.parent?.subscription_details?.subscription;
      if(sub) await syncSubscription(await stripe.subscriptions.retrieve(typeof sub==='string'?sub:sub.id),environment);
    }
    return Response.json({received:true});
  } catch(error) {console.error('Payment reconciliation failed',error instanceof Error?error.message:'Unknown error');return new Response('Reconciliation failed',{status:500});}
}}}});

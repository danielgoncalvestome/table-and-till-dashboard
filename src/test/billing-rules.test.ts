import {describe,expect,it} from 'vitest';
import {BILLING_QUANTITY,MONTHLY_PRICE_ID,hasPaidAccess,paymentEnvironment,remainingTrialEnd} from '@/lib/billing-rules';
describe('account subscription rules',()=>{
  const now=Date.parse('2026-11-10T17:00:00Z');
  it('keeps account access until the canceled paid period ends',()=>{
    expect(hasPaidAccess('canceled','2026-11-20T17:00:00Z',now)).toBe(true);
    expect(hasPaidAccess('canceled','2026-11-10T17:00:00Z',now)).toBe(false);
    expect(hasPaidAccess('canceled',null,now)).toBe(false);
  });
  it('preserves the existing ten-day trial rather than starting another',()=>{
    expect(remainingTrialEnd(['2026-11-20T17:00:00Z','2026-11-25T17:00:00Z'],now)).toBe(Date.parse('2026-11-20T17:00:00Z')/1000);
    expect(remainingTrialEnd(['2026-11-09T17:00:00Z','2026-11-25T17:00:00Z'],now)).toBeUndefined();
  });
  it('has one flat-rate monthly account plan',()=>{
    expect(MONTHLY_PRICE_ID).toBe('menutap_monthly');
    expect(BILLING_QUANTITY).toBe(1);
  });
  it('never treats missing or test payment configuration as live',()=>{
    expect(paymentEnvironment(undefined)).toBeNull();
    expect(paymentEnvironment('pk_test_example')).toBe('sandbox');
    expect(paymentEnvironment('pk_live_example')).toBe('live');
  });
});
import {describe,expect,it} from 'vitest';
import {PLANS,hasPaidAccess,paymentEnvironment,withPrices,validPlanCents,planByPrice} from '@/lib/billing-rules';
describe('account subscription rules',()=>{
  const now=Date.parse('2026-11-10T17:00:00Z');
  it('keeps account access until the canceled paid period ends',()=>{
    expect(hasPaidAccess('canceled','2026-11-20T17:00:00Z',now)).toBe(true);
    expect(hasPaidAccess('canceled','2026-11-10T17:00:00Z',now)).toBe(false);
  });
  it('has the two agreed plans',()=>{
    expect(PLANS.map(p=>[p.priceId,p.cents])).toEqual([['menutap_monthly',990],['menutap_reservas_monthly',1990]]);
    expect(PLANS.map(p=>p.devices)).toEqual([4,'per_table']);
    expect(PLANS.map(p=>p.reservations)).toEqual([false,true]);
  });
  it('uses admin-set prices over defaults',()=>{
    expect(withPrices([{price_id:'menutap_reservas_monthly',cents:2490}]).map(p=>p.cents)).toEqual([990,2490]);
    expect(validPlanCents(50)).toBe(false);
    expect(validPlanCents(1290)).toBe(true);
  });
  it('still names retired tiers for existing subscribers',()=>{
    expect(planByPrice('menutap_6_monthly')?.name).toBe('Pro');
  });
  it('never treats missing or test payment configuration as live',()=>{
    expect(paymentEnvironment(undefined)).toBeNull();
    expect(paymentEnvironment('test_abc')).toBe('sandbox');
    expect(paymentEnvironment('live_abc')).toBe('live');
  });
});

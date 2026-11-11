import {describe,expect,it} from 'vitest';
import {PLANS,hasPaidAccess,paymentEnvironment} from '@/lib/billing-rules';
describe('account subscription rules',()=>{
  const now=Date.parse('2026-11-10T17:00:00Z');
  it('keeps account access until the canceled paid period ends',()=>{
    expect(hasPaidAccess('canceled','2026-11-20T17:00:00Z',now)).toBe(true);
    expect(hasPaidAccess('canceled','2026-11-10T17:00:00Z',now)).toBe(false);
  });
  it('has the four agreed plans with included identifiers',()=>{
    expect(PLANS.map(p=>[p.cents,p.identifiers])).toEqual([[990,4],[1790,6],[2490,9],[3990,16]]);
  });
  it('never treats missing or test payment configuration as live',()=>{
    expect(paymentEnvironment(undefined)).toBeNull();
    expect(paymentEnvironment('test_abc')).toBe('sandbox');
    expect(paymentEnvironment('live_abc')).toBe('live');
  });
});

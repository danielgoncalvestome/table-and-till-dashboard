import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PLANS, withPrices } from './billing-rules';
export function usePlans() {
  const { data } = useQuery({ queryKey: ['plan_prices'], queryFn: async () => (await supabase.from('plan_prices').select('price_id,cents')).data ?? [] });
  return data ? withPrices(data) : PLANS;
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurant } from "@/lib/restaurant";
import { dayRange } from "@/lib/reservations";

export function useResData(date: string) {
  const { restaurant: r } = useRestaurant();
  const [s, e] = dayRange(date);
  const zones = useQuery({ queryKey: ["zones", r.id], queryFn: async () => (await supabase.from("zones").select("*").eq("restaurant_id", r.id).order("position")).data ?? [] });
  const tables = useQuery({ queryKey: ["tables", r.id], queryFn: async () => (await supabase.from("dining_tables").select("*").eq("restaurant_id", r.id).order("position").order("label")).data ?? [] });
  const res = useQuery({ queryKey: ["reservations", r.id, date], refetchInterval: 20000, queryFn: async () => (await supabase.from("reservations").select("*").eq("restaurant_id", r.id).gte("starts_at", s).lt("starts_at", e).order("starts_at")).data ?? [] });
  return { r, zones: zones.data ?? [], tables: tables.data ?? [], res: res.data ?? [] };
}

export function useResRange(fromIso: string, toIso: string, key: string) {
  const { restaurant: r } = useRestaurant();
  return useQuery({ queryKey: ["reservations-range", r.id, key], queryFn: async () => (await supabase.from("reservations").select("*").eq("restaurant_id", r.id).gte("starts_at", fromIso).lt("starts_at", toIso).order("starts_at").limit(5000)).data ?? [] });
}

import { createContext, useContext, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Restaurant = Database["public"]["Tables"]["restaurants"]["Row"];

export function useMyRestaurants() {
  return useQuery({
    queryKey: ["my-restaurants"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data: mem, error } = await supabase.from("restaurant_members").select("role, permissions, restaurant:restaurants(*)").eq("user_id", u.user.id);
      if (error) throw error;
      return (mem ?? []).filter((m) => m.restaurant).map((m) => ({ role: m.role as string, permissions: (m.permissions ?? {}) as Record<string, boolean>, ...(m.restaurant as Restaurant) }));
    },
  });
}

export function useIsAdmin() {
  return useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return false;
      const { data } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
      return !!data;
    },
  });
}

type Ctx = { restaurant: Restaurant & { role: string; permissions?: Record<string, boolean> }; refresh: () => void };
const RCtx = createContext<Ctx | null>(null);

export function RestaurantProvider({ restaurant, children }: { restaurant: Restaurant & { role: string; permissions?: Record<string, boolean> }; children: ReactNode }) {
  const qc = useQueryClient();
  return <RCtx.Provider value={{ restaurant, refresh: () => { qc.invalidateQueries({ queryKey: ["my-restaurants"] }); qc.invalidateQueries({ queryKey: ["admin-managed"] }); } }}>{children}</RCtx.Provider>;
}

export function useRestaurant() {
  const c = useContext(RCtx);
  if (!c) throw new Error("useRestaurant outside provider");
  return c;
}

export async function audit(action: string, restaurant_id: string | null, details: Record<string, unknown> = {}) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from("audit_logs").insert({ actor_id: data.user.id, restaurant_id, action, details: details as never });
}

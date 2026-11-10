import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** All menus/categories/dishes for a restaurant (member view, incl. archived). */
export function useCatalog(restaurantId: string) {
  return useQuery({
    queryKey: ["catalog", restaurantId],
    queryFn: async () => {
      const [m, c, d] = await Promise.all([
        supabase.from("menus").select("*").eq("restaurant_id", restaurantId).order("position"),
        supabase.from("categories").select("*").eq("restaurant_id", restaurantId).order("position"),
        supabase.from("dishes").select("*").eq("restaurant_id", restaurantId).order("position"),
      ]);
      if (m.error || c.error || d.error) throw m.error ?? c.error ?? d.error;
      return { menus: m.data, cats: c.data, dishes: d.data };
    },
  });
}

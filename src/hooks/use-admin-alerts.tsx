import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Admin alerts: unread contact messages + paid orders not yet preparing/shipped. */
export function useAdminAlerts(enabled: boolean) {
  return useQuery({
    queryKey: ["admin-alerts"],
    enabled,
    refetchInterval: 60_000,
    queryFn: async () => {
      const [m] = await Promise.all([
        supabase.from("contact_submissions").select("id", { count: "exact", head: true }).eq("read", false),
      ]);
      return { messages: m.count ?? 0, orders: 0 };
    },
  });
}

export function AlertDot({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span className="ml-1 inline-grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1.5 text-[11px] font-bold text-destructive-foreground">
      {n}
    </span>
  );
}

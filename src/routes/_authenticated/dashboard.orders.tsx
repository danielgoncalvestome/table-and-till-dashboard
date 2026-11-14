import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PageTitle } from "@/components/dash/ui";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurant } from "@/lib/restaurant";
import { formatPrice } from "@/lib/menu";
import { ORDER_STATUSES, ORDER_STATUS_LABEL, orderOptions, type CartLine } from "@/lib/orders";

export const Route = createFileRoute("/_authenticated/dashboard/orders")({
  head: () => ({ meta: [{ title: "Pedidos — MenuTap" }, { name: "description", content: "Pedidos ao vivo das mesas." }, { property: "og:title", content: "Pedidos — MenuTap" }, { property: "og:description", content: "Pedidos ao vivo das mesas." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Orders,
});

function beep() {
  try { const ctx = new AudioContext(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value = 880; g.gain.value = 0.15; o.start(); o.stop(ctx.currentTime + 0.35); } catch { /* audio blocked */ }
}

function Orders() {
  const { restaurant: r, refresh } = useRestaurant();
  const opt = orderOptions(r.order_options);
  const { data: hasPlan } = useQuery({ queryKey: ["orders-plan", r.id], queryFn: async () => (await supabase.rpc("has_orders_plan", { _restaurant_id: r.id })).data ?? false });
  const { data: orders, refetch } = useQuery({ queryKey: ["orders", r.id], queryFn: async () => (await supabase.from("table_orders").select("*").eq("restaurant_id", r.id).eq("cleared", false).order("created_at")).data ?? [] });
  const soundRef = useRef(opt.sound); soundRef.current = opt.sound;

  useEffect(() => {
    const ch = supabase.channel(`orders-${r.id}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "table_orders", filter: `restaurant_id=eq.${r.id}` }, (p) => {
        if (p.eventType === "INSERT") { if (soundRef.current) beep(); toast(`Novo pedido · Mesa ${(p.new as { table_label: string }).table_label}`, { icon: <Bell className="h-4 w-4" /> }); }
        refetch();
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [r.id, refetch]);

  async function saveOpt(patch: Partial<typeof opt> & { enabled?: boolean }) {
    const { enabled, ...rest } = patch;
    const upd: { order_options: typeof opt; orders_enabled?: boolean } = { order_options: { ...opt, ...rest } };
    if (enabled !== undefined) upd.orders_enabled = enabled;
    const { error } = await supabase.from("restaurants").update(upd).eq("id", r.id);
    if (error) return toast.error(error.message);
    refresh();
  }
  async function setStatus(id: string, status: string) { await supabase.from("table_orders").update({ status, updated_at: new Date().toISOString() }).eq("id", id); refetch(); }
  async function clearTable(tableId: string | null, label: string) {
    if (!confirm(`Limpar os pedidos da mesa ${label}?`)) return;
    let q = supabase.from("table_orders").update({ cleared: true }).eq("restaurant_id", r.id).eq("cleared", false);
    q = tableId ? q.eq("table_id", tableId) : q.is("table_id", null);
    await q; refetch();
  }

  const groups = new Map<string, { tableId: string | null; label: string; list: NonNullable<typeof orders> }>();
  for (const o of orders ?? []) { const k = o.table_id ?? "none"; if (!groups.has(k)) groups.set(k, { tableId: o.table_id, label: o.table_label, list: [] }); groups.get(k)!.list.push(o); }
  const toggles: [keyof typeof opt, string][] = [["statuses", "Estados do pedido"], ["sound", "Alerta sonoro"], ["notes", "Notas por prato"], ["bill", "Conta da mesa"]];

  return (
    <div>
      <PageTitle title="Pedidos" sub="Pedidos feitos pelos clientes através do link da mesa, ao vivo." />
      {hasPlan === false && <div className="mb-4 rounded-xl border border-st-reserved/40 bg-card p-4 text-sm">Os pedidos pelo menu estão incluídos no plano <strong>Gestão e Reservas (19,90 €/mês)</strong>. Pode configurar já, mas só aparecem no menu com esse plano ativo.</div>}
      <div className="mb-6 rounded-2xl border bg-card p-4">
        <label className="flex items-center justify-between gap-3 font-medium"><span>Aceitar pedidos pelo menu</span><Switch checked={r.orders_enabled} onCheckedChange={(v) => saveOpt({ enabled: v })} /></label>
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          {toggles.map(([k, l]) => <label key={k} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"><span>{l}</span><Switch checked={opt[k]} onCheckedChange={(v) => saveOpt({ [k]: v })} /></label>)}
        </div>
      </div>
      {groups.size === 0 && <p className="text-sm text-muted-foreground">Sem pedidos em aberto.</p>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[...groups.values()].map((g) => {
          const total = g.list.filter((o) => o.status !== "cancelled").reduce((a, o) => a + Number(o.total), 0);
          return (
            <section key={g.tableId ?? "none"} className="min-w-0 rounded-2xl border bg-card p-4">
              <div className="mb-3 flex items-center justify-between"><h2 className="font-sans text-lg font-semibold">Mesa {g.label}</h2><Button size="sm" variant="outline" onClick={() => clearTable(g.tableId, g.label)}>Libertar pedidos</Button></div>
              <div className="space-y-3">
                {g.list.map((o) => (
                  <div key={o.id} className={`rounded-lg border p-3 text-sm ${o.status === "new" ? "border-st-seated" : ""}`}>
                    <p className="mb-1 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}</p>
                    {(o.items as CartLine[]).map((l, i) => <p key={i}><strong>{l.qty}×</strong> {l.name}{opt.notes && l.note ? <span className="text-muted-foreground"> — {l.note}</span> : null}</p>)}
                    {opt.statuses && <div className="mt-2 flex flex-wrap gap-1">{ORDER_STATUSES.map((s) => <button key={s} onClick={() => setStatus(o.id, s)} className={`rounded-full border px-2 py-0.5 text-xs ${o.status === s ? "bg-foreground text-background" : ""}`}>{ORDER_STATUS_LABEL.pt[s]}</button>)}</div>}
                  </div>
                ))}
              </div>
              {opt.bill && <p className="mt-3 flex justify-between border-t pt-2 font-semibold"><span>Conta</span><span>{formatPrice(total)} €</span></p>}
            </section>
          );
        })}
      </div>
    </div>
  );
}

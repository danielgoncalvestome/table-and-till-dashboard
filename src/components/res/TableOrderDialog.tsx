import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Minus, Plus, Search, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

const eur = (n: number) => n.toLocaleString("pt-PT", { style: "currency", currency: "EUR" });

export function TableOrderDialog({ restaurantId, table, onClose }: { restaurantId: string; table: { id: string; label: string } | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const { data } = useQuery({
    queryKey: ["staff-menu", restaurantId],
    enabled: !!table,
    queryFn: async () => {
      const [c, d] = await Promise.all([
        supabase.from("categories").select("id,name,position").eq("restaurant_id", restaurantId).order("position"),
        supabase.from("dishes").select("id,name,price,promo_price,category_id,available,position").eq("restaurant_id", restaurantId).eq("archived", false).order("position"),
      ]);
      return { cats: c.data ?? [], dishes: d.data ?? [] };
    },
  });
  const groups = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (data?.cats ?? []).map((c) => ({ c, items: (data?.dishes ?? []).filter((d) => d.category_id === c.id && (!s || d.name.toLowerCase().includes(s))) })).filter((g) => g.items.length);
  }, [data, q]);
  const priceOf = (d: { price: number; promo_price: number | null }) => Number(d.promo_price ?? d.price);
  const lines = (data?.dishes ?? []).filter((d) => cart[d.id]);
  const total = lines.reduce((a, d) => a + priceOf(d) * cart[d.id], 0);
  const add = (id: string, n: number) => setCart((c) => { const v = Math.max(0, (c[id] ?? 0) + n); const x = { ...c, [id]: v }; if (!v) delete x[id]; return x; });
  const close = () => { setCart({}); setQ(""); onClose(); };
  async function send() {
    if (!table || !lines.length) return;
    setBusy(true);
    const { error } = await supabase.rpc("staff_place_order", { _table_id: table.id, _items: lines.map((d) => ({ dish_id: d.id, qty: cart[d.id] })) });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Pedido enviado — mesa ${table.label}`);
    qc.invalidateQueries({ queryKey: ["orders"] });
    close();
  }
  return (
    <Dialog open={!!table} onOpenChange={(o) => !o && close()}>
      <DialogContent className="flex max-h-[85vh] max-w-lg flex-col gap-3">
        <DialogHeader><DialogTitle>Novo pedido · Mesa {table?.label}</DialogTitle></DialogHeader>
        <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Procurar prato" className="pl-8" /></div>
        <div className="-mx-1 flex-1 space-y-4 overflow-y-auto px-1">
          {!groups.length && <p className="py-6 text-center text-sm text-muted-foreground">Sem pratos.</p>}
          {groups.map(({ c, items }) => (
            <div key={c.id}>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{c.name}</p>
              <div className="divide-y rounded-lg border">
                {items.map((d) => (
                  <div key={d.id} className={`flex items-center gap-2 px-3 py-2 ${d.available ? "" : "opacity-50"}`}>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm">{d.name}</p><p className="text-xs text-muted-foreground">{eur(priceOf(d))}{!d.available && " · indisponível"}</p></div>
                    {cart[d.id] ? <>
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => add(d.id, -1)}><Minus className="h-3 w-3" /></Button>
                      <span className="w-5 text-center text-sm tabular-nums">{cart[d.id]}</span>
                    </> : null}
                    <Button size="icon" variant={cart[d.id] ? "default" : "outline"} className="h-7 w-7" onClick={() => add(d.id, 1)}><Plus className="h-3 w-3" /></Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-sm"><span className="text-muted-foreground">{lines.reduce((a, d) => a + cart[d.id], 0)} itens · </span><b>{eur(total)}</b></span>
          <Button onClick={send} disabled={!lines.length || busy}><Send className="mr-1.5 h-4 w-4" />Enviar pedido</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const ST: Record<string, string> = { new: "Novo", preparing: "Em preparação", ready: "Pronto", delivered: "Entregue", cancelled: "Cancelado" };
export function TableOrdersList({ restaurantId, tableId }: { restaurantId: string; tableId: string }) {
  const { data = [] } = useQuery({
    queryKey: ["orders", restaurantId, "table", tableId],
    queryFn: async () => (await supabase.from("table_orders").select("id,items,total,status,created_at").eq("table_id", tableId).eq("cleared", false).order("created_at")).data ?? [],
  });
  if (!data.length) return <p className="mt-2 text-xs text-muted-foreground">Sem pedidos nesta mesa.</p>;
  const total = data.filter((o) => o.status !== "cancelled").reduce((a, o) => a + Number(o.total), 0);
  return (
    <div className="mt-3 space-y-1.5">
      <div className="flex justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground"><span>Pedidos ({data.length})</span><span>{eur(total)}</span></div>
      <div className="max-h-48 space-y-1.5 overflow-y-auto">
        {data.map((o) => (
          <div key={o.id} className={`rounded-md border px-2 py-1.5 text-xs ${o.status === "cancelled" ? "opacity-50" : ""}`}>
            <div className="flex justify-between text-muted-foreground"><span>{new Date(o.created_at).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })} · {ST[o.status] ?? o.status}</span><span>{eur(Number(o.total))}</span></div>
            {(o.items as { name: string; qty: number }[]).map((it, i) => <p key={i}>{it.qty}× {it.name}</p>)}
          </div>
        ))}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, Plus, Minus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Lang } from "@/lib/i18n";
import { formatPrice, tr } from "@/lib/menu";
import { ORDER_STATUS_LABEL, orderOptions, cartTotal, type CartLine } from "@/lib/orders";

type D = { id: string; name: string; name_i18n: unknown; price: number; promo_price: number | null; available: boolean; category_id: string };
type C = { id: string; name: string; name_i18n: unknown };

const T = {
  pt: { order: "Pedir", mine: "A minha mesa", send: "Enviar pedido", note: "Nota (ex.: sem cebola)", empty: "Ainda não há pedidos.", bill: "Conta", sent: "Pedido enviado!", table: "Mesa", add: "Adicionar" },
  en: { order: "Order", mine: "My table", send: "Send order", note: "Note (e.g. no onion)", empty: "No orders yet.", bill: "Bill", sent: "Order sent!", table: "Table", add: "Add" },
};

/** Live ordering for a table NFC link (?t=token). Renders nothing unless the restaurant has it enabled and on the right plan. */
export function TableOrdering({ dishes, cats, lang, style }: { dishes: D[]; cats: C[]; lang: Lang; style: React.CSSProperties }) {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => { setToken(new URLSearchParams(window.location.search).get("t")); }, []);
  const { data: info } = useQuery({ queryKey: ["table-info", token], enabled: !!token, queryFn: async () => (await supabase.rpc("public_table_info", { _token: token! })).data?.[0] ?? null });
  const on = !!info?.orders_on;
  const { data: orders, refetch } = useQuery({ queryKey: ["table-orders", token], enabled: on, refetchInterval: 8000, queryFn: async () => (await supabase.rpc("public_table_orders", { _token: token! })).data ?? [] });
  const [open, setOpen] = useState<null | "menu" | "mine">(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");
  if (!on || !info) return null;
  const opt = orderOptions(info.options);
  const u = T[lang];
  const price = (d: D) => Number(d.promo_price ?? d.price);
  const qty = (id: string) => cart.filter((l) => l.dish_id === id).reduce((a, l) => a + l.qty, 0);
  const change = (d: D, delta: number) => setCart((c) => {
    const i = c.findIndex((l) => l.dish_id === d.id);
    if (i < 0) return delta > 0 ? [...c, { dish_id: d.id, name: tr(d.name, d.name_i18n, lang), price: price(d), qty: 1, note: "" }] : c;
    const n = [...c]; n[i] = { ...n[i], qty: n[i].qty + delta }; return n.filter((l) => l.qty > 0);
  });
  async function send() {
    setSending(true); setMsg("");
    const { error } = await supabase.rpc("public_place_order", { _token: token!, _items: cart.map(({ dish_id, qty, note }) => ({ dish_id, qty, note })) });
    setSending(false);
    if (error) return setMsg(error.message);
    setCart([]); setMsg(u.sent); setOpen("mine"); refetch();
  }
  const list = orders ?? [];
  const bill = list.filter((o) => o.status !== "cancelled").reduce((a, o) => a + Number(o.total), 0);
  const count = cart.reduce((a, l) => a + l.qty, 0);

  return (
    <>
      <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center gap-2 px-4" style={style}>
        <button onClick={() => setOpen("menu")} className="flex items-center gap-2 rounded-full bg-[var(--m-primary)] px-5 py-3 text-sm font-semibold text-[var(--m-bg)] shadow-lg"><ShoppingBag className="h-4 w-4" />{u.order}{count > 0 && ` (${count})`}</button>
        <button onClick={() => setOpen("mine")} className="rounded-full border border-[var(--m-primary)] bg-[var(--m-bg)] px-5 py-3 text-sm font-semibold text-[var(--m-primary)] shadow-lg">{u.mine}{list.length > 0 && ` · ${list.length}`}</button>
      </div>
      {open && (
        <div style={style} className="fixed inset-0 z-50 flex flex-col bg-[var(--m-bg)] text-[var(--m-primary)]" role="dialog" aria-modal="true">
          <div className="flex items-center justify-between border-b border-current/10 px-4 py-3">
            <div className="flex gap-1 text-sm">
              {(["menu", "mine"] as const).map((k) => <button key={k} onClick={() => setOpen(k)} className={`rounded-full px-3 py-1 ${open === k ? "bg-[var(--m-primary)] text-[var(--m-bg)]" : ""}`}>{k === "menu" ? u.order : u.mine}</button>)}
            </div>
            <span className="text-xs opacity-70">{u.table} {info.table_label}</span>
            <button onClick={() => setOpen(null)} aria-label="Fechar"><X className="h-5 w-5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-32 pt-3">
            {open === "menu" ? cats.map((c) => {
              const ds = dishes.filter((d) => d.category_id === c.id && d.available);
              if (!ds.length) return null;
              return <div key={c.id} className="mb-5"><p className="mb-2 text-xs font-semibold uppercase tracking-wider opacity-60">{tr(c.name, c.name_i18n, lang)}</p>
                {ds.map((d) => { const n = qty(d.id); const line = cart.find((l) => l.dish_id === d.id); return (
                  <div key={d.id} className="border-b border-current/10 py-2">
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{tr(d.name, d.name_i18n, lang)}</p><p className="text-xs opacity-70">{formatPrice(price(d), lang)}</p></div>
                      {n > 0 && <button aria-label="−" onClick={() => change(d, -1)} className="grid h-8 w-8 place-items-center rounded-full border border-current/30"><Minus className="h-4 w-4" /></button>}
                      {n > 0 && <span className="w-5 text-center text-sm font-semibold">{n}</span>}
                      <button aria-label={`${u.add} ${d.name}`} onClick={() => change(d, 1)} className="grid h-8 w-8 place-items-center rounded-full bg-[var(--m-primary)] text-[var(--m-bg)]"><Plus className="h-4 w-4" /></button>
                    </div>
                    {opt.notes && line && <input value={line.note} maxLength={200} placeholder={u.note} onChange={(e) => setCart((cs) => cs.map((l) => l.dish_id === d.id ? { ...l, note: e.target.value } : l))} className="mt-2 w-full rounded-md border border-current/20 bg-transparent px-2 py-1 text-xs" />}
                  </div>); })}
              </div>;
            }) : (
              <div className="space-y-3">
                {msg && <p className="text-sm font-semibold">{msg}</p>}
                {list.length === 0 && <p className="text-sm opacity-70">{u.empty}</p>}
                {list.map((o) => (
                  <div key={o.id} className="rounded-xl border border-current/15 p-3 text-sm">
                    <div className="mb-1 flex justify-between text-xs opacity-70"><span>{new Date(o.created_at).toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" })}</span>{opt.statuses && <span className="font-semibold">{ORDER_STATUS_LABEL[lang][o.status as keyof typeof ORDER_STATUS_LABEL.pt] ?? o.status}</span>}</div>
                    {(o.items as CartLine[]).map((l, i) => <p key={i}>{l.qty}× {l.name}{l.note ? <span className="opacity-60"> — {l.note}</span> : null}</p>)}
                  </div>
                ))}
                {opt.bill && list.length > 0 && <div className="flex justify-between border-t border-current/20 pt-3 font-semibold"><span>{u.bill}</span><span>{formatPrice(bill, lang)}</span></div>}
              </div>
            )}
          </div>
          {open === "menu" && count > 0 && (
            <div className="fixed inset-x-0 bottom-0 border-t border-current/10 bg-[var(--m-bg)] p-4">
              {msg && <p className="mb-2 text-xs">{msg}</p>}
              <button disabled={sending} onClick={send} className="w-full rounded-full bg-[var(--m-primary)] py-3 text-sm font-semibold text-[var(--m-bg)] disabled:opacity-60">{u.send} · {formatPrice(cartTotal(cart), lang)}</button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

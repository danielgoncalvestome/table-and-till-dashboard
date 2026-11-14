import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Lang } from "@/lib/i18n";
import { formatPrice } from "@/lib/menu";
import { ORDER_STATUS_LABEL, orderOptions, cartTotal, type CartLine } from "@/lib/orders";

const T = {
  pt: { title: "O meu pedido", order: "Pedir", note: "Nota (ex.: sem cebola)", emptyCart: "Toque num prato e em + para o adicionar.", sent: "Pedido enviado!", table: "Mesa", sentTitle: "Já pedido", bill: "Conta", noTable: "Mostre esta lista ao empregado para fazer o pedido.", remove: "Remover" },
  en: { title: "My order", order: "Order", note: "Note (e.g. no onion)", emptyCart: "Tap a dish and + to add it.", sent: "Order sent!", table: "Table", sentTitle: "Already ordered", bill: "Bill", noTable: "Show this list to your waiter to order.", remove: "Remove" },
};

/** Order list for the public menu. Always visible; sending to the kitchen only works on a table link (?t=token) with live orders on. */
export function TableOrdering({ cart, setCart, lang, style }: { cart: CartLine[]; setCart: React.Dispatch<React.SetStateAction<CartLine[]>>; lang: Lang; style: React.CSSProperties }) {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => { setToken(new URLSearchParams(window.location.search).get("t")); }, []);
  const { data: info } = useQuery({ queryKey: ["table-info", token], enabled: !!token, queryFn: async () => (await supabase.rpc("public_table_info", { _token: token! })).data?.[0] ?? null });
  const on = !!info?.orders_on;
  const { data: orders, refetch } = useQuery({ queryKey: ["table-orders", token], enabled: on, refetchInterval: 8000, queryFn: async () => (await supabase.rpc("public_table_orders", { _token: token! })).data ?? [] });
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");
  const u = T[lang];
  const opt = orderOptions(info?.options);
  const count = cart.reduce((a, l) => a + l.qty, 0);
  const list = orders ?? [];
  const bill = list.filter((o) => o.status !== "cancelled").reduce((a, o) => a + Number(o.total), 0);

  async function send() {
    if (!on) return setMsg(u.noTable);
    setSending(true); setMsg("");
    const { error } = await supabase.rpc("public_place_order", { _token: token!, _items: cart.map(({ dish_id, qty, note }) => ({ dish_id, qty, note })) });
    setSending(false);
    if (error) return setMsg(error.message);
    setCart([]); setMsg(u.sent); refetch();
  }

  return (
    <>
      <button onClick={() => { setMsg(""); setOpen(true); }} aria-label={u.title} style={style} className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[var(--m-primary)] text-[var(--m-bg)] shadow-xl transition-transform active:scale-90">
        <ShoppingBag className="h-6 w-6" />
        {count > 0 && <span key={count} className="absolute -right-1 -top-1 grid h-6 min-w-6 animate-in zoom-in-50 place-items-center rounded-full bg-[var(--m-accent)] px-1.5 text-[11px] font-bold text-[var(--m-bg)] duration-300">{count}</span>}
      </button>
      <div style={style} className={`fixed inset-0 z-50 transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} role="dialog" aria-modal="true" aria-hidden={!open}>
        <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
        <div className={`absolute inset-x-0 bottom-0 mx-auto flex max-h-[85vh] max-w-lg flex-col rounded-t-2xl bg-[var(--m-bg)] text-[var(--m-primary)] shadow-2xl transition-transform duration-300 ease-out ${open ? "translate-y-0" : "translate-y-full"}`}>
          <div className="flex items-center justify-between border-b border-current/10 px-5 py-4">
            <p className="font-semibold" style={{ fontFamily: "var(--m-font)" }}>{u.title}</p>
            {info && <span className="text-xs opacity-70">{u.table} {info.table_label}</span>}
            <button onClick={() => setOpen(false)} aria-label="Fechar"><X className="h-5 w-5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-3">
            {cart.length === 0 && <p className="py-6 text-center text-sm opacity-60">{u.emptyCart}</p>}
            {cart.map((l) => (
              <div key={l.dish_id} className="border-b border-current/10 py-3">
                <div className="flex items-center gap-3">
                  <span className="w-6 text-sm font-semibold">{l.qty}×</span>
                  <p className="min-w-0 flex-1 truncate text-sm">{l.name}</p>
                  <span className="text-sm opacity-70">{formatPrice(l.price * l.qty, lang)}</span>
                  <button aria-label={`${u.remove} ${l.name}`} onClick={() => setCart((c) => c.filter((x) => x.dish_id !== l.dish_id))} className="grid h-7 w-7 place-items-center rounded-full border border-current/25"><X className="h-3.5 w-3.5" /></button>
                </div>
                {on && opt.notes && <input value={l.note} maxLength={200} placeholder={u.note} onChange={(e) => setCart((cs) => cs.map((x) => x.dish_id === l.dish_id ? { ...x, note: e.target.value } : x))} className="mt-2 w-full rounded-md border border-current/20 bg-transparent px-2 py-1 text-xs" />}
              </div>
            ))}
            {on && list.length > 0 && (
              <div className="mt-5 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider opacity-60">{u.sentTitle}</p>
                {list.map((o) => (
                  <div key={o.id} className="rounded-xl border border-current/15 p-3 text-sm">
                    <div className="mb-1 flex justify-between text-xs opacity-70"><span>{new Date(o.created_at).toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" })}</span>{opt.statuses && <span className="font-semibold">{ORDER_STATUS_LABEL[lang][o.status as keyof typeof ORDER_STATUS_LABEL.pt] ?? o.status}</span>}</div>
                    {(o.items as CartLine[]).map((x, i) => <p key={i}>{x.qty}× {x.name}{x.note ? <span className="opacity-60"> — {x.note}</span> : null}</p>)}
                  </div>
                ))}
                {opt.bill && <div className="flex justify-between border-t border-current/20 pt-3 font-semibold"><span>{u.bill}</span><span>{formatPrice(bill, lang)}</span></div>}
              </div>
            )}
          </div>
          <div className="border-t border-current/10 p-4">
            {msg && <p className="mb-2 text-center text-xs">{msg}</p>}
            <button disabled={sending || cart.length === 0} onClick={send} className="w-full rounded-full bg-[var(--m-primary)] py-3 text-sm font-semibold text-[var(--m-bg)] disabled:opacity-50">{u.order}{cart.length > 0 && ` · ${formatPrice(cartTotal(cart), lang)}`}</button>
          </div>
        </div>
      </div>
    </>
  );
}

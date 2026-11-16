import { Bell, ChefHat, Info, Maximize2, Settings2, X } from "lucide-react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PageTitle } from "@/components/dash/ui";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurant } from "@/lib/restaurant";
import { formatPrice } from "@/lib/menu";
import { ORDER_STATUSES, ORDER_STATUS_LABEL, orderOptions, type CartLine } from "@/lib/orders";

export const Route = createFileRoute("/_authenticated/dashboard/orders")({
  head: () => ({ meta: [{ title: "Pedidos — MenuTap" }, { name: "description", content: "Pedidos ao vivo das mesas." }, { property: "og:title", content: "Pedidos — MenuTap" }, { property: "og:description", content: "Pedidos ao vivo das mesas." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  validateSearch: (s: Record<string, unknown>): { full?: 1 } => (s.full ? { full: 1 } : {}),
  component: Orders,
});

function enterFs() {
  const el = document.documentElement;
  if (!document.fullscreenElement && el.requestFullscreen) el.requestFullscreen().catch(() => {});
}
function exitFs() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}

function OrdersFull({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const k = (e: KeyboardEvent) => { if (e.key === "Escape" && !document.querySelector("[role=dialog]")) onClose(); };
    window.addEventListener("keydown", k);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", k); };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background animate-in fade-in duration-200" role="region" aria-label="Pedidos em ecrã inteiro">
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-primary shadow-[var(--shadow-tile)]"><ChefHat className="h-4 w-4" /></span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-sans text-lg font-semibold tracking-tight">Pedidos ao vivo</h1>
          <p className="text-xs text-muted-foreground">Atualiza em tempo real · Esc para sair</p>
        </div>
        <button aria-label="Fechar" onClick={onClose} className="rounded-full border-2 p-1.5 transition hover:rotate-90 hover:bg-muted"><X className="h-5 w-5" /></button>
      </header>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
    </div>
  );
}

function InfoTip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" aria-label={`Sobre: ${text}`} onClick={(e) => e.preventDefault()} className="grid h-4.5 w-4.5 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground">
          <Info className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-64 text-center leading-snug">{text}</TooltipContent>
    </Tooltip>
  );
}

function beep() {
  try { const ctx = new AudioContext(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value = 880; g.gain.value = 0.15; o.start(); o.stop(ctx.currentTime + 0.35); } catch { /* audio blocked */ }
}

function Orders() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { restaurant: r, refresh } = useRestaurant();
  const [full, setFull] = useState(!!search.full);
  const [showSettings, setShowSettings] = useState(false);
  const [filter, setFilter] = useState("open");
  useEffect(() => { try { if (localStorage.getItem("mt-orders-settings") === "1") setShowSettings(true); } catch { /* ignore */ } }, []);
  function toggleSettings() { setShowSettings((v) => { try { localStorage.setItem("mt-orders-settings", v ? "0" : "1"); } catch { /* ignore */ } return !v; }); }
  useEffect(() => { if (search.full) enterFs(); }, [search.full]);
  function openFull() { enterFs(); setFull(true); }
  function closeFull() { exitFs(); setFull(false); if (search.full) navigate({ to: "/dashboard/orders", search: {}, replace: true }); }
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

  const toggles: [keyof typeof opt, string, string][] = [
    ["statuses", "Estados do pedido", "Mostra botões em cada pedido para o marcar como Novo, Em preparação, Pronto, Entregue ou Cancelado."],
    ["sound", "Alerta sonoro", "Toca um som neste dispositivo sempre que entra um pedido novo."],
    ["notes", "Notas por prato", "Permite ao cliente escrever uma observação em cada prato (ex.: sem cebola) e mostra-a no pedido."],
    ["bill", "Conta da mesa", "Mostra o total acumulado dos pedidos de cada mesa, para fechar a conta."],
  ];

  const OPEN = ["new", "preparing", "ready"];
  const NEXT: Record<string, [string, string] | undefined> = { new: ["preparing", "Começar"], preparing: ["ready", "Pronto"], ready: ["delivered", "Entregar"] };
  const TONE: Record<string, string> = { new: "bg-st-seated", preparing: "bg-st-reserved", ready: "bg-st-free", delivered: "bg-muted-foreground", cancelled: "bg-destructive" };
  const all = orders ?? [];
  const visible = all.filter((o) => filter === "open" ? OPEN.includes(o.status) : filter === "all" || o.status === filter);
  const groups = new Map<string, { tableId: string | null; label: string; list: typeof all }>();
  for (const o of visible) { const k = o.table_id ?? "none"; if (!groups.has(k)) groups.set(k, { tableId: o.table_id, label: o.table_label, list: [] }); groups.get(k)!.list.push(o); }
  const ago = (iso: string) => { const m = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000)); return m < 1 ? "agora" : m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`; };
  const filterOpts: [string, string, number][] = [["open", "Em aberto", all.filter((o) => OPEN.includes(o.status)).length], ...ORDER_STATUSES.map((s) => [s, ORDER_STATUS_LABEL.pt[s], all.filter((o) => o.status === s).length] as [string, string, number]), ["all", "Todos", all.length]];

  const board = (
    <>
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-full border bg-card p-1 shadow-sm sm:inline-flex" role="tablist" aria-label="Filtrar por estado">
        {filterOpts.map(([k, l, n]) => (
          <button key={k} role="tab" aria-selected={filter === k} onClick={() => setFilter(k)} className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${filter === k ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
            {TONE[k] && <span className={`h-1.5 w-1.5 rounded-full ${TONE[k]}`} />}{l}<span className="tabular-nums opacity-60">{n}</span>
          </button>
        ))}
      </div>
      {groups.size === 0 && <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-14 text-center text-sm text-muted-foreground"><ChefHat className="h-6 w-6" />Sem pedidos neste filtro.</div>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[...groups.values()].map((g) => {
          const total = all.filter((o) => (o.table_id ?? "none") === (g.tableId ?? "none") && o.status !== "cancelled").reduce((a, o) => a + Number(o.total), 0);
          const hasNew = g.list.some((o) => o.status === "new");
          return (
            <section key={g.tableId ?? "none"} className={`min-w-0 rounded-2xl border bg-card shadow-sm transition hover:shadow-[var(--shadow-card-hover)] ${hasNew ? "ring-2 ring-st-seated/40" : ""}`}>
              <header className="flex items-center gap-3 border-b px-4 py-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-muted font-bold tabular-nums">{g.label}</span>
                <div className="min-w-0 flex-1"><p className="font-semibold">Mesa {g.label}</p><p className="text-xs text-muted-foreground">{g.list.length} {g.list.length === 1 ? "pedido" : "pedidos"}{opt.bill ? ` · ${formatPrice(total)}` : ""}</p></div>
                <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs" onClick={() => clearTable(g.tableId, g.label)}>Limpar</Button>
              </header>
              <div className="divide-y">
                {g.list.map((o) => {
                  const items = o.items as CartLine[];
                  const next = NEXT[o.status];
                  return (
                    <article key={o.id} className="p-4 text-sm">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold"><span className={`h-1.5 w-1.5 rounded-full ${TONE[o.status]} ${o.status === "new" ? "animate-pulse" : ""}`} />{ORDER_STATUS_LABEL.pt[o.status as keyof typeof ORDER_STATUS_LABEL.pt] ?? o.status}</span>
                        <span className="text-xs tabular-nums text-muted-foreground" title={new Date(o.created_at).toLocaleString("pt-PT")}>há {ago(o.created_at)} · {new Date(o.created_at).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <ul className="space-y-1">
                        {items.map((l, i) => (
                          <li key={i} className="flex gap-2"><span className="grid h-5 min-w-5 place-items-center rounded-md bg-muted px-1 text-xs font-bold tabular-nums">{l.qty}</span><span className="min-w-0 flex-1">{l.name}{opt.notes && l.note ? <span className="block text-xs italic text-muted-foreground">“{l.note}”</span> : null}</span></li>
                        ))}
                      </ul>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs font-semibold tabular-nums">{formatPrice(Number(o.total))}</span>
                        {opt.statuses && <div className="ml-auto flex items-center gap-1">
                          {o.status !== "cancelled" && o.status !== "delivered" && <Button size="sm" variant="ghost" className="h-7 rounded-lg px-2 text-xs text-muted-foreground" onClick={() => setStatus(o.id, "cancelled")}>Cancelar</Button>}
                          {next && <Button size="sm" className="h-7 rounded-lg px-3 text-xs" onClick={() => setStatus(o.id, next[0])}>{next[1]} →</Button>}
                          {!next && <Button size="sm" variant="outline" className="h-7 rounded-lg px-2 text-xs" onClick={() => setStatus(o.id, "new")}>Reabrir</Button>}
                        </div>}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );

  return (
    <div>
      <PageTitle icon={ChefHat} title="Pedidos" sub="Pedidos feitos pelos clientes através do link da mesa, ao vivo." action={<div className="flex items-center gap-2"><Button size="icon" variant="outline" aria-label="Configurações dos pedidos" aria-expanded={showSettings} onClick={toggleSettings} className={showSettings ? "bg-secondary text-primary" : ""}><Settings2 className="h-4 w-4" /></Button><Button size="sm" onClick={openFull}><Maximize2 className="h-4 w-4" />Ecrã inteiro</Button></div>} />
      {hasPlan === false && <div className="mb-4 rounded-xl border border-st-reserved/40 bg-card p-4 text-sm">Os pedidos pelo menu estão incluídos no plano <strong>Gestão e Reservas (19,90 €/mês)</strong>. Pode configurar já, mas só aparecem no menu com esse plano ativo.</div>}
      {showSettings && (
        <div className="mb-6 rounded-2xl border bg-card p-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <TooltipProvider delayDuration={200}>
            <label className="flex items-center justify-between gap-3 font-medium">
              <span className="flex items-center gap-1.5">Aceitar pedidos pelo menu<InfoTip text="Liga ou desliga os pedidos: quando ativo, os clientes podem pedir diretamente a partir do menu, através do link da mesa." /></span>
              <Switch checked={r.orders_enabled} onCheckedChange={(v) => saveOpt({ enabled: v })} />
            </label>
            <div className="mt-3 grid gap-2 sm:grid-cols-4">
              {toggles.map(([k, l, tip]) => (
                <label key={k} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
                  <span className="flex items-center gap-1.5">{l}<InfoTip text={tip} /></span>
                  <Switch checked={opt[k]} onCheckedChange={(v) => saveOpt({ [k]: v })} />
                </label>
              ))}
            </div>
          </TooltipProvider>
        </div>
      )}
      {board}
      {full && <OrdersFull onClose={closeFull}>{board}</OrdersFull>}
    </div>
  );
}

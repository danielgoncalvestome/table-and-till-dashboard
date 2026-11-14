import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  AlertTriangle, ArrowDown, ArrowUp, ArrowUpRight, BarChart3, BookOpen, CalendarPlus, CalendarDays, Check, CheckCircle2, ChefHat, Eye, EyeOff,
  Globe, LayoutGrid, Maximize2, Minimize2, Palette, Pencil, Plus, RotateCcw, Star, Users, Utensils, type LucideIcon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useRestaurant } from "@/lib/restaurant";
import { fetchEvents, summarize } from "@/lib/analytics";
import { useCatalog } from "@/lib/use-catalog";
import { Columns } from "@/components/dash/ui";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { trialWarning } from "@/lib/admin-alerts-rules";
import { useResData } from "@/components/res/data";
import { BLOCKING, STATUS_LABEL, hhmm, tableState, todayStr, type ResStatus } from "@/lib/reservations";
import { ORDER_STATUSES, ORDER_STATUS_LABEL, type CartLine } from "@/lib/orders";
import { formatPrice } from "@/lib/menu";
import { DEFAULT_LAYOUT, normalizeLayout, type LayoutItem, type SectionId } from "@/lib/overview-layout";

export const Route = createFileRoute("/_authenticated/dashboard/")({ head: () => ({ meta: [{ title: "Visão geral — MenuTap" }, { name: "description", content: "Reservas, pedidos, alertas e atalhos do restaurante num só ecrã." }, { property: "og:title", content: "Visão geral — MenuTap" }, { property: "og:description", content: "Reservas, pedidos, alertas e atalhos do restaurante num só ecrã." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }), component: Overview });

const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon" }).format(d);
const TITLES: Record<SectionId, string> = { actions: "Ações rápidas", status: "Estado do serviço", alerts: "Alertas", today: "Reservas de hoje", floor: "Ocupação da sala", orders: "Pedidos ao vivo", views: "Visualizações", kpis: "Indicadores", dishes: "Pratos mais vistos", ratings: "Avaliações" };
const ICONS: Record<SectionId, LucideIcon> = { actions: LayoutGrid, status: Globe, alerts: AlertTriangle, today: CalendarDays, floor: Users, orders: ChefHat, views: BarChart3, kpis: Eye, dishes: Utensils, ratings: Star };

function Box({ id, children, action, className = "" }: { id: SectionId; children: ReactNode; action?: ReactNode; className?: string }) {
  const Icon = ICONS[id];
  return (
    <section className={`flex h-full min-w-0 flex-col rounded-2xl border bg-card p-4 sm:p-5 ${className}`}>
      <header className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex min-w-0 items-center gap-2 font-sans text-sm font-semibold"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-secondary text-primary"><Icon className="h-3.5 w-3.5" /></span><span className="truncate">{TITLES[id]}</span></h2>
        {action}
      </header>
      <div className="min-w-0 flex-1">{children}</div>
    </section>
  );
}

function Donut({ parts, center, sub }: { parts: { v: number; cls: string }[]; center: ReactNode; sub: string }) {
  const total = parts.reduce((a, p) => a + p.v, 0) || 1;
  let acc = 0;
  const C = 2 * Math.PI * 40;
  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r="40" fill="none" strokeWidth="12" className="stroke-muted" />
        {parts.map((p, i) => { const len = (p.v / total) * C; const el = <circle key={i} cx="50" cy="50" r="40" fill="none" strokeWidth="12" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-acc} className={`${p.cls} transition-all duration-700`} />; acc += len; return el; })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center"><div><p className="font-display text-2xl leading-none">{center}</p><p className="text-[10px] text-muted-foreground">{sub}</p></div></div>
    </div>
  );
}

function Toggle({ icon: Icon, label, on, onChange, disabled }: { icon: LucideIcon; label: string; on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button disabled={disabled} onClick={() => onChange(!on)} className={`flex min-w-0 items-center gap-3 rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 disabled:opacity-50 ${on ? "border-primary/50 bg-primary/5" : ""}`}>
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}><Icon className="h-4 w-4" /></span>
      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{label}</span><span className="block text-xs text-muted-foreground">{on ? "Ligado" : "Desligado"}</span></span>
      <Switch checked={on} tabIndex={-1} className="pointer-events-none" />
    </button>
  );
}

function Overview() {
  const { lang } = useI18n();
  const pt = lang === "pt";
  const qc = useQueryClient();
  const { restaurant: r, refresh } = useRestaurant();
  const storeKey = `mt-overview-layout-${r.id}`;
  const [layout, setLayout] = useState<LayoutItem[]>(DEFAULT_LAYOUT);
  const [editing, setEditing] = useState(false);
  useEffect(() => { try { setLayout(normalizeLayout(JSON.parse(localStorage.getItem(storeKey) ?? "null"))); } catch { setLayout(DEFAULT_LAYOUT); } }, [storeKey]);
  const saveLayout = (l: LayoutItem[]) => { setLayout(l); localStorage.setItem(storeKey, JSON.stringify(l)); };
  const move = (i: number, d: number) => { const j = i + d; if (j < 0 || j >= layout.length) return; const l = [...layout]; [l[i], l[j]] = [l[j], l[i]]; saveLayout(l); };
  const patch = (i: number, p: Partial<LayoutItem>) => saveLayout(layout.map((x, k) => (k === i ? { ...x, ...p } : x)));

  const { data: ev } = useQuery({ queryKey: ["events", r.id], queryFn: () => fetchEvents(r.id) });
  const { data: cat } = useCatalog(r.id);
  const { data: ratings } = useQuery({ queryKey: ["rating-summary", r.id], queryFn: async () => (await supabase.rpc("dish_rating_summary", { _restaurant_id: r.id })).data ?? [] });
  const { data: paid } = useQuery({ queryKey: ["own-paid", r.created_by], enabled: !!r.created_by, queryFn: async () => ((await supabase.from("account_subscriptions").select("status").eq("user_id", r.created_by!).eq("environment", "live").in("status", ["active", "trialing", "past_due"])).data ?? []).length > 0 });
  const { data: orders, refetch: refetchOrders } = useQuery({ queryKey: ["orders", r.id], refetchInterval: 15000, queryFn: async () => (await supabase.from("table_orders").select("*").eq("restaurant_id", r.id).eq("cleared", false).order("created_at", { ascending: false })).data ?? [] });
  const { tables, res } = useResData(todayStr());
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(t); }, []);

  const s = ev ? summarize(ev) : null;
  const dishes = (cat?.dishes ?? []).filter((d) => !d.archived);
  const dishName = (id: string) => cat?.dishes.find((d) => d.id === id)?.name ?? "—";
  const daily = useMemo(() => {
    const keys = Array.from({ length: 14 }, (_, i) => dayKey(new Date(Date.now() - (13 - i) * 864e5)));
    const m = new Map(keys.map((k) => [k, 0]));
    for (const e of ev ?? []) if (e.event_type === "menu_view") { const k = dayKey(new Date(e.created_at)); if (m.has(k)) m.set(k, m.get(k)! + 1); }
    return { values: keys.map((k) => m.get(k)!), labels: keys.map((k) => k.slice(8)) };
  }, [ev]);
  const totalRatings = (ratings ?? []).reduce((a, x) => a + Number(x.total), 0);
  const avg = totalRatings ? (ratings ?? []).reduce((a, x) => a + Number(x.avg_stars) * Number(x.total), 0) / totalRatings : 0;
  const topRated = [...(ratings ?? [])].sort((a, b) => Number(b.avg_stars) - Number(a.avg_stars)).slice(0, 4);

  const active = tables.filter((t) => t.active);
  const states = active.map((t) => tableState(t.id, res, r.late_tolerance_minutes ?? 15, now).state);
  const cnt = { free: states.filter((x) => x === "free").length, reserved: states.filter((x) => x === "reserved" || x === "late").length, seated: states.filter((x) => x === "seated").length };
  const todayRes = res.filter((x) => x.status !== "cancelled");
  const upcoming = todayRes.filter((x) => (BLOCKING as string[]).includes(x.status)).slice(0, 6);
  const covers = todayRes.filter((x) => x.status !== "no_show").reduce((a, x) => a + x.party, 0);
  const hours = Array.from({ length: 12 }, (_, i) => i + 12);
  const perHour = hours.map((h) => todayRes.filter((x) => new Date(x.starts_at).getHours() === h).reduce((a, x) => a + x.party, 0));
  const openOrders = (orders ?? []).filter((o) => o.status !== "delivered" && o.status !== "cancelled");

  const alerts: { text: string; to?: "/dashboard/menus" | "/dashboard/design" | "/dashboard/subscription" | "/dashboard/reservations" | "/dashboard/orders"; level: "high" | "low" }[] = [];
  const tw = paid === undefined || r.is_demo ? null : trialWarning(r.trial_ends_at, paid);
  if (tw?.kind === "ending") alerts.push({ level: "high", text: `O período experimental termina ${tw.days === 0 ? "hoje" : `em ${tw.days} dia(s)`}. Subscreva para manter o menu online.`, to: "/dashboard/subscription" });
  if (tw?.kind === "expired") alerts.push({ level: "high", text: "O período experimental terminou e o menu não está visível.", to: "/dashboard/subscription" });
  if (!r.published) alerts.push({ level: "high", text: "O menu ainda não está publicado." });
  const late = res.filter((x) => tableState(x.table_id ?? "", res, r.late_tolerance_minutes ?? 15, now).state === "late" && x.table_id).length;
  if (late) alerts.push({ level: "high", text: `${late} reserva(s) atrasada(s) — possível não comparência.`, to: "/dashboard/reservations" });
  const noTable = todayRes.filter((x) => !x.table_id && (BLOCKING as string[]).includes(x.status)).length;
  if (noTable) alerts.push({ level: "high", text: `${noTable} reserva(s) de hoje sem mesa atribuída.`, to: "/dashboard/reservations" });
  const newOrders = (orders ?? []).filter((o) => o.status === "new").length;
  if (newOrders) alerts.push({ level: "high", text: `${newOrders} pedido(s) novo(s) por aceitar.`, to: "/dashboard/orders" });
  if (cat && dishes.length === 0) alerts.push({ level: "low", text: "Ainda não tem pratos. Adicione o primeiro.", to: "/dashboard/menus" });
  const noImg = dishes.filter((d) => !d.image_url).length;
  if (noImg) alerts.push({ level: "low", text: `${noImg} prato(s) sem fotografia.`, to: "/dashboard/menus" });
  const unverified = dishes.filter((d) => !d.allergens_verified).length;
  if (unverified) alerts.push({ level: "low", text: `${unverified} prato(s) com alergénios por confirmar.`, to: "/dashboard/menus" });
  const off = dishes.filter((d) => !d.available).length;
  if (off) alerts.push({ level: "low", text: `${off} prato(s) indisponíveis.`, to: "/dashboard/menus" });
  if (!r.logo_url) alerts.push({ level: "low", text: "Ainda não carregou o logótipo.", to: "/dashboard/design" });

  async function setFlag(upd: { published?: boolean; booking_enabled?: boolean; orders_enabled?: boolean }) {
    const { error } = await supabase.from("restaurants").update(upd).eq("id", r.id);
    if (error) return toast.error("Não foi possível guardar.");
    toast.success("Guardado"); refresh();
  }
  async function setResStatus(id: string, status: ResStatus) {
    await supabase.from("reservations").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["reservations", r.id] });
  }
  async function advanceOrder(id: string, status: string) {
    const flow = ORDER_STATUSES.filter((x) => x !== "cancelled");
    const next = flow[Math.min(flow.indexOf(status as (typeof flow)[number]) + 1, flow.length - 1)];
    await supabase.from("table_orders").update({ status: next, updated_at: new Date().toISOString() }).eq("id", id);
    refetchOrders();
  }

  const shortcuts = [
    { to: "/dashboard/reservations", search: { nova: 1 as const }, icon: CalendarPlus, label: "Nova reserva", cls: "bg-primary text-primary-foreground" },
    { to: "/dashboard/reservations", icon: LayoutGrid, label: "Sala", cls: "bg-secondary text-primary" },
    { to: "/dashboard/orders", icon: ChefHat, label: "Pedidos", cls: "bg-secondary text-primary", badge: newOrders },
    { to: "/dashboard/menus", icon: BookOpen, label: "Menus", cls: "bg-secondary text-primary" },
    { to: "/dashboard/design", icon: Palette, label: "Design", cls: "bg-secondary text-primary" },
    { to: "/dashboard/analytics", icon: BarChart3, label: "Análise", cls: "bg-secondary text-primary" },
  ] as const;

  const sections: Record<SectionId, ReactNode> = {
    actions: (
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {shortcuts.map((x) => (
          <Link key={x.label} to={x.to} search={"search" in x ? x.search : {}} className="group relative flex min-w-0 flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-sm">
            <span className={`grid h-10 w-10 place-items-center rounded-xl transition-transform group-hover:scale-110 ${x.cls}`}><x.icon className="h-5 w-5" /></span>
            <span className="w-full truncate text-xs font-medium">{x.label}</span>
            {"badge" in x && x.badge > 0 && <span className="absolute right-2 top-2 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] text-destructive-foreground">{x.badge}</span>}
          </Link>
        ))}
      </div>
    ),
    status: (
      <div className="grid gap-2 sm:grid-cols-3">
        <Toggle icon={Globe} label="Menu publicado" on={r.published} onChange={(v) => setFlag({ published: v })} />
        <Toggle icon={CalendarDays} label="Reservas online" on={!!r.booking_enabled} onChange={(v) => setFlag({ booking_enabled: v })} />
        <Toggle icon={ChefHat} label="Pedidos pelo menu" on={!!r.orders_enabled} onChange={(v) => setFlag({ orders_enabled: v })} />
      </div>
    ),
    alerts: alerts.length ? (
      <ul className="space-y-1.5">
        {alerts.map((a) => {
          const inner = <><span className={`h-2 w-2 shrink-0 rounded-full ${a.level === "high" ? "bg-destructive" : "bg-st-reserved"}`} /><span className="min-w-0 flex-1">{a.text}</span>{a.to && <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />}</>;
          return <li key={a.text}>{a.to ? <Link to={a.to} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-muted">{inner}</Link> : <div className="flex items-center gap-2.5 px-2 py-1.5 text-sm">{inner}</div>}</li>;
        })}
      </ul>
    ) : <p className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-primary" />Tudo em ordem.</p>,
    today: (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          {[["Reservas", todayRes.length], ["Pessoas", covers], ["Por chegar", upcoming.filter((x) => x.status !== "seated").length]].map(([l, v]) => <div key={l} className="rounded-xl bg-muted/60 p-2"><p className="font-display text-2xl">{v}</p><p className="text-[10px] uppercase tracking-wide text-muted-foreground">{l}</p></div>)}
        </div>
        <div className="flex h-12 items-end gap-0.5" title="Pessoas por hora">
          {perHour.map((v, i) => <div key={i} className="flex flex-1 flex-col items-center gap-0.5"><div className={`w-full rounded-sm ${new Date(now).getHours() === hours[i] ? "bg-primary" : "bg-primary/30"}`} style={{ height: `${(v / Math.max(1, ...perHour)) * 100}%`, minHeight: 2 }} /><span className="text-[8px] text-muted-foreground">{hours[i]}</span></div>)}
        </div>
        {upcoming.length ? (
          <ul className="divide-y">
            {upcoming.map((x) => (
              <li key={x.id} className="flex items-center gap-2 py-2 text-sm">
                <span className="w-11 shrink-0 font-mono text-xs">{hhmm(x.starts_at)}</span>
                <span className="min-w-0 flex-1 truncate"><strong className="font-medium">{x.name}</strong> <span className="text-muted-foreground">· {x.party} pax{x.table_id ? ` · Mesa ${tables.find((t) => t.id === x.table_id)?.label ?? "?"}` : ""}</span></span>
                {x.status === "seated"
                  ? <button onClick={() => setResStatus(x.id, "completed")} className="rounded-full border px-2.5 py-1 text-xs hover:bg-muted">Concluir</button>
                  : <><button onClick={() => setResStatus(x.id, "seated")} className="rounded-full bg-primary px-2.5 py-1 text-xs text-primary-foreground hover:opacity-90">Sentar</button><button aria-label="Não compareceu" title="Não compareceu" onClick={() => setResStatus(x.id, "no_show")} className="rounded-full border px-2 py-1 text-xs text-muted-foreground hover:bg-muted">✕</button></>}
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted-foreground">Sem reservas por chegar hoje.</p>}
        <Button asChild size="sm" className="w-full"><Link to="/dashboard/reservations" search={{ nova: 1 }}><Plus className="h-4 w-4" />Nova reserva</Link></Button>
      </div>
    ),
    floor: active.length ? (
      <div className="flex items-center gap-4">
        <Donut parts={[{ v: cnt.seated, cls: "stroke-st-seated" }, { v: cnt.reserved, cls: "stroke-st-reserved" }, { v: cnt.free, cls: "stroke-st-free" }]} center={`${Math.round(((cnt.seated + cnt.reserved) / active.length) * 100)}%`} sub="ocupação" />
        <ul className="min-w-0 flex-1 space-y-2 text-sm">
          {[["Livres", cnt.free, "bg-st-free"], ["Reservadas", cnt.reserved, "bg-st-reserved"], ["Ocupadas", cnt.seated, "bg-st-seated"]].map(([l, v, c]) => <li key={l as string} className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${c}`} /><span className="flex-1">{l}</span><strong>{v}</strong></li>)}
          <li><Link to="/dashboard/reservations" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">Abrir sala <ArrowUpRight className="h-3 w-3" /></Link></li>
        </ul>
      </div>
    ) : <p className="text-sm text-muted-foreground">Ainda não tem mesas. <Link to="/dashboard/reservations" className="text-primary hover:underline">Criar mesas</Link></p>,
    orders: openOrders.length ? (
      <ul className="space-y-2">
        {openOrders.slice(0, 5).map((o) => {
          const items = o.items as CartLine[];
          const step = ORDER_STATUSES.indexOf(o.status as (typeof ORDER_STATUSES)[number]);
          return (
            <li key={o.id} className={`rounded-xl border p-3 text-sm ${o.status === "new" ? "border-st-seated/60 bg-st-seated/5" : ""}`}>
              <div className="flex items-center justify-between gap-2"><strong>Mesa {o.table_label}</strong><span className="text-xs text-muted-foreground">{hhmm(o.created_at)} · {formatPrice(Number(o.total))}</span></div>
              <p className="truncate text-xs text-muted-foreground">{items.map((l) => `${l.qty}× ${l.name}`).join(", ")}</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex flex-1 gap-1">{[0, 1, 2, 3].map((i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />)}</div>
                <button onClick={() => advanceOrder(o.id, o.status)} className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs text-primary-foreground hover:opacity-90"><Check className="h-3 w-3" />{ORDER_STATUS_LABEL.pt[ORDER_STATUSES[Math.min(step + 1, 3)]]}</button>
              </div>
            </li>
          );
        })}
        {openOrders.length > 5 && <Link to="/dashboard/orders" className="block text-center text-xs text-primary hover:underline">Ver todos ({openOrders.length})</Link>}
      </ul>
    ) : <p className="text-sm text-muted-foreground">{r.orders_enabled ? "Sem pedidos em aberto." : "Os pedidos pelo menu estão desligados."}</p>,
    views: <Columns values={daily.values} labels={daily.labels} />,
    kpis: (
      <div className="grid grid-cols-3 gap-2">
        {[[Star, "Avaliação", totalRatings ? avg.toFixed(1) : "—"], [Eye, "Visualizações", s?.views ?? "—"], [Users, "Sessões", s?.sessions ?? "—"]].map(([I, l, v]) => { const Ic = I as LucideIcon; return <div key={l as string} className="rounded-xl bg-muted/60 p-3"><Ic className="h-4 w-4 text-primary" /><p className="mt-2 font-display text-2xl">{v as ReactNode}</p><p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">{l as string}</p></div>; })}
      </div>
    ),
    dishes: (s?.topDishes ?? []).length ? (
      <ol className="space-y-2.5">
        {(s?.topDishes ?? []).slice(0, 5).map(([k, v], i, arr) => (
          <li key={k} className="text-sm"><div className="flex justify-between gap-2"><span className="truncate"><span className="mr-2 text-muted-foreground">{i + 1}</span>{dishName(k)}</span><span className="text-muted-foreground">{v}</span></div><div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${(v / arr[0][1]) * 100}%` }} /></div></li>
        ))}
      </ol>
    ) : <p className="text-sm text-muted-foreground">Ainda sem dados.</p>,
    ratings: topRated.length ? (
      <div className="flex items-center gap-4">
        <Donut parts={[{ v: avg, cls: "stroke-star" }, { v: 5 - avg, cls: "stroke-transparent" }]} center={avg.toFixed(1)} sub={`${totalRatings} aval.`} />
        <ul className="min-w-0 flex-1 space-y-2 text-sm">
          {topRated.map((x) => <li key={x.dish_id} className="flex items-center justify-between gap-2"><span className="truncate">{dishName(x.dish_id)}</span><span className="flex shrink-0 items-center gap-1"><Star className="h-3.5 w-3.5 fill-star text-star" />{Number(x.avg_stars).toFixed(1)}</span></li>)}
        </ul>
      </div>
    ) : <p className="text-sm text-muted-foreground">Ainda sem avaliações.</p>,
  };

  const shown = editing ? layout : layout.filter((x) => !x.hidden);
  const dateLabel = new Date().toLocaleDateString(pt ? "pt-PT" : "en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow capitalize">{dateLabel}</p>
          <h1 className="mt-1 text-2xl md:text-4xl">Visão geral</h1>
        </div>
        <div className="flex gap-2">
          {editing && <Button size="sm" variant="ghost" onClick={() => saveLayout(DEFAULT_LAYOUT)}><RotateCcw className="h-4 w-4" />Repor</Button>}
          <Button size="sm" variant={editing ? "default" : "outline"} onClick={() => setEditing(!editing)} aria-label="Editar disposição">{editing ? <><Check className="h-4 w-4" />Concluir</> : <><Pencil className="h-4 w-4" />Editar</>}</Button>
        </div>
      </div>
      {editing && <p className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">Use as setas para mudar a ordem, o olho para mostrar/esconder e o ícone de tamanho para alternar entre meia largura e largura total.</p>}
      <div className="grid gap-4 lg:grid-flow-row-dense lg:grid-cols-2">
        {shown.map((item) => {
          const i = layout.findIndex((x) => x.id === item.id);
          return (
            <div key={item.id} className={`relative min-w-0 ${item.wide ? "lg:col-span-2" : ""} ${editing ? "rounded-2xl ring-2 ring-primary/30 ring-offset-2 ring-offset-background" : ""} ${item.hidden ? "opacity-40" : ""}`}>
              {editing && (
                <div className="absolute right-3 top-3 z-10 flex gap-1 rounded-lg border bg-background p-1 shadow-sm">
                  <EditBtn label="Subir" onClick={() => move(i, -1)} icon={ArrowUp} />
                  <EditBtn label="Descer" onClick={() => move(i, 1)} icon={ArrowDown} />
                  <EditBtn label={item.wide ? "Meia largura" : "Largura total"} onClick={() => patch(i, { wide: !item.wide })} icon={item.wide ? Minimize2 : Maximize2} />
                  <EditBtn label={item.hidden ? "Mostrar" : "Esconder"} onClick={() => patch(i, { hidden: !item.hidden })} icon={item.hidden ? EyeOff : Eye} />
                </div>
              )}
              <div className={editing ? "pointer-events-none select-none" : ""}><Box id={item.id}>{sections[item.id]}</Box></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EditBtn({ label, onClick, icon: Icon }: { label: string; onClick: () => void; icon: LucideIcon }) {
  return <button type="button" aria-label={label} title={label} onClick={onClick} className="grid h-7 w-7 place-items-center rounded-md hover:bg-muted"><Icon className="h-3.5 w-3.5" /></button>;
}

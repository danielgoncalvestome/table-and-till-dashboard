import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, ChevronRight, Clock, CreditCard, Globe, History, Inbox, LayoutDashboard, Megaphone, LayoutGrid, Mail, MailOpen, Minus, Plus, Reply, Search, Shield, SlidersHorizontal, Store, Timer, Trash2, Sparkles, TrendingUp, type LucideIcon } from "lucide-react";
import { ThemeToggle } from "@/lib/panel-theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { audit, useIsAdmin } from "@/lib/restaurant";
import { formatDate } from "@/lib/menu";
import { planByPrice, validPlanCents } from "@/lib/billing-rules";
import { usePlans } from "@/lib/use-plans";
import { useServerFn } from "@tanstack/react-start";
import { updatePlanPrice } from "@/utils/payments.functions";
import { activeSub, daysLeft, platformAlerts, type DeviceInfo } from "@/lib/admin-alerts-rules";
import { AlertDot } from "@/hooks/use-admin-alerts";
import { AiMenuImport } from "@/components/admin/AiMenuImport";
import { AnnouncementsAdmin } from "@/components/announce/AnnouncementsAdmin";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Administração — MenuTap" }, { name: "description", content: "Administração da plataforma MenuTap." }, { property: "og:title", content: "Administração — MenuTap" }, { property: "og:description", content: "Administração da plataforma MenuTap." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  validateSearch: (s: Record<string, unknown>): { s?: Key } => (KEYS.includes(s.s as Key) ? { s: s.s as Key } : {}),
  component: Admin,
});

type Key = "overview" | "restaurants" | "messages" | "announce" | "aimenu" | "platform" | "activity";
const KEYS: Key[] = ["overview", "restaurants", "messages", "announce", "aimenu", "platform", "activity"];
const SECTIONS: { key: Key; icon: LucideIcon; title: string; desc: string }[] = [
  { key: "overview", icon: LayoutGrid, title: "Resumo", desc: "Números e alertas" },
  { key: "restaurants", icon: Store, title: "Restaurantes", desc: "Estado, planos e prazos" },
  { key: "messages", icon: Mail, title: "Mensagens", desc: "Formulário de contacto" },
  { key: "announce", icon: Megaphone, title: "Avisos", desc: "Mensagem aos restaurantes" },
  { key: "aimenu", icon: Sparkles, title: "Menu com IA", desc: "Criar menu a partir de fotos" },
  { key: "platform", icon: SlidersHorizontal, title: "Plataforma", desc: "Período experimental e preços" },
  { key: "activity", icon: History, title: "Atividade", desc: "Últimas ações registadas" },
];
const card = "rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)] sm:p-5";

function Admin() {
  const { t, lang } = useI18n();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const qc = useQueryClient();
  const { data: isAdmin, isLoading } = useIsAdmin();
  const en = !!isAdmin;
  const { data: rs } = useQuery({ queryKey: ["admin-restaurants"], enabled: en, queryFn: async () => (await supabase.from("restaurants").select("*").order("created_at", { ascending: false })).data ?? [] });
  const { data: subs } = useQuery({ queryKey: ["admin-subs"], enabled: en, queryFn: async () => (await supabase.from("account_subscriptions").select("*").order("created_at", { ascending: false })).data ?? [] });
  const { data: msgs } = useQuery({ queryKey: ["admin-messages"], enabled: en, queryFn: async () => (await supabase.from("contact_submissions").select("*").order("created_at", { ascending: false })).data ?? [] });
  const { data: logs } = useQuery({ queryKey: ["admin-audit"], enabled: en, queryFn: async () => (await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(40)).data ?? [] });
  const { data: devs } = useQuery({ queryKey: ["admin-devices"], enabled: en, queryFn: async () => (await supabase.from("restaurant_devices").select("*")).data ?? [] });
  const { data: tables } = useQuery({ queryKey: ["admin-tables"], enabled: en, queryFn: async () => (await supabase.from("dining_tables").select("restaurant_id").eq("active", true)).data ?? [] });
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "paid" | "trial" | "draft" | "expired">("all");
  const [msgFilter, setMsgFilter] = useState<"all" | "unread">("unread");
  const [openMsg, setOpenMsg] = useState<string | null>(null);

  const unread = (msgs ?? []).filter((m) => !m.read).length;
  const deviceInfo = useMemo(() => {
    const m: Record<string, DeviceInfo> = {};
    for (const r of rs ?? []) m[r.id] = { devices: 0, submitted: null, tables: 0 };
    for (const d of devs ?? []) if (m[d.restaurant_id]) m[d.restaurant_id] = { ...m[d.restaurant_id], devices: d.devices_count ?? 0, submitted: d.submitted_tables ?? null };
    for (const tb of tables ?? []) if (m[tb.restaurant_id]) m[tb.restaurant_id].tables += 1;
    return m;
  }, [rs, devs, tables]);
  const alerts = useMemo(() => platformAlerts(rs ?? [], subs ?? [], unread, Date.now(), deviceInfo), [rs, subs, unread, deviceInfo]);
  const liveSubs = (subs ?? []).filter((s) => s.environment === "live" && ["active", "trialing", "past_due"].includes(s.status));
  const mrr = liveSubs.reduce((a, s) => a + (planByPrice(s.price_id)?.cents ?? 0), 0) / 100;

  const state = (r: NonNullable<typeof rs>[number]) => {
    if (r.is_demo) return "demo";
    if (activeSub(subs ?? [], r.created_by)) return "paid";
    if (!r.trial_ends_at) return "draft";
    return new Date(r.trial_ends_at).getTime() > Date.now() ? "trial" : "expired";
  };
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: 0, paid: 0, trial: 0, draft: 0, expired: 0, demo: 0 };
    for (const r of rs ?? []) { c.all++; c[state(r)]++; }
    return c;
  }, [rs, subs]); // eslint-disable-line react-hooks/exhaustive-deps
  const list = (rs ?? []).filter((r) => (filter === "all" || state(r) === filter) && `${r.name} ${r.slug}`.toLowerCase().includes(q.toLowerCase()));

  if (isLoading) return null;
  if (!isAdmin) return <div className="p-10 text-center"><p>403</p><Link to="/dashboard" className="text-primary underline">{t("nav.dashboard")}</Link></div>;

  const active = SECTIONS.find((s) => s.key === search.s) ?? SECTIONS[0];
  const go = (k: Key) => navigate({ search: { s: k }, replace: true });
  const badge: Partial<Record<Key, number>> = { overview: alerts.filter((a) => a.level !== "low").length, messages: unread };

  const stateLabel: Record<string, string> = { paid: "Pago", trial: "Experimental", draft: "Rascunho", expired: "Expirado", demo: "Demo" };
  const stateCls: Record<string, string> = { paid: "bg-primary/10 text-primary", trial: "bg-star/15 text-foreground", draft: "bg-muted text-muted-foreground", expired: "bg-destructive/10 text-destructive", demo: "bg-muted text-muted-foreground" };

  async function toggleRead(id: string, read: boolean) {
    await supabase.from("contact_submissions").update({ read }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-messages"] }); qc.invalidateQueries({ queryKey: ["admin-alerts"] });
  }
  async function removeMsg(id: string) {
    if (!confirm(t("admin.delete") + "?")) return;
    await supabase.from("contact_submissions").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-messages"] }); qc.invalidateQueries({ queryKey: ["admin-alerts"] });
  }

  const shownMsgs = (msgs ?? []).filter((m) => msgFilter === "all" || !m.read);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 md:py-8">
        <header className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-tile)]"><Shield className="h-5 w-5" /></span>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">{t("admin.title")}</h1>
              <p className="truncate text-xs text-muted-foreground sm:text-sm">Gestão da plataforma MenuTap</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <Button asChild size="sm"><Link to="/dashboard"><LayoutDashboard /><span className="hidden sm:inline">Ir para o painel</span><span className="sm:hidden">Painel</span></Link></Button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="-mx-4 min-w-0 px-4 lg:sticky lg:top-6 lg:mx-0 lg:self-start lg:px-0">
            <ul className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] lg:flex-col lg:overflow-visible">
              {SECTIONS.map((s) => {
                const on = s.key === active.key; const n = badge[s.key] ?? 0;
                return <li key={s.key} className="shrink-0 lg:shrink">
                  <button onClick={() => go(s.key)} aria-current={on ? "page" : undefined}
                    className={`group flex w-full items-center gap-2.5 rounded-2xl border px-3 py-2 text-left transition-all lg:gap-3 lg:p-3 ${on ? "border-primary/40 bg-card shadow-[var(--shadow-card-hover)] ring-1 ring-primary/20" : "border-transparent bg-card/60 hover:bg-card hover:shadow-[var(--shadow-card)]"}`}>
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl lg:h-9 lg:w-9 ${on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-foreground"}`}><s.icon className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block whitespace-nowrap text-sm font-semibold">{s.title}</span>
                      <span className="hidden truncate text-xs text-muted-foreground lg:block">{s.desc}</span>
                    </span>
                    {n > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">{n}</span>}
                    <ChevronRight className={`hidden h-4 w-4 shrink-0 lg:block ${on ? "text-primary" : "text-muted-foreground/50"}`} />
                  </button>
                </li>;
              })}
            </ul>
          </aside>

          <section key={active.key} className="min-w-0 space-y-4 animate-in fade-in slide-in-from-bottom-1 duration-300">
            {active.key === "overview" && <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Kpi icon={Store} label="Restaurantes" value={(rs ?? []).filter((r) => !r.is_demo).length} onClick={() => go("restaurants")} />
                <Kpi icon={CreditCard} label="Subscrições" value={liveSubs.length} onClick={() => { setFilter("paid"); go("restaurants"); }} />
                <Kpi icon={Timer} label="Experimentais" value={counts.trial} onClick={() => { setFilter("trial"); go("restaurants"); }} />
                <Kpi icon={TrendingUp} label="Receita mensal" value={`${mrr.toFixed(2).replace(".", ",")} €`} />
              </div>
              <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
                <div className={card}>
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="h-4 w-4 text-muted-foreground" />Alertas<AlertDot n={badge.overview ?? 0} /></h2>
                  {alerts.length ? (
                    <ul className="max-h-80 space-y-1.5 overflow-y-auto pr-1">
                      {alerts.map((a, i) => {
                        const cls = a.level === "high" ? "bg-destructive" : a.level === "medium" ? "bg-star" : "bg-muted-foreground";
                        const inner = <><span className={`h-2 w-2 shrink-0 rounded-full ${cls}`} /><span className="min-w-0 flex-1 text-sm">{a.text}</span><ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" /></>;
                        const c = "flex items-center gap-2.5 rounded-xl border bg-background/50 px-3 py-2 transition hover:bg-muted";
                        return <li key={i}>{a.restaurantId ? <Link to="/admin/restaurants/$id" params={{ id: a.restaurantId }} className={c}>{inner}</Link> : <button onClick={() => go("messages")} className={`${c} w-full text-left`}>{inner}</button>}</li>;
                      })}
                    </ul>
                  ) : <Empty icon={CheckCircle2} text="Sem alertas. Tudo em ordem." />}
                </div>
                <div className={card}>
                  <h2 className="mb-3 text-sm font-semibold">Estado dos restaurantes</h2>
                  <div className="space-y-2.5">
                    {(["paid", "trial", "draft", "expired", "demo"] as const).map((k) => {
                      const pct = counts.all ? (counts[k] / counts.all) * 100 : 0;
                      return <button key={k} onClick={() => { if (k !== "demo") { setFilter(k); go("restaurants"); } }} className="block w-full text-left">
                        <div className="mb-1 flex justify-between text-xs"><span>{stateLabel[k]}</span><span className="font-semibold tabular-nums">{counts[k]}</span></div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} /></div>
                      </button>;
                    })}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <QuickBtn icon={Mail} label={`Mensagens${unread ? ` (${unread})` : ""}`} onClick={() => go("messages")} />
                    <QuickBtn icon={SlidersHorizontal} label="Plataforma" onClick={() => go("platform")} />
                  </div>
                </div>
              </div>
            </>}

            {active.key === "restaurants" && <div className={card}>
              <div className="mb-4 space-y-3">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Procurar por nome ou endereço…" className="h-10 w-full rounded-xl border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                </label>
                <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
                  {(["all", "paid", "trial", "draft", "expired"] as const).map((k) => (
                    <button key={k} onClick={() => setFilter(k)} className={`shrink-0 rounded-full border px-3 py-1 text-xs transition ${filter === k ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}>{k === "all" ? "Todos" : stateLabel[k]} <span className="opacity-70">{counts[k]}</span></button>
                  ))}
                </div>
              </div>
              {list.length ? <ul className="grid gap-2">
                {list.map((r) => {
                  const st = state(r); const sub = activeSub(subs ?? [], r.created_by);
                  const end = sub?.current_period_end ?? r.trial_ends_at; const d = end ? daysLeft(end) : null;
                  return <li key={r.id}>
                    <Link to="/admin/restaurants/$id" params={{ id: r.id }} className="group flex items-center gap-3 rounded-xl border bg-background/50 p-3 transition hover:-translate-y-0.5 hover:bg-card hover:shadow-[var(--shadow-card)]">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-bold text-primary">{r.name.slice(0, 1).toUpperCase()}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-2"><span className="truncate text-sm font-semibold">{r.name}</span><span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${stateCls[st]}`}>{stateLabel[st]}</span></div>
                        <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1"><Globe className="h-3 w-3" />/r/{r.slug}{r.published ? "" : " · não publicado"}</span>
                          {sub && <span className="inline-flex items-center gap-1"><CreditCard className="h-3 w-3" />{planByPrice(sub.price_id)?.name ?? "?"}</span>}
                          {end && <span className={`inline-flex items-center gap-1 ${d !== null && d <= 3 ? "text-destructive" : ""}`}><Clock className="h-3 w-3" />{formatDate(end, lang)} · {d} d</span>}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60 transition group-hover:translate-x-0.5" />
                    </Link>
                  </li>;
                })}
              </ul> : <Empty icon={Store} text="Nenhum restaurante encontrado." />}
            </div>}

            {active.key === "messages" && <div className={card}>
              <div className="mb-4 flex items-center justify-between gap-2">
                <div className="inline-flex rounded-full border bg-background p-0.5 text-xs">
                  {(["unread", "all"] as const).map((k) => <button key={k} onClick={() => setMsgFilter(k)} className={`rounded-full px-3 py-1 transition ${msgFilter === k ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{k === "unread" ? `Por ler (${unread})` : `Todas (${msgs?.length ?? 0})`}</button>)}
                </div>
              </div>
              {shownMsgs.length ? <ul className="grid gap-2">
                {shownMsgs.map((m) => {
                  const open = openMsg === m.id;
                  return <li key={m.id} className={`rounded-xl border bg-background/50 transition ${open ? "bg-card shadow-[var(--shadow-card)]" : ""}`}>
                    <button onClick={() => { setOpenMsg(open ? null : m.id); if (!m.read) toggleRead(m.id, true); }} className="flex w-full items-start gap-3 p-3 text-left">
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${m.read ? "bg-transparent" : "bg-primary"}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2"><span className={`truncate text-sm ${m.read ? "" : "font-semibold"}`}>{m.name}</span><span className="shrink-0 text-[11px] text-muted-foreground">{formatDate(m.created_at, lang)}</span></div>
                        <p className={`text-xs text-muted-foreground ${open ? "whitespace-pre-wrap" : "truncate"}`}>{open ? m.message : m.message}</p>
                      </div>
                    </button>
                    {open && <div className="flex flex-wrap gap-2 border-t px-3 py-2">
                      <Button asChild size="sm" variant="outline"><a href={`mailto:${m.email}`}><Reply />Responder</a></Button>
                      <Button size="sm" variant="ghost" onClick={() => toggleRead(m.id, !m.read)}>{m.read ? <MailOpen /> : <Mail />}{m.read ? t("admin.markUnread") : t("admin.markRead")}</Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeMsg(m.id)}><Trash2 />{t("admin.delete")}</Button>
                      <span className="ml-auto self-center truncate text-xs text-muted-foreground">{m.email}</span>
                    </div>}
                  </li>;
                })}
              </ul> : <Empty icon={Inbox} text={msgFilter === "unread" ? "Nenhuma mensagem por ler." : t("admin.noMessages")} />}
            </div>}

            {active.key === "announce" && <AnnouncementsAdmin restaurants={(rs ?? []).map((r) => ({ id: r.id, name: r.name }))} />}

            {active.key === "aimenu" && <AiMenuImport restaurants={(rs ?? []).map((r) => ({ id: r.id, name: r.name }))} />}
            {active.key === "platform" && <div className="grid gap-4 md:grid-cols-2">
              <div className={card}><TrialDaysCard /></div>
              <div className={card}><PlanPricesCard /></div>
            </div>}

            {active.key === "activity" && <div className={card}>
              {logs?.length ? <ol className="relative space-y-3 border-l pl-4">
                {logs.map((l) => <li key={l.id} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-primary" />
                  <p className="text-sm"><span className="font-medium">{l.action}</span>{l.restaurant_id && <span className="text-muted-foreground"> · {rs?.find((r) => r.id === l.restaurant_id)?.name}</span>}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(l.created_at, lang)}</p>
                </li>)}
              </ol> : <Empty icon={History} text="Sem atividade registada." />}
            </div>}
          </section>
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, onClick }: { icon: LucideIcon; label: string; value: React.ReactNode; onClick?: () => void }) {
  return <button onClick={onClick} disabled={!onClick} className={`${card} group text-left transition enabled:hover:-translate-y-0.5 enabled:hover:shadow-[var(--shadow-card-hover)]`}>
    <div className="flex items-center justify-between gap-2"><p className="truncate text-xs text-muted-foreground">{label}</p><span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span></div>
    <p className="mt-2 truncate text-xl font-bold tabular-nums sm:text-2xl">{value}</p>
  </button>;
}
function QuickBtn({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return <button onClick={onClick} className="flex items-center gap-2 rounded-xl border bg-background/50 px-3 py-2 text-xs font-medium transition hover:bg-muted"><Icon className="h-4 w-4 text-primary" /><span className="truncate">{label}</span></button>;
}
function Empty({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return <div className="grid place-items-center gap-2 rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground"><Icon className="h-6 w-6" />{text}</div>;
}

function TrialDaysCard() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { data: s } = useQuery({ queryKey: ["platform_settings"], queryFn: async () => (await supabase.from("platform_settings").select("*").eq("id", 1).single()).data });
  const [days, setDays] = useState(10);
  useEffect(() => { if (s) setDays(s.trial_days); }, [s]);
  async function save() {
    const { error } = await supabase.from("platform_settings").update({ trial_days: days, updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) return toast.error(t("common.error"));
    await audit("platform.settings", null, { trial_days: days });
    toast.success(t("common.saved"));
    qc.invalidateQueries({ queryKey: ["platform_settings"] });
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><Timer className="h-4 w-4" /></span><div><h3 className="text-sm font-semibold">{t("admin.trial")}</h3><p className="text-xs text-muted-foreground">Dias grátis para novos restaurantes</p></div></div>
      <div className="flex items-center gap-2">
        <Button size="icon" variant="outline" onClick={() => setDays((d) => Math.max(0, d - 1))}><Minus /></Button>
        <Input type="number" min={0} max={365} className="text-center text-lg font-semibold" value={days} onChange={(e) => setDays(Number(e.target.value))} />
        <Button size="icon" variant="outline" onClick={() => setDays((d) => Math.min(365, d + 1))}><Plus /></Button>
      </div>
      <div className="flex flex-wrap gap-1.5">{[7, 10, 14, 30].map((n) => <button key={n} onClick={() => setDays(n)} className={`rounded-full border px-3 py-1 text-xs ${days === n ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{n} dias</button>)}</div>
      <Button className="w-full" disabled={!s || days === s.trial_days} onClick={save}>{t("common.save")}</Button>
    </div>
  );
}

function PlanPricesCard() {
  const plans = usePlans();
  const qc = useQueryClient();
  const update = useServerFn(updatePlanPrice);
  const [vals, setVals] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { setVals(Object.fromEntries(plans.map((p) => [p.priceId, (p.cents / 100).toFixed(2)]))); }, [plans.map((p) => p.cents).join()]); // eslint-disable-line react-hooks/exhaustive-deps
  async function save() {
    setBusy(true);
    try {
      for (const p of plans) {
        const cents = Math.round(Number(String(vals[p.priceId]).replace(",", ".")) * 100);
        if (cents === p.cents) continue;
        if (!validPlanCents(cents)) throw new Error(`Preço inválido em ${p.name}`);
        const r = await update({ data: { priceId: p.priceId, cents } });
        await audit("platform.plan_price", null, { price_id: p.priceId, cents, result: r });
        if (r.live !== "ok") toast.message(`${p.name}: atualizado no modo de teste; no modo real fica ativo depois de publicar.`);
      }
      toast.success("Preços guardados");
      qc.invalidateQueries({ queryKey: ["plan_prices"] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
    finally { setBusy(false); }
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><CreditCard className="h-4 w-4" /></span><div><h3 className="text-sm font-semibold">Preços dos planos</h3><p className="text-xs text-muted-foreground">€ por mês · aplica-se a novas subscrições</p></div></div>
      {plans.map((p) => (
        <div key={p.priceId} className="flex items-center gap-3 rounded-xl border bg-background/50 px-3 py-2">
          <Label className="min-w-0 flex-1 truncate">{p.name}</Label>
          <div className="relative w-28"><Input inputMode="decimal" className="pr-7 text-right" value={vals[p.priceId] ?? ""} onChange={(e) => setVals((v) => ({ ...v, [p.priceId]: e.target.value }))} /><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span></div>
        </div>
      ))}
      <Button className="w-full" disabled={busy} onClick={save}>{busy ? "A guardar…" : "Guardar preços"}</Button>
    </div>
  );
}

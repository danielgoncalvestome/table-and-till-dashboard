import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, ArrowRight, Clock, CreditCard, Mail, Search, Store, Timer } from "lucide-react";
import { ThemeToggle } from "@/lib/panel-theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { audit, useIsAdmin } from "@/lib/restaurant";
import { formatDate } from "@/lib/menu";
import { planByPrice } from "@/lib/billing-rules";
import { activeSub, daysLeft, platformAlerts } from "@/lib/admin-alerts-rules";
import { AlertDot } from "@/hooks/use-admin-alerts";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Administração — MenuTap" }, { name: "description", content: "Administração da plataforma MenuTap." }, { property: "og:title", content: "Administração — MenuTap" }, { property: "og:description", content: "Administração da plataforma MenuTap." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Admin,
});

const box = "rounded-2xl border bg-card p-6";

function Admin() {
  const { t, lang } = useI18n();
  const { data: isAdmin, isLoading } = useIsAdmin();
  const en = !!isAdmin;
  const { data: rs } = useQuery({ queryKey: ["admin-restaurants"], enabled: en, queryFn: async () => (await supabase.from("restaurants").select("*").order("created_at", { ascending: false })).data ?? [] });
  const { data: subs } = useQuery({ queryKey: ["admin-subs"], enabled: en, queryFn: async () => (await supabase.from("account_subscriptions").select("*").order("created_at", { ascending: false })).data ?? [] });
  const { data: msgs } = useQuery({ queryKey: ["admin-messages"], enabled: en, queryFn: async () => (await supabase.from("contact_submissions").select("*").order("created_at", { ascending: false })).data ?? [] });
  const { data: logs } = useQuery({ queryKey: ["admin-audit"], enabled: en, queryFn: async () => (await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(15)).data ?? [] });
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "paid" | "trial" | "draft" | "expired">("all");

  const unread = (msgs ?? []).filter((m) => !m.read).length;
  const alerts = useMemo(() => platformAlerts(rs ?? [], subs ?? [], unread), [rs, subs, unread]);
  const liveSubs = (subs ?? []).filter((s) => s.environment === "live" && ["active", "trialing", "past_due"].includes(s.status));
  const mrr = liveSubs.reduce((a, s) => a + (planByPrice(s.price_id)?.cents ?? 0), 0) / 100;

  const state = (r: NonNullable<typeof rs>[number]) => {
    if (r.is_demo) return "demo";
    if (activeSub(subs ?? [], r.created_by)) return "paid";
    if (!r.trial_ends_at) return "draft";
    return new Date(r.trial_ends_at).getTime() > Date.now() ? "trial" : "expired";
  };
  const list = (rs ?? []).filter((r) => (filter === "all" || state(r) === filter) && `${r.name} ${r.slug}`.toLowerCase().includes(q.toLowerCase()));

  if (isLoading) return null;
  if (!isAdmin) return <div className="p-10 text-center"><p>403</p><Link to="/dashboard" className="text-primary underline">{t("nav.dashboard")}</Link></div>;

  const stateLabel: Record<string, string> = { paid: "Pago", trial: "Experimental", draft: "Rascunho", expired: "Expirado", demo: "Demo" };
  const stateCls: Record<string, string> = { paid: "bg-accent text-accent-foreground", trial: "bg-secondary text-secondary-foreground", draft: "bg-muted text-muted-foreground", expired: "bg-destructive text-destructive-foreground", demo: "bg-muted text-muted-foreground" };

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-5 md:p-8">
      <div className="flex items-center justify-between">
        <Link to="/dashboard" className="text-sm text-muted-foreground">← {t("nav.dashboard")}</Link>
        <div className="flex items-center gap-2"><TrialDaysButton /><ThemeToggle /></div>
      </div>
      <div><p className="eyebrow">MenuTap</p><h1 className="mt-1 text-3xl md:text-4xl">{t("admin.title")}</h1></div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={Store} label="Restaurantes" value={(rs ?? []).filter((r) => !r.is_demo).length} />
        <Kpi icon={CreditCard} label="Subscrições ativas" value={liveSubs.length} />
        <Kpi icon={Timer} label="Em período experimental" value={(rs ?? []).filter((r) => state(r) === "trial").length} />
        <Kpi icon={Clock} label="Receita mensal (MRR)" value={`${mrr.toFixed(2).replace(".", ",")} €`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={box}>
          <h2 className="mb-4 flex items-center gap-2 font-sans text-sm font-semibold"><AlertTriangle className="h-4 w-4" />Alertas<AlertDot n={alerts.filter((a) => a.level !== "low").length} /></h2>
          {alerts.length ? (
            <ul className="max-h-72 space-y-2 overflow-y-auto pr-1 text-sm">
              {alerts.map((a, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${a.level === "high" ? "bg-destructive" : a.level === "medium" ? "bg-star" : "bg-muted-foreground"}`} />
                  {a.restaurantId ? <Link to="/admin/restaurants/$id" params={{ id: a.restaurantId }} className="hover:underline">{a.text}</Link> : <Link to="/admin/messages" className="hover:underline">{a.text}</Link>}
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">Sem alertas. Tudo em ordem.</p>}
        </section>
        <section className={box}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-sans text-sm font-semibold"><Mail className="h-4 w-4" />{t("admin.messages")}<AlertDot n={unread} /></h2>
            <Link to="/admin/messages" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">Ver todas <ArrowRight className="h-3 w-3" /></Link>
          </div>
          {msgs?.length ? (
            <ul className="divide-y text-sm">
              {msgs.slice(0, 4).map((m) => (
                <li key={m.id} className="py-2">
                  <div className="flex justify-between gap-2"><span className={m.read ? "" : "font-semibold"}>{m.name} <span className="font-normal text-muted-foreground">· {m.email}</span></span><span className="shrink-0 text-xs text-muted-foreground">{formatDate(m.created_at, lang)}</span></div>
                  <p className="truncate text-muted-foreground">{m.message}</p>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">{t("admin.noMessages")}</p>}
        </section>
      </div>

      <section className={box}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-sans text-sm font-semibold">{t("admin.restaurants")} ({list.length})</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="w-56 pl-8" placeholder="Procurar…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            {(["all", "paid", "trial", "draft", "expired"] as const).map((k) => (
              <button key={k} onClick={() => setFilter(k)} className={`rounded-full border px-3 py-1 text-xs ${filter === k ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{k === "all" ? "Todos" : stateLabel[k]}</button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground"><tr><th className="py-2">Restaurante</th><th>Estado</th><th>Plano</th><th>Fim experimental / renovação</th><th>Criado</th><th /></tr></thead>
            <tbody className="divide-y">
              {list.map((r) => {
                const st = state(r); const sub = activeSub(subs ?? [], r.created_by);
                const end = sub?.current_period_end ?? r.trial_ends_at;
                return (
                  <tr key={r.id} className="hover:bg-muted/50">
                    <td className="py-2.5"><Link to="/admin/restaurants/$id" params={{ id: r.id }} className="font-medium hover:underline">{r.name}</Link><div className="text-xs text-muted-foreground">/r/{r.slug} · {r.published ? "publicado" : "não publicado"}</div></td>
                    <td><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${stateCls[st]}`}>{stateLabel[st]}</span></td>
                    <td>{sub ? planByPrice(sub.price_id)?.name ?? "?" : "—"}</td>
                    <td>{end ? `${formatDate(end, lang)} (${daysLeft(end)} d)` : "—"}</td>
                    <td className="text-muted-foreground">{formatDate(r.created_at, lang)}</td>
                    <td className="text-right"><Button asChild size="sm" variant="ghost"><Link to="/admin/restaurants/$id" params={{ id: r.id }}>Abrir <ArrowRight /></Link></Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className={box}>
        <h2 className="mb-4 font-sans text-sm font-semibold">{t("admin.audit")}</h2>
        <ul className="divide-y text-sm">{logs?.map((l) => <li key={l.id} className="flex justify-between py-2"><span>{l.action}{l.restaurant_id && <span className="text-muted-foreground"> · {rs?.find((r) => r.id === l.restaurant_id)?.name}</span>}</span><span className="text-muted-foreground">{formatDate(l.created_at, lang)}</span></li>)}</ul>
      </section>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: typeof Store; label: string; value: React.ReactNode }) {
  return <div className={box}><div className="flex items-center justify-between"><p className="eyebrow">{label}</p><Icon className="h-4 w-4 text-muted-foreground" /></div><p className="mt-3 font-display text-3xl">{value}</p></div>;
}

function TrialDaysButton() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { data: s } = useQuery({ queryKey: ["platform_settings"], queryFn: async () => (await supabase.from("platform_settings").select("*").eq("id", 1).single()).data });
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState(10);
  useEffect(() => { if (s) setDays(s.trial_days); }, [s]);
  async function save() {
    const { error } = await supabase.from("platform_settings").update({ trial_days: days, updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) return toast.error(t("common.error"));
    await audit("platform.settings", null, { trial_days: days });
    toast.success(t("common.saved")); setOpen(false);
    qc.invalidateQueries({ queryKey: ["platform_settings"] });
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline"><Timer />{s?.trial_days ?? "…"} dias</Button></DialogTrigger>
      <DialogContent className="max-w-xs">
        <DialogHeader><DialogTitle>{t("admin.trial")}</DialogTitle></DialogHeader>
        <Label>Dias</Label><Input type="number" min={0} max={365} value={days} onChange={(e) => setDays(Number(e.target.value))} />
        <Button onClick={save}>{t("common.save")}</Button>
      </DialogContent>
    </Dialog>
  );
}

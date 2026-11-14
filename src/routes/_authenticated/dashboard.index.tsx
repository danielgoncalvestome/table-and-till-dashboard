import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "sonner";
import { AlertTriangle, ArrowUpRight, BarChart3, BookOpen, CheckCircle2, Eye, Palette, Star, Users } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useRestaurant } from "@/lib/restaurant";
import { fetchEvents, summarize } from "@/lib/analytics";
import { useCatalog } from "@/lib/use-catalog";
import { BarList, Columns } from "@/components/dash/ui";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { trialWarning } from "@/lib/admin-alerts-rules";

export const Route = createFileRoute("/_authenticated/dashboard/")({ head: () => ({ meta: [{ title: "Visão geral — MenuTap" }, { name: "description", content: "Consulte o estado e atividade do restaurante." }, { property: "og:title", content: "Visão geral — MenuTap" }, { property: "og:description", content: "Consulte o estado e atividade do restaurante." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }), component: Overview });

const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon" }).format(d);

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`min-w-0 rounded-2xl border bg-card p-4 sm:p-6 ${className}`}>{children}</section>;
}

function Overview() {
  const { t, lang } = useI18n();
  const pt = lang === "pt";
  const { restaurant: r, refresh } = useRestaurant();
  const { data: ev } = useQuery({ queryKey: ["events", r.id], queryFn: () => fetchEvents(r.id) });
  const { data: cat } = useCatalog(r.id);
  const { data: ratings } = useQuery({ queryKey: ["rating-summary", r.id], queryFn: async () => (await supabase.rpc("dish_rating_summary", { _restaurant_id: r.id })).data ?? [] });
  const { data: paid } = useQuery({ queryKey: ["own-paid", r.created_by], enabled: !!r.created_by, queryFn: async () => ((await supabase.from("account_subscriptions").select("status").eq("user_id", r.created_by!).eq("environment", "live").in("status", ["active", "trialing", "past_due"])).data ?? []).length > 0 });
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

  const alerts: { text: string; to?: "/dashboard/menus" | "/dashboard/design" | "/dashboard/subscription" }[] = [];
  const tw = paid === undefined || r.is_demo ? null : trialWarning(r.trial_ends_at, paid);
  if (tw?.kind === "ending") alerts.push({ text: pt ? `O período experimental termina ${tw.days === 0 ? "hoje" : `em ${tw.days} dia(s)`}. Subscreva um plano para manter o menu online.` : `Your free trial ends ${tw.days === 0 ? "today" : `in ${tw.days} day(s)`}. Subscribe to keep your menu online.`, to: "/dashboard/subscription" });
  if (tw?.kind === "expired") alerts.push({ text: pt ? "O período experimental terminou e o menu não está visível. Subscreva um plano." : "Your free trial has ended and the menu is hidden. Subscribe to a plan.", to: "/dashboard/subscription" });
  if (!r.published) alerts.push({ text: pt ? "O menu ainda não está publicado. O período experimental começa ao publicar." : "Your menu isn't published yet. The trial starts when you publish." });
  if (cat && dishes.length === 0) alerts.push({ text: pt ? "Ainda não tem pratos. Adicione o primeiro." : "No dishes yet. Add your first one.", to: "/dashboard/menus" });
  const noImg = dishes.filter((d) => !d.image_url).length;
  if (noImg) alerts.push({ text: pt ? `${noImg} prato(s) sem fotografia.` : `${noImg} dish(es) without a photo.`, to: "/dashboard/menus" });
  const unverified = dishes.filter((d) => !d.allergens_verified).length;
  if (unverified) alerts.push({ text: pt ? `${unverified} prato(s) com alergénios por confirmar.` : `${unverified} dish(es) with unconfirmed allergens.`, to: "/dashboard/menus" });
  const off = dishes.filter((d) => !d.available).length;
  if (off) alerts.push({ text: pt ? `${off} prato(s) marcados como indisponíveis.` : `${off} dish(es) marked unavailable.`, to: "/dashboard/menus" });
  if (!r.logo_url) alerts.push({ text: pt ? "Ainda não carregou o logótipo." : "You haven't uploaded a logo yet.", to: "/dashboard/design" });

  async function togglePublish() {
    const { error } = await supabase.from("restaurants").update({ published: !r.published }).eq("id", r.id);
    if (error) return toast.error(t("common.error"));
    toast.success(t("common.saved"));
    refresh();
  }

  const tiles = [
    { to: "/dashboard/menus", icon: BookOpen, title: t("dash.menus"), sub: pt ? `${dishes.length} itens` : `${dishes.length} dishes` },
    { to: "/dashboard/design", icon: Palette, title: t("dash.design"), sub: pt ? "Cores, logótipo e capa" : "Colours, logo and cover" },
    { to: "/dashboard/analytics", icon: BarChart3, title: t("dash.analytics"), sub: pt ? "Estatística detalhada" : "Detailed statistics" },
  ] as const;

  return (
    <div className="space-y-3 sm:space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{pt ? "Últimos 30 dias" : "Last 30 days"}</p>
          <h1 className="mt-1 text-2xl md:text-4xl">{t("dash.overview")}</h1>
        </div>
        <Button onClick={togglePublish} variant={r.published ? "outline" : "default"}>{r.published ? t("dash.unpublish") : t("dash.publish")}</Button>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {tiles.map((x) => (
          <Link key={x.to} to={x.to} className="group flex min-w-0 flex-col items-center gap-1.5 rounded-xl border bg-card p-3 text-center transition-all hover:-translate-y-0.5 hover:border-primary sm:items-start sm:rounded-2xl sm:p-6 sm:text-left">
            <div className="flex w-full items-start justify-center sm:justify-between">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary text-primary sm:h-11 sm:w-11 sm:rounded-xl"><x.icon className="h-4 w-4 sm:h-5 sm:w-5" /></span>
              <ArrowUpRight className="hidden h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary sm:block" />
            </div>
            <p className="w-full truncate text-xs font-semibold sm:mt-4 sm:font-display sm:text-xl sm:font-normal">{x.title}</p>
            <p className="hidden text-sm text-muted-foreground sm:block">{x.sub}</p>
          </Link>
        ))}
      </div>

      <Card>
        <h2 className="mb-3 flex items-center gap-2 font-sans text-sm font-semibold">{pt ? "Alertas" : "Alerts"}{alerts.length > 0 && <span className="rounded-full bg-destructive px-2 text-[11px] text-destructive-foreground">{alerts.length}</span>}</h2>
        {alerts.length ? (
          <ul className="space-y-2 text-sm">
            {alerts.map((a) => (
              <li key={a.text} className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                {a.to ? <Link to={a.to} className="hover:underline">{a.text}</Link> : <span>{a.text}</span>}</li>
            ))}
          </ul>
        ) : <p className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-primary" />{pt ? "Tudo em ordem." : "All good."}</p>}
      </Card>

      <Card>
        <h2 className="mb-4 font-sans text-sm font-semibold">{pt ? "Visualizações por dia (14 dias)" : "Views per day (14 days)"}</h2>
        <Columns values={daily.values} labels={daily.labels} />
      </Card>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Kpi icon={Star} label={pt ? "Avaliação" : "Rating"} value={totalRatings ? avg.toFixed(1) : "—"} hint={totalRatings ? (pt ? `${totalRatings} avaliações` : `${totalRatings} ratings`) : undefined} />
        <Kpi icon={Eye} label={t("ov.views")} value={s?.views ?? "—"} />
        <Kpi icon={Users} label={t("ov.sessions")} value={s?.sessions ?? "—"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <h2 className="mb-4 font-sans text-sm font-semibold">{t("ov.topDishes")}</h2>
          <BarList items={(s?.topDishes ?? []).slice(0, 5).map(([k, v]) => [dishName(k), v])} empty={t("ov.noData")} />
        </Card>
        <Card>
          <h2 className="mb-4 font-sans text-sm font-semibold">{pt ? "Pratos mais bem avaliados" : "Top rated dishes"}</h2>
          {topRated.length ? (
            <ul className="space-y-3 text-sm">
              {topRated.map((x) => (
                <li key={x.dish_id} className="flex items-center justify-between gap-2">
                  <span className="truncate">{dishName(x.dish_id)}</span>
                  <span className="flex shrink-0 items-center gap-1"><Star className="h-3.5 w-3.5 fill-star text-star" />{Number(x.avg_stars).toFixed(1)} <span className="text-muted-foreground">({x.total})</span></span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">{pt ? "Ainda sem avaliações." : "No ratings yet."}</p>}
        </Card>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, hint }: { icon: typeof Eye; label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="min-w-0 rounded-xl border bg-card p-3 sm:rounded-2xl sm:p-6">
      <div className="flex items-center justify-between gap-1"><p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground sm:eyebrow">{label}</p><Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground sm:h-4 sm:w-4" /></div>
      <p className="mt-1 font-display text-2xl sm:mt-3 sm:text-4xl">{value}</p>
      {hint && <p className="mt-1 hidden text-xs text-muted-foreground sm:block">{hint}</p>}
    </div>
  );
}

function QrCard() {
  const { t, lang } = useI18n();
  const { restaurant: r } = useRestaurant();
  const [origin, setOrigin] = useState("");
  const [png, setPng] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const url = `${origin}/r/${r.slug}`;
  useEffect(() => {
    if (!origin) return;
    QRCode.toDataURL(`${url}?src=qr`, { margin: 2, width: 1024, color: { dark: r.primary_color, light: "#FFFFFF" }, errorCorrectionLevel: "M" }).then(setPng);
  }, [origin, url, r.primary_color]);
  const download = () => { const a = document.createElement("a"); a.href = png; a.download = `${r.slug}-qr.png`; a.click(); };
  return (
    <Card>
      <h2 className="mb-4 font-sans text-sm font-semibold">{lang === "pt" ? "QR code e link do menu" : "Menu QR code & link"}</h2>
      {png && <img src={png} alt="QR" className="mx-auto w-36 rounded-lg" />}
      <div className="mt-4 flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 font-mono text-xs">
        <a href={url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate hover:underline">{url.replace(/^https?:\/\//, "")}</a>
        <Button size="icon" variant="ghost" aria-label={t("common.copy")} onClick={() => { navigator.clipboard.writeText(url); toast.success(t("common.copied")); }}><Copy /></Button>
      </div>
      <Button className="mt-3 w-full" variant="outline" onClick={download} disabled={!png}><Download />PNG</Button>
    </Card>
  );
}
